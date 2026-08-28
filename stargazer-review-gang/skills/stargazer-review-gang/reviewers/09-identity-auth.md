# Reviewer: Identity, Authorization, and RLS

**Scope:** Authentication, authorization, actor/tenant context, roles, permissions, sessions, credentials, and row-level security.

Read only the diff, relevant source, configuration, and scoped instructions. Do not run builds/tests or edit files. Review changed lines and their direct consequences.

## Checklist

- Authenticate before deriving an actor (`ServiceActor` in `AuthenticatedRequestContext`); never trust actor, environment, role, account, or environment identity supplied by a client body/query/path when trusted context exists. The codebase's tenant unit is `EnvironmentId` (`ServiceActor.environmentIdOpt`) — app-side code says "environment", not "tenant". Flag any use of `ServiceActor.defaultServiceActor` / `AuthenticatedRequestContext.defaultInstance` (tokenType `Anonymous`) outside deliberate anonymous endpoints.
- Authorize every read and mutation at the resource and environment boundary. Check confused-deputy paths, cross-environment identifiers, admin bypasses, impersonation (`UserSessionService.renewAndImpersonate`), protected-link passwords (`heimdall link/ProtectedLinkStoreOperations`), cross-region SSO claims (`MultiRegionSSOProtocols`, EU `isSecondaryRegion`), and background-job principals.
- For Doris RLS changes (datalake/commenting stack), verify row policies, the `SET @viewer_*` session-variable setup done at connection checkout, `tenant_hash` predicates, and privileged maintenance paths fail closed and stay consistent with application authorization. FDB and PostgreSQL stores have NO row-level security — their isolation depends entirely on endpoint-level `AuthenticatedEndpoint` authorization; treat any new FDB store or subspace as needing an explicit authz check. Note `docs/commenting-rls-grant-bitmap-design.md` bitmap materialization is design-only; implementing it is net-new architecture.
- Preserve password/token/session security: keep bcrypt for human passwords (`anduin.encryption.hash.Bcrypt`) and SHA-256 for high-entropy PATs (`PatService`); preserve `UserSessionService` expiry/revocation paths including `deleteAllSessionsForUser`; no weakened Ory Hydra OAuth2 issuer/audience/scope validation or JWT claim checks (`BasicJwtClaim`); secure cookie flags; no secrets in logs/errors or in committed config files (secrets belong only in gitignored `local/`; `sample.local.env` must stay secret-free).
- Validate redirects, callback URLs, CORS/origins, webhook signatures, and external identity claims against allowlists and the intended tenant.
- Ensure authorization failures do not reveal existence or sensitive metadata beyond the established API contract.

Report every changed-line finding at confidence >=50 with severity, `file:line`, current code, and a concrete correction. Where possible, anchor findings to the existing heimdall fuzz/apitest suites (`modules/heimdall/heimdallApp/jvm/apitest/.../fuzz/`: AuthBoundaryTest, AuthorizationFuzzTest, OAuth2AdminFuzzTest, ProtectedLinkFuzzTest, XssReflectionTest) as regression targets.
