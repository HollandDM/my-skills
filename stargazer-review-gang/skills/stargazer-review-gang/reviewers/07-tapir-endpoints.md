# Reviewer: Tapir Endpoints

**Scope:** Backend (jvm/) and Frontend (js/)
**Model:** standard

Review Tapir endpoint patterns for server (jvm/) and client (js/). Apply Part A to jvm files, Part B to js files. No Tapir code → report "No Tapir endpoint code found — nothing to review."

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. Do NOT use Bash for compile/lint.
> Analyze **by reading files only**. Unsure → `[NITPICK]`, not `[BLOCKER]`.

---

## Part 0: Public API Hard Block (HIGHEST PRIORITY — CHECK FIRST)

**Rule:** Our work NEVER touches Stargazer's OpenAPI-exposed public API. That surface is owned by another team. Any diff line that adds, removes, modifies, renames, or reorders public API content → **`[BLOCKER]` confidence 100**, no exceptions, even if change "looks safe" / "just a comment" / "just a type tweak".

**Past incident:** Our work shipped public API changes → broke external consumers (npm `@anduintransaction/public-api-specs`, customer integrations). Hard block now mandatory.

### What counts as public API (flag if ANY match)

A diff touches public API if **any** of these is true on a changed line:

1. **File path** matches any:
   - `modules/brienne/**/PublicApiEndpoints.scala` (the 6 endpoint def objects: FundSub, DataRoom, Webhook, FundData, File, LongRequest)
   - `modules/brienne/**/endpoint/PublicApiEndpoints.scala` (base class)
   - `modules/brienne/**/server/*PublicApiServer.scala` (5 servers: Webhook, FundSub, FundData, DataRoom, Platform)
   - `modules/brienne/**/PublicApiServerModule.scala`
   - `modules/brienne/**/tapir/server/PublicApiTapirServerAuthentication.scala`
   - `apps/gondor/**/GondorPublicApiSchema.scala` (or `GondorPublicApiSchemaApp`)
   - `js/public-api-specs/**` (any file under generated public spec npm pkg)

2. **Symbol extends** `PublicApiEndpoints` — `object Foo extends PublicApiEndpoints`

3. **Symbol extends** `PublicApiTapirServerAuthentication`

4. **Tapir endpoint path** starts with `"api" / "v1"` — public surface URL prefix; internal endpoints never use this

5. **Method/object referenced** in `GondorPublicApiSchema.scala` `docs` Seq, or registered into `publicAPIServices` block in `GondorServer.scala`, or `PublicApiServerModule`

6. **`publicApiEndpoint` / `publicApiRoute`** call sites (defined in `PublicApiTapirServerAuthentication`)

7. **`BasePublicApiEndpoint`** type alias usages

### What action triggers BLOCKER

ANY mutation on the above:
- New endpoint def added
- Existing endpoint signature changed (path, method, request type, response type, error type, query/header params)
- DTO field added/removed/renamed/retyped on a type used in public endpoint I/O
- Endpoint removed or path renamed
- Auth scheme changed on public endpoint
- Route handler swap (`publicApiRoute` ↔ other handler)
- Schema/codec change on type reachable from public endpoint
- Reorder/rewire in `PublicApiServerModule` / `GondorServer.scala` `publicAPIServices`
- Generated spec under `js/public-api-specs/` modified by hand

### Output template (use verbatim)

