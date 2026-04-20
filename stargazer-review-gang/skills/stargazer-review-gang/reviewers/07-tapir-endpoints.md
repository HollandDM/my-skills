# Reviewer: Tapir Endpoints

**Scope:** Backend (jvm/) and Frontend (js/)
**Model:** standard

Review Tapir endpoint patterns for server (jvm/) and client (js/).

**Output style:** Caveman mode — drop articles/filler/pleasantries. Fragments OK. Technical terms + code exact. Apply Part A → jvm/, Part B → js/. No Tapir code? Report "No Tapir endpoint code found — nothing to review."

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. Do NOT use the Bash tool for compilation
> or linting. Analyze code **by reading files only**. If unsure, report as `[NITPICK]`, not `[BLOCKER]`.

---

## Part A: Server Patterns (jvm/)

### A1. Endpoint & Server Base Classes

Endpoints extend `AuthenticatedEndpoints` (or `PublicEndpoints` with justification). Servers extend `AuthenticatedValidationEndpointServer`.

Flag:
- Raw Tapir `endpoint` bypassing `authEndpoint` — missing auth
- Direct HTTP handling (Armeria handlers, raw servlet, manual request parsing) — use Tapir endpoints
- Server not extending `AuthenticatedValidationEndpointServer`
- Missing `using val authorizationService: AuthorizationService`
- `PublicEndpoints` without comment explaining why auth isn't needed

### A2. Authorization Validators

User-scoped resource endpoints need `AuthenticatedEndpointValidator`. Runs *before* service logic via `validateRoute*`.

Flag:
- Mutation endpoints (create/update/delete) using `authRoute*` instead of `validateRoute*`
- `AuthenticatedEndpointValidator.empty` on sensitive operations
- Missing environment validation on multi-tenant endpoints

### A3. Route Handler Selection

| Handler | Use when |
|---------|----------|
| `authRouteCatchError` | Default — hides internal errors |
| `authRouteForwardError` | Validation errors that should reach client |
| `validateRoute*` | Resource-level permission checks needed |
| `*WithEnv` variants | Multi-tenant endpoints |

Flag:
- `authRouteForwardError` on endpoints calling internal services — may leak SQL/stack traces
- `authRoute` (without CatchError) when errors could expose internals

### A4. Server Registration Completeness

Server files (e.g. `GondorServer.scala`, `ItoolsServer.scala`) wire modules into HTTP server. Module with **both** sync + async services → register both.

Flag:
- `module.X.services` registered but `module.X.asyncServices.flatMap(_.tapirServices)` missing — async HTTP endpoints silently unreachable. Scan for modules registering both (e.g. `dataExtractServer.services` + `dataExtractServer.asyncServices.flatMap(_.tapirServices)`); verify ALL modules with async services match.
- `asyncServices` in `*WorkflowModule` but **not** in `*Server` — reachable via Temporal, not HTTP.
- Inconsistent registration order — sync + async services should be adjacent.

To check: read full server file, grep `.asyncServices` in module defs. Every module with `asyncServices` → verify server includes both `.services` and `.asyncServices.flatMap(_.tapirServices)`.

### A5. Identity & Input

Flag:
- User identity from request body/params instead of `ctx.actor.userId` — allows impersonation
- Missing size/length limits on text fields and collections (DoS risk)
- Missing allowlist validation on enum-like string parameters
- Error messages containing internal paths, SQL, stack traces, or class names

---

## Part B: Client Patterns (js/)

### B1. Client Base Classes

All API clients extend appropriate base:

| Base class | When |
|-----------|------|
| `PublicEndpointClient` | Public endpoints (no auth) |
| `AuthenticatedEndpointClient` | Endpoints requiring auth |
| `AsyncEndpointClient` | Long-running operations with polling |

Flag:
- Raw `Fetch.fetch()`, `XMLHttpRequest`, `Ajax`, or custom HTTP calls bypassing base clients — loses auth, rate limiting, telemetry
- Hand-built request/response parsing instead of Tapir-generated client methods (`toClientThrowDecodeAndSecurityFailures`)
- `PublicEndpointClient` used for endpoints requiring authentication
- Manual token handling (`localStorage.getItem("token")`) instead of `AuthenticationTokenService`

### B2. Error Handling

Client returns `Task[Either[E, O]]`. Both branches must be handled.

Flag:
- Missing `Left` branch — errors silently dropped
- `.toOption.get` or `.foreach` on Either results
- Swallowing errors with `.ignore` or empty catch
- Missing `Toast.error()` or equivalent user notification on failures

### B3. Loading State

Every API call tracks loading state with `Var[Boolean]`.

Flag:
- API calls without corresponding loading state
- Loading flag not cleared in error path (stays loading forever)
- Buttons/forms not disabled during loading

### B4. Task-to-Laminar Bridge

Flag:
- `Unsafe.unsafely` or `runtime.unsafe.run` in component code — use `AirStreamUtils.taskToStream` or `ZIOUtils.runAsync`
- Missing `flatMapSwitch` for cancellation on navigation/re-trigger
- Rapid-fire API calls without debouncing (e.g., on every keystroke)

---

## Diff-Bound Rule

Flag only lines **added or modified in diff**. Don't critique pre-existing code author didn't touch. Pre-existing genuine issue (auth bypass, data leak, silent errors) → `[NOTE]` only.

## Output Format

For each issue found, report:
- **File**: path
- **Line**: number
- **Severity**: `[BLOCKER]` (auth bypass/data leak/silent error), `[SUGGESTION]` (missing validation/authz/error handling/loading), `[NITPICK]` (pattern deviation)
- **Confidence**: 0–100 (90+ certain, 70–89 strong signal, 50–69 suspicious, <50 don't report)
- **Issue**: what convention is violated
- **Current code**: fenced block from file (3-5 lines context)
- **Suggested fix**: fenced block, concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, AND nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings without code blocks rejected by aggregator.