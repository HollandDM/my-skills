# Reviewer: Tapir Endpoints

**Scope:** Backend (jvm/) and Frontend (js/)
**Model:** standard

Review Tapir endpoint patterns for both server (jvm/) and client (js/) code. Apply Part A checks to jvm files and Part B checks to js files. If no Tapir server or client code is present, report "No Tapir endpoint code found — nothing to review."

**Do NOT run any build or compile commands** (`./mill compile`, `./mill checkStyle`, etc.).
Analyze by reading only. If unsure, report as `[NITPICK]`, not `[BLOCKER]`.

---

## Part A: Server Patterns (jvm/)

### A1. Endpoint & Server Base Classes

Every endpoint definition must extend `AuthenticatedEndpoints` (or `PublicEndpoints` with justification).
Every server must extend `AuthenticatedValidationEndpointServer`.

Flag:
- Raw Tapir `endpoint` that bypasses `authEndpoint` — missing auth
- Direct HTTP handling (Armeria handlers, raw servlet, manual request parsing) instead of Tapir endpoints
- Server not extending `AuthenticatedValidationEndpointServer`
- Missing `using val authorizationService: AuthorizationService`
- `PublicEndpoints` without a comment explaining why auth isn't needed

### A2. Authorization Validators

Endpoints accessing user-scoped resources need `AuthenticatedEndpointValidator`. The validator runs
*before* the service logic via `validateRoute*` handlers.

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

### A4. Identity & Input

Flag:
- User identity from request body/params instead of `ctx.actor.userId` — allows impersonation
- Missing size/length limits on text fields and collections (DoS risk)
- Missing allowlist validation on enum-like string parameters
- Error messages containing internal paths, SQL, stack traces, or class names

---

## Part B: Client Patterns (js/)

### B1. Client Base Classes

All API clients must extend the appropriate base:

| Base class | When |
|-----------|------|
| `PublicEndpointClient` | Public endpoints (no auth) |
| `AuthenticatedEndpointClient` | Endpoints requiring auth |
| `AsyncEndpointClient` | Long-running operations with polling |

Flag:
- Raw `Fetch.fetch()`, `XMLHttpRequest`, `Ajax`, or any custom HTTP calls bypassing base clients — loses auth, rate limiting, telemetry
- Hand-built request/response parsing instead of Tapir-generated client methods (`toClientThrowDecodeAndSecurityFailures`)
- `PublicEndpointClient` used for endpoints that require authentication
- Manual token handling (`localStorage.getItem("token")`) instead of `AuthenticationTokenService`

### B2. Error Handling

Client returns `Task[Either[E, O]]`. Both branches must be handled.

Flag:
- Missing `Left` branch — errors silently dropped
- `.toOption.get` or `.foreach` on Either results
- Swallowing errors with `.ignore` or empty catch
- Missing `Toast.error()` or equivalent user notification on failures

### B3. Loading State

Every API call should track loading state with a `Var[Boolean]`.

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

Only flag issues on lines **added or modified in the diff**. Do not critique pre-existing code the author didn't touch. If pre-existing code has a genuine issue (auth bypass, data leak, silent errors), mention it as a `[NOTE]` only.

## Output Format

For each issue found, report:
- **File**: path
- **Line**: number
- **Issue**: what convention is violated
- **Severity**: `[BLOCKER]` (auth bypass/data leak/silent error), `[SUGGESTION]` (missing validation/authz/error handling/loading), `[NITPICK]` (pattern deviation)
- **Fix**: specific change needed