```
- File: <path>
- Line: <line>
- Severity: [BLOCKER]
- Confidence: 100
- Issue: PUBLIC API CHANGE — out of scope for this team. Stargazer public API (OpenAPI-exposed, npm @anduintransaction/public-api-specs) owned by separate team. Past incident: similar change broke external consumers.
- Current code:
  ```scala
  <changed lines>
  ```
- Suggested fix:
  ```
  REVERT this change. Hand off to public API owners. Do not edit:
    - PublicApiEndpoints / *PublicApiEndpoints objects
    - *PublicApiServer / PublicApiTapirServerAuthentication
    - GondorPublicApiSchema docs Seq
    - js/public-api-specs/**
  If feature genuinely needs public surface change, file ticket with public API team — do not modify in this PR.
  ```
```

### NOT public API (skip Part 0, continue to Part A)

- Endpoints extending `AuthenticatedEndpoints` / `PublicEndpoints` (note: `PublicEndpoints` ≠ public API — means "no auth", still internal surface)
- Endpoints registered via `OpenApiServer` / `allDocumentedEndpoints` (internal docs only, served at `/internal-docs/`)
- Internal Tapir endpoints under `/api/internal/` or any non-`/api/v1/` path
- Any file under `js/internal-api-specs/`

> **If Part 0 fires, still run Part A/B for completeness — but Part 0 blocker takes precedence in final report ordering.**

---

## Part A: Server Patterns (jvm/)

### A0. Endpoint Pattern Selection

Stargazer has **5 endpoint patterns**. Wrong pattern → wrong durability/cancellation/latency profile. Match shape to job:

| Pattern | Server primitive | Use when | NOT for |
|---------|------------------|----------|---------|
| **Blocking** | `authRouteCatchError` / `authRouteForwardError` / `validateRoute*` | Single atomic result, wall-clock < timeout (~30s) | Long-running, large stream, multi-item w/ tracking |
| **NDJSON streaming** | `authNdjsonEndpoint` + `authNdjsonRouteCatchError` | Server pushes typed items incrementally; client wants progress; no durability needed; cancel on disconnect | Need durability across reload; need user-visible progress modal across pages |
| **SSE (text/event-stream)** | `authSseEndpoint` + Tapir `streamBinaryBody(ZioStreams)(CodecFormat.TextEventStream())` | LLM/agent token streams; browser `EventSource` consumer; `[DONE]` sentinel compat | Typed structured items (use NDJSON instead); multi-item batch tracking |
| **AsyncApiV2** | `asyncEndpoint` + `validateAsyncEnvironmentRoute` | Single long result (5s–30min), durable across reload, NATS-pushed completion | Streaming progress (NDJSON); multi-item w/ per-item status (BatchAction); <5s ops (blocking) |
| **BatchAction** | `BatchActionService.startBatchActionInternal` + `BatchActionEndpoints` | N items with per-item Succeeded/Failed/Cancelled, parallel fan-out, user reload-tolerant, post-execute step | Single op (use AsyncApiV2 / direct workflow); transient streams (NDJSON) |

**New code preference:** NDJSON > AsyncApiV2 for any *streaming* shape (no S3 round-trip, no 10s initial-poll delay, no GC, native cancel). AsyncApiV2 remains for single-result durable ops only — **flag new `asyncEndpoint` declarations** when result fits NDJSON (typed item stream).

**Cross-reference:** for BatchAction / AsyncApiV2 *workflow* internals (Temporal, FDB state, retry attrs) see reviewer 06 §8–§10.

Flag:
- New `asyncEndpoint` for a streaming/multi-item job → suggest `authNdjsonEndpoint`
- BatchAction used for single-item job → over-engineered, use AsyncApiV2 / blocking
- Custom polling loop where `AsyncEndpoint` framework exists
- Manual HTTP chunked writes / raw `Stream[Byte]` body where `authNdjsonEndpoint` exists

### A1. Endpoint & Server Base Classes

Endpoint def must extend `AuthenticatedEndpoints` (or `PublicEndpoints` w/ justification).
Server must extend `AuthenticatedValidationEndpointServer`.

Flag:
- Raw Tapir `endpoint` bypassing `authEndpoint` — missing auth
- Direct HTTP handling (Armeria, raw servlet, manual parsing) instead of Tapir endpoints
- Server not extending `AuthenticatedValidationEndpointServer`
- Missing `using val authorizationService: AuthorizationService`
- `PublicEndpoints` w/o comment explaining why no auth

### A2. Authorization Validators

Endpoints touching user-scoped resources need `AuthenticatedEndpointValidator`. Validator runs *before* service logic via `validateRoute*` handlers.

Flag:
- Mutation endpoints (create/update/delete) using `authRoute*` instead of `validateRoute*`
- `AuthenticatedEndpointValidator.empty` on sensitive ops
- Missing env validation on multi-tenant endpoints

### A3. Route Handler Selection

| Handler | Use when |
|---------|----------|
| `authRouteCatchError` | Default — hides internal errors |
| `authRouteForwardError` | Validation errors that should reach client |
| `validateRoute*` | Resource-level permission checks needed |
| `*WithEnv` variants | Multi-tenant endpoints |

Flag:
- `authRouteForwardError` on endpoints calling internal services — may leak SQL/stack traces
- `authRoute` (no CatchError) when errors could expose internals

### A4. Server Registration Completeness

App server files (e.g. `GondorServer.scala`, `ItoolsServer.scala`) wire module services into HTTP server. Module registers **both** sync and async → both must be present.

Flag:
- `module.X.services` registered but `module.X.asyncServices.flatMap(_.tapirServices)` missing — async HTTP endpoints silently unreachable. **Scan other modules registering both patterns** (e.g. `dataExtractServer.services` + `dataExtractServer.asyncServices.flatMap(_.tapirServices)`) and verify same pattern across ALL modules w/ async services.
- `asyncServices` registered in `*WorkflowModule` (Temporal) but **not** in matching `*Server` file (HTTP) — async reachable via Temporal but not HTTP.
- Inconsistent registration order — sync and async services should sit adjacent for readability.

Check: read full server file, grep `.asyncServices` in module defs. Every module defining `asyncServices` → verify server file has both `.services` and `.asyncServices.flatMap(_.tapirServices)`.

### A5. Identity & Input

Flag:
- User identity from body/params instead of `ctx.actor.userId` — allows impersonation
- Missing size/length limits on text fields, collections (DoS risk)
- Missing allowlist validation on enum-like string params
- Error messages with internal paths, SQL, stack traces, class names

### A6. JSON Body Codecs (Jsoniter)

Tapir `jsonBody[T]` requires `JsonValueCodec[T]`. Stargazer use **Jsoniter** infra (`anduin.jsoniter.*`). All endpoint request/response types must use Jsoniter derives — see reviewer 01 §10 for full rules.

Flag:
- Endpoint type missing `derives JsoniterCodec.WithDefaultsValue` (or appropriate marker) → compile fails or wrong wire format
- Sealed-trait endpoint type with subtype using different `JsoniterCodec.*` marker than parent → wire format mismatch (missing/duplicated discriminator)
- `import io.circe.*` / `deriveCodec` / `deriveCodecWithDefaults` on endpoint DTO → wrong library, switch to Jsoniter
- Endpoint payload typed `String` of JSON → use `RawJson`
- Custom field naming via inline `JsonValueCodec` → `JsoniterCodec.forProduct1/2/5` or `forProduct1WithAliases`
- Endpoint type also exposed in OpenAPI docs but missing `Schema[T]` → use `JsoniterCodecWithSchema.forProduct*` (combined codec + schema)
- `JsoniterUtils.encode` / `decode` (or any pooled `writeToString`/`readFromString`) called from inside an endpoint codec transform fn → reentrant corruption; use `RawJson.fromValue` / `RawJson.fromJson(s).as[T]` instead

### A7. NDJSON Streaming Endpoints

**Wire format:** `application/x-ndjson`. One JSON line per `\n`. Envelope ADT (`WireNdjsonEvent`, internal):
```
{"type":"item","data":{...}}     // intermediate payload
{"type":"error","message":"..."} // terminal failure
{"type":"complete"}              // terminal success
```

**Server primitive:**
```scala
val runTestsStream: BaseNdjsonAuthenticatedEndpoint[Params, GeneralServiceException, ResultRow] =
  authNdjsonEndpoint[Params, GeneralServiceException, ResultRow](path, TapirEndpointInfo(...))

// Wire route — impl returns Task[ZStream[Any, Throwable, T]]:
authNdjsonRouteCatchError(runTestsStream) { (params, ctx) =>
  service.runTestsStream(params, ctx.actor.userId)
}
```

**Codec requirements:** params `I`, error `E`, item `T` each need `JsonValueCodec[T]` (Jsoniter marker). `I`/`E` also need `Schema[T]`. Item type `T` does NOT need to be in same module as envelope — envelope codec bridges via `RawJson`.

**Error model (3 paths):**
1. **Pre-stream failure** (setup `impl` throws): `flatMapError` → `ServiceError(e)` → HTTP 500 typed JSON body. Client sees `Left(GeneralServiceException)`.
2. **Mid-stream failure** (source emits error / inter-item timeout): `catchAllCause` emits `{"type":"error","message":...}` as last frame, stream closes HTTP 200. Client parser yields `NdjsonEvent.Error(msg)`.
3. **Interrupt** (client disconnect): no terminal frame, stream closes abruptly. Server work cancelled via ZIO interrupt.

**Setup vs stream timeouts:** the `timeout` wraps only the **setup effect** (the `Task[ZStream[...]]` materialisation). The stream itself is **not** wrapped — `NdjsonByteStream.toBytes` enforces inter-item timeout instead. Long-running per-item compute is fine; long pause **between** items trips inter-item timeout.

Flag:
- `authNdjsonEndpoint` declared but server uses `authRouteCatchError` (or vice versa) — endpoint/route handler mismatch
- Item type `T` lacks `derives JsoniterCodec.*` → won't compile / wrong wire format
- NDJSON impl returning `ZStream[R, ...]` with `R != Any` — must be `ZStream[Any, Throwable, T]`; thread `R` via `ZIO.service` before stream construction
- NDJSON impl wrapping the **stream** in `.timeout(...)` — redundant; inter-item timeout handled in `NdjsonByteStream.toBytes`. Wrap setup `impl` instead.
- NDJSON used where blocking endpoint suffices (single item, `ZStream.succeed(x)` of length 1) — overhead w/o benefit, switch to `authRouteCatchError`
- Server returning `ZStream[Any, E, T]` (typed error channel) — must be `ZStream[Any, Throwable, T]`; use mid-stream failure path
- Per-item side effects without idempotency on a NDJSON job that may be retried by the user (no Temporal durability — caller WILL re-hit endpoint on disconnect). Document this contract.

### A8. SSE (Server-Sent Events) Endpoints

**Wire format:** `text/event-stream`. Frames separated by `\n\n`. Each frame = `data: <json>\n\n`. Server emits `data: [DONE]\n\n` sentinel. Non-`data:` lines (e.g. `event:`, `:` comment) silently dropped client-side.

**When to use SSE over NDJSON:**
- Browser `EventSource` consumer (built-in reconnect)
- LLM token-stream interop (`[DONE]` sentinel matches OpenAI-style)
- Heartbeat / keep-alive frames natural (`: heartbeat\n\n`)

**When NOT:**
- Typed structured items where client is ZIO/Scala — use NDJSON (cleaner envelope, native `Item/Error/Complete` ADT)
- Bidirectional or chunked binary — use NDJSON or WebSocket

**Discriminated event ADT:** SSE `StreamEvent` uses `JsoniterCodec.WithDefaultsAndDiscriminatorValue` + `JsoniterDiscriminator["type"]`. Subtypes must derive same marker (see reviewer 01 §10b).

Flag:
- SSE used for single-item or non-streaming response — switch to blocking
- SSE event type missing discriminator marker — wire format wrong
- SSE `data:` frame containing newlines (un-escaped JSON pretty-print) — breaks framing, must `noSpaces`
- Custom event-name `event: foo\ndata: ...` parsing — current `SSEParser` only handles `data:` lines; non-`data:` lines dropped. Don't rely on `event:` for routing.
- Missing heartbeat in long-idle SSE → connection drops; emit `: heartbeat\n\n` periodically

---

## Part B: Client Patterns (js/)

### B1. Client Base Classes

API clients must extend appropriate base:

| Base class | When |
|-----------|------|
| `PublicEndpointClient` | Public endpoints (no auth) |
| `AuthenticatedEndpointClient` | Endpoints requiring auth |
| `AsyncEndpointClient` | Long-running ops w/ polling (legacy AsyncApiV2) |

Flag:
- Raw `Fetch.fetch()`, `XMLHttpRequest`, `Ajax`, custom HTTP calls bypassing base clients — loses auth, rate limiting, telemetry
- Hand-built request/response parsing instead of Tapir-generated client methods (`toClientThrowDecodeAndSecurityFailures`)
- `PublicEndpointClient` used for auth-required endpoints
- Manual token handling (`localStorage.getItem("token")`) instead of `AuthenticationTokenService`

### B2. NDJSON / SSE Stream Clients

**NDJSON:**
```scala
// 1. Get raw byte stream — handles auth, rate limit, decode/security failures
val byteStream: Task[Either[E, ZStream[Any, Throwable, Byte]]] =
  client.toNdjsonStreamThrowDecodeAndSecurityFailures(ndjsonEndpoint)(params)

// 2. Decode envelope
val events: ZStream[Any, Throwable, NdjsonEvent[T]] =
  NdjsonParser.parse[T](byteStream)

// 3. Accumulate inline via scanLeft (no dedicated Accumulator class)
events.scanLeft(Seq.empty[T]) { (acc, event) =>
  event match {
    case NdjsonEvent.Item(x)    => acc :+ x
    case NdjsonEvent.Error(msg) => /* show error toast */ acc
    case NdjsonEvent.Complete   => acc
  }
}
```

**SSE:**
```scala
val byteStream: Task[Either[E, ZStream[Any, Throwable, Byte]]] =
  client.toSseStreamThrowDecodeAndSecurityFailures(sseEndpoint)(params)
val events: ZStream[Any, Throwable, StreamEvent] =
  SSEParser.parse(byteStream)
// Bridge to Laminar:
AirStreamUtils.zstreamToEventStream(events)
```

Flag:
- `toClientThrow*` (blocking variant) used on NDJSON / SSE endpoint — wrong shape, will hang or fail decode
- `Unsafe.unsafely` / manual `runtime.unsafe.run` consuming a `ZStream` — use `AirStreamUtils.zstreamToEventStream`
- NDJSON consumer ignoring `NdjsonEvent.Error(msg)` (only matches `Item`) — error frame silently dropped
- NDJSON consumer ignoring `NdjsonEvent.Complete` when result correctness depends on completion (e.g. cumulative count) — interrupt = stream end without `Complete`; must distinguish "completed normally" from "disconnected mid-stream"
- Custom byte→line parser instead of `NdjsonParser.parse` — duplicates UTF-8 + line-split + envelope decode
- Custom SSE parser instead of `SSEParser.parse` — must handle `\n\n` framing + `data:` prefix + `[DONE]` sentinel
- Missing `flatMapSwitch` on NDJSON / SSE consumer — page navigation leaks open HTTP stream
- NDJSON endpoint client returns `Task[T]` instead of `Task[Either[E, ZStream[Byte]]]` — wrong client method picked

### B3. Error Handling

Client returns `Task[Either[E, O]]`. Both branches must be handled.

Flag:
- Missing `Left` branch — errors silently dropped
- `.toOption.get` or `.foreach` on Either results
- Swallowing errors w/ `.ignore` or empty catch
- Missing `Toast.error()` or equivalent user notification on failures

### B4. Loading State

Every API call should track loading state w/ `Var[Boolean]`.

Flag:
- API calls w/o loading state
- Loading flag not cleared on error path (stuck loading)
- Buttons/forms not disabled during loading

### B5. Task-to-Laminar Bridge

Flag:
- `Unsafe.unsafely` or `runtime.unsafe.run` in component code — use `AirStreamUtils.taskToStream` or `ZIOUtils.runAsync`
- Missing `flatMapSwitch` for cancellation on navigation/re-trigger
- Rapid-fire API calls w/o debouncing (e.g. every keystroke)

---

## Diff-Bound Rule

Flag only issues on lines **added or modified in diff**. No critique of pre-existing untouched code. Pre-existing genuine issue (auth bypass, data leak, silent errors) → mention as `[NOTE]` only.

## Output Format

Per issue, report:
- **File**: path
- **Line**: number
- **Severity**: `[BLOCKER]` (auth bypass/data leak/silent error), `[SUGGESTION]` (missing validation/authz/error handling/loading), `[NITPICK]` (pattern deviation)
- **Confidence**: 0–100 (90+ certain, 70–89 strong signal, 50–69 suspicious, <50 don't report)
- **Issue**: convention violated
- **Current code**: fenced block w/ actual code from file (3-5 lines context)
- **Suggested fix**: fenced block w/ concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings w/o code blocks rejected by aggregator.