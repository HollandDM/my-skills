# Reviewer: Tapir Endpoints

**Scope:** Backend (jvm/) and Frontend (js/)
**Model:** standard

Review Tapir endpoint patterns for server (jvm/) and client (js/). Apply Part A to jvm files, Part B to js files. No Tapir code → report "No Tapir endpoint code found — nothing to review."

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. Do NOT use Bash for compile/lint.
> Analyze **by reading files only**. Unsure → `[NITPICK]`, not `[BLOCKER]`.

---

## Part A: Server Patterns (jvm/)

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

---

## Part B: Client Patterns (js/)

### B1. Client Base Classes

API clients must extend appropriate base:

| Base class | When |
|-----------|------|
| `PublicEndpointClient` | Public endpoints (no auth) |
| `AuthenticatedEndpointClient` | Endpoints requiring auth |
| `AsyncEndpointClient` | Long-running ops w/ polling |

Flag:
- Raw `Fetch.fetch()`, `XMLHttpRequest`, `Ajax`, custom HTTP calls bypassing base clients — loses auth, rate limiting, telemetry
- Hand-built request/response parsing instead of Tapir-generated client methods (`toClientThrowDecodeAndSecurityFailures`)
- `PublicEndpointClient` used for auth-required endpoints
- Manual token handling (`localStorage.getItem("token")`) instead of `AuthenticationTokenService`

### B2. Error Handling

Client returns `Task[Either[E, O]]`. Both branches must be handled.

Flag:
- Missing `Left` branch — errors silently dropped
- `.toOption.get` or `.foreach` on Either results
- Swallowing errors w/ `.ignore` or empty catch
- Missing `Toast.error()` or equivalent user notification on failures

### B3. Loading State

Every API call should track loading state w/ `Var[Boolean]`.

Flag:
- API calls w/o loading state
- Loading flag not cleared on error path (stuck loading)
- Buttons/forms not disabled during loading

### B4. Task-to-Laminar Bridge

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