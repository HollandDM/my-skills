# Gap Analysis — Stargazer Review Gang Specialists vs Live Codebase

**Date:** 2026-08-21
**Method:** 6 parallel verification agents compared all 14 specialist checklists against `/home/hoangdinh/Works/stargazer` at commit `ae0b524bcc0`. Every claim below is backed by a real file read or grep hit. Companion to the checklist edits applied in `skills/stargazer-review-gang/reviewers/`.

---

## Gap 1 — FDB CDC / Outbox subsystem had zero review coverage

**Checklist:** `05-fdb-patterns.md` → new §16
**Severity of omission:** High — this is a major write-path surface.

### What it is

FoundationDB record changes can be captured into change-data-capture events and consumed by listeners. The framework lives in:

```
platform/stargazerCore/jvm/src/anduin/fdb/record/cdc/
├── FDBRecordCdcStore.scala            # captures record changes as CDC events
├── FDBRecordCdcStoreProvider.scala    # two-part provider pattern for the CDC store itself
├── FDBRecordCdcFilter.scala           # per-store event filtering
├── FDBTypedCdcEvent.scala             # typed event envelope
└── listener/
    ├── FDBCdcEventListener.scala          # interface
    ├── FDBCdcEventListenerImpl.scala      # implementation
    ├── FDBCdcEventListenerActivity.scala  # Temporal activity driving the drain
    └── ... (7 files total)
```

The store class wires into the standard Record Layer machinery (`FDBRecordVersion`, `TupleRange`, index scans) and takes a `saveRecordDataInCdcEvent: GeneratedMessage => Boolean` predicate plus a `FDBRecordCdcFilter`:

```scala
// platform/stargazerCore/jvm/src/anduin/fdb/record/cdc/FDBRecordCdcStore.scala
final class FDBRecordCdcStore[S <: FDBRecordEnum](
  underlying: foundationdb.FDBRecordStore,
  saveRecordDataInCdcEvent: GeneratedMessage => Boolean,
  storeEventFilter: FDBRecordCdcFilter
)
```

Downstream consumers use the **outbox drain pattern**, wired in `GondorCommonWorkflowModule`:

```scala
// gondor/gondor/jvm/src/com/anduin/stargazer/module/GondorCommonWorkflowModule.scala
private given datalakeOutboxStoreProvider: FDBOperationProvider[DatalakeOutboxStoreOperations] =
  DatalakeOutboxStoreOperations.Production

private given saAuditOutboxDrainProvider: FDBOperationProvider[
  (SaProfileAuditLogStoreOperations, SaProfileAuditOutboxStoreOperations, SaProfileAuditOutboxChunkStoreOperations)
] = FDBOperations[(...)].Production
```

### Why it matters

- A CDC event written **outside the same transaction** as the business write loses atomicity — downstream consumers see changes that never committed, or miss changes that did.
- Listeners that do heavy work inline instead of draining async turn the CDC store into a bottleneck and can stall the Temporal activity driving them.
- Before this gap was filled, no reviewer looked at any of this.

### How the checklist covers it now

§16 flags `[BLOCKER]` CDC writes outside the business tx, `[SUGGESTION]` inline heavy work in listeners, and names the outbox provider wiring as the reference pattern.

---

## Gap 2 — FDB index-mapping variants beyond plain `FDBIndexMapping`

**Checklist:** `05-fdb-patterns.md` → §1 addition

### What it is

`FDBStoreProviderCompanion` defines four mapping families, not one:

```scala
// platform/stargazerCore/jvm/src/anduin/fdb/record/FDBStoreProviderCompanion.scala
type Mapping[K, M]              = FDBRecordMapping[K, M, S]
type AggregateMapping[K, M, R]  = FDBAggregateIndexMapping[K, M, R, S]
type IndexMapping[M]            = FDBIndexMapping[M, S]
type LuceneIndexMapping[K, M]   = FDBLuceneIndexMapping[K, M, S]
type KeyValueIndexMapping[K, V, M] = FDBKeyValueIndexMapping[K, V, M, S]

protected def aggregateMappingInstance[K: FDBTupleConverter, M: FDBRecordModel, R: FDBTupleConverter](
  index: Index): AggregateMapping[K, M, R] = FDBAggregateIndexMapping.instance(index)

protected def luceneMappingInstance[K: FDBTupleConverter, M: FDBRecordModel](
  index: Index): LuceneIndexMapping[K, M] = FDBLuceneIndexMapping.instance(index)
```

### Why it matters

All variants must obey the same version-sequence + `Initializer.rebuildAllFdbRecordIndexes` registration rules as plain indexes — an unregistered Lucene or aggregate index fails silently exactly like a plain one. Lucene indexes additionally carry full-text-search performance cost (analyzer config, segment merges) that reviewers should scrutinize on hot paths.

---

## Gap 3 — Doris group-commit routing (real prod-bug class, completely uncovered)

**Checklist:** `10-sql-databases.md` → new "Doris Group-Commit Rules" section
**Severity of omission:** Highest of all gaps — this fusion bug already happened once.

### What it is

Commenting writes opt into Doris's group-commit fast path via a dedicated terminator in the datalake dependency:

```
DorisMutate.transactAdminGroupCommit: ZIO[DorisRuntime, Throwable, A]
```

It routes **literal `INSERT … VALUES` programs** through a dedicated writer pool (`group_commit = sync_mode`) so Doris batch-commits them. From `build/versions.mill` (the pin commentary is the authoritative doc):

> Mixed programs are safe: Doris silently no-ops `group_commit` on UPDATE / INSERT…SELECT leaves, so a VALUES+UPDATE chain (e.g. reply + message-count bump) routes through the GC pool with only the VALUES leaves group-committed.

Six commenting tables carry a per-table property shadowing Doris's 10s default:

```sql
-- comment_revisions / _mentions / _message_views / _thread_watermarks /
-- _thread_activity / _notifications
"group_commit_interval_ms" = "100"
-- source: sql/main + Liquibase V9__comment_group_commit_interval_remaining.sql
```

A CI-enforced scalafix guard protects the insert shape:

> A new GroupCommitInsertShape scalafix rule (CI-enforced on doris-api) guards InsertValues-tagged builders against accidental sub-query regressions.

Notification fan-out bypasses SQL entirely: `CommentNotificationStreamLoad.fanOut` does post-commit group-commit JSON Stream Load in chunks (bounded at `MaxConcurrentLoads = 4`, 5000-row chunks).

### Why it matters

- Fusing a non-literal statement onto the group-commit path **silently loses the batch-commit benefit** — no error, just latency collapse under load. This exact mis-tagging caused a real bug (documented in versions.mill).
- Removing/reordering the `"group_commit_interval_ms"` table properties in a migration reverts clients to blocking up to 10s per eligible batch.
- Mis-tagged builders (`insertMentionIO` etc.) are `@deprecated` because they leave `root_resource_id/_type NULL` AND route off the fast path — production must use the `*Values` successors.

### How the checklist covers it now

Four concrete rules: flag mixed literal/non-literal fused batches, protect the interval properties, check Stream Load chunking/failure handling, treat insert-shape regressions as blockers.

---

## Gap 4 — EU multi-region migration drift

**Checklist:** `10-sql-databases.md` → new "Multi-Region (EU)" section

### What it is

The EU dev/secondary deployment runs with minimal infra:

```bash
./mill reStartEU        # port :8081, local/local-eu.conf, apps.gondor.gondorAppServerEU
```

With `isSecondaryRegion=true` and `isMinimalInfra=true`, the server **skips TiDB, Doris, and Datalake migrations** entirely (per AGENTS.md). Cross-region behavior has a dedicated test module: `gondor.gondor.jvm.multiregionit.testCached`.

### Why it matters

Schema drift between regions is *expected state*, not an anomaly. A migration written assuming every region runs it will break or silently diverge on EU. Conversely, region-gated behavior changes need multiregionit coverage or they ship untested.

---

## Gap 5 — `LaminarBridge`: the new React→Laminar migration path

**Checklist:** `08-frontend.md` → §9 rewritten
**Trigger:** commit `ae0b524bcc0` ("platform(client-side): new laminar-bridge for scalajs-react migration") landed days before this analysis; more migrations are coming.

### What it is

`design.anduin.bridge.LaminarBridge[Props]` (external artifact `design.anduin.ui::laminarBridge`, wired via `platform/webModules/dependency.mill`) replaces the old `ScalaComponent.builder` + `Backend` + `ReactiveWrapperR` boilerplate when migrating a React component to Laminar. The sole migrated component so far demonstrates every convention:

```scala
// platform/webFeatures/appNavigation/src/anduin/appnavigation/fundsub/AdminFundListR.scala
private val component = LaminarBridge[AdminFundListR] { propsSignal =>
  AdminFundListL(
    // Convention 1: derive reactive props via .map(...).distinct — always .distinct
    currentPageSignal   = propsSignal.map(_.currentPage).distinct,
    sortedFundsSignal   = propsSignal.map(_.funds).distinct,
    // Convention 2: read callbacks at EVENT time, not build time
    onUpdateSort = Observer[FundOrInvestmentSort] { sortOption =>
      propsSignal.now().onUpdateSort(sortOption).runNow()
    },
    ...
  )()
}
```

The in-repo comment states the invariant verbatim:

> Read the callbacks at event time, not build time — the React parent may have committed fresh closures since the Laminar tree was built.

### Why it matters

- Capturing `props.onThing` at build time freezes the first-render closure; after the React parent re-renders, the Laminar tree calls a stale callback — classic silent-staleness bug.
- Missing `.distinct` on derived signals causes redundant downstream emissions on every parent render.
- Reintroducing `ScalaComponent.builder`/`Backend`/`ReactiveWrapperR` in a migrated component defeats the migration.

### Scale context

Laminar dominates (~4773 files import it vs ~1777 for scalajs-react), but React code is still maintained, so both bridge styles coexist until migration completes.

---

## Gap 6 — `ServiceActor.defaultServiceActor`: the anonymous-principal footgun

**Checklist:** `09-identity-auth.md` → bullet 1 rewritten

### What it is

The auth actor type carries the environment (tenant) identity:

```scala
// platform/stargazerCore/jvm/src/anduin/service/ServiceActor.scala
final case class ServiceActor(
  userId: UserId,
  userInfo: UserInfo,
  userAttributes: UserAttributes,
  userSessionIdOpt: Option[UserSessionId],
  environmentIdOpt: Option[EnvironmentId],
  portalAllowed: Boolean,
  tokenType: AuthenticationTokenType
)

object ServiceActor {
  lazy val defaultServiceActor: ServiceActor =
    ServiceActor(UserId.defaultValue.get, UserInfo.DEFAULT, UserAttributes.DEFAULT,
      None, None, false, AuthenticationTokenType.Anonymous)   // ← Anonymous token
}
```

And its request-context twin:

```scala
// platform/stargazerCore/jvm/src/anduin/service/RequestContext.scala
object AuthenticatedRequestContext {
  val defaultInstance: AuthenticatedRequestContext = AuthenticatedRequestContext(
    ServiceActor.defaultServiceActor, None, Seq.empty, Seq.empty)
```

### Why it matters

Background jobs, impersonation flows, and convenience defaults can silently run as an `Anonymous` actor with `UserId.defaultValue`. The codebase's own NOTE says actors should only be created via `AuthorizationService.authenticateSession` — anything else deserves scrutiny. Also note the vocabulary trap: app-side code says **environment** (`EnvironmentId`); "tenant" appears only inside Doris RLS SQL. Reviewers grepping "tenant" find almost nothing app-side.

---

## Gap 7 — RLS exists only in Doris; FDB and PostgreSQL have none

**Checklist:** `09-identity-auth.md` → bullet 3 rewritten

### What it is

Row-level security is implemented as **Doris row policies** driven by session variables set at connection checkout (datalake/commenting stack only):

```sql
-- docs/commenting-rls-grant-bitmap-design.md
SET @viewer_grants_viewer = COALESCE((SELECT viewer_bitmap FROM permission_system.contact_grant_bitmaps
  WHERE tenant_hash=@viewer_tenant_hash AND viewer_contact_hash=@viewer_contact_hash
  AND resource_type=1), BITMAP_EMPTY());
```

Role tiers: 10 viewer / 20 writer / 30 owner. The bitmap-materialization optimization in that design doc is explicitly **design-only, not implemented** — a diff "implementing" it is net-new architecture, not maintenance.

### Why it matters

FoundationDB and PostgreSQL stores have **no row security at all**. Their isolation depends entirely on endpoint-level authorization (`AuthenticatedEndpoint` validators, `AuthorizationService`). Consequence for reviewers: any **new FDB store or subspace** needs an explicit authz check somewhere in its access path, because nothing at the storage layer will stop a cross-environment read. The old checklist wording ("connection/session role setup") implied a generic SQL RLS model that doesn't match reality.

---

## Gap 8 — Protobuf `TypeMapper` substitutes defaults instead of failing

**Checklist:** `03-foundations.md` → §5 corrected

### What it is

The old checklist said TypeMapper "silently drops fields." Wrong mechanism, same risk class. Reality, documented at a production call site:

```scala
// modules/checkreview/checkreview/jvm/src/anduin/checkreview/service/CheckRunQueryService.scala
// `systemActor`'s id string is not a parseable UserId: BOTH the FDB row mapper and the Temporal payload
// TypeMapper silently degrade it to `UserId.defaultValue` (all-zeros) on decode. Attribution therefore keys on
// `triggerKind`, never `triggeredBy`; ...
```

An unparsable typed ID decodes to `UserId.defaultValue` — data looks valid, is wrong. Downstream filters like `triggeredBy == systemActor` silently never match persisted values.

### Why it matters

This is worse than dropping fields: corrupted values flow through validation, get persisted, and poison equality-based logic. Reviewers must flag new TypeMapper-based transports where decode failure is possible and unhandled.

Also added to §5: the proto storage-envelope invariant — the record message must be named exactly `RecordTypeUnion` per file (enforced by FDB Record Layer runtime lookup; collision notes live in e.g. `checkreview/lp_review_summary.proto`).

---

## Gap 9 — `ZIOBaseSpec` is the real unit-test base, not `ZIOSpecDefault`

**Checklist:** `11-testing.md` → §1 table + sequential flag corrected

### What it is

```scala
// platform/stargazerTest/shared/src/anduin/testing/ZIOBaseSpec.scala
/** Base class for ZIO Test unit specs.
  *
  * Applies [[TestAspect.sequential]] spec-wide so tests within a suite run one at a time. Different spec objects still
  * run in parallel across JVM workers (controlled by `-j` at the runner level), matching the "suites parallel, tests
  * sequential" model used by [[ZIOBaseInteg]] via `sequentialSuite`.
  */
abstract class ZIOBaseSpec extends ZIOSpecDefault {
  override def aspects = super.aspects ++ Chunk(TestAspect.sequential)
}
```

930 suites extend `ZIOBaseSpec`; only 154 extend raw `ZIOSpecDefault`. There is **no `UnitSpec`** anywhere in the repo — ScalaTest tests extend `AnyWordSpec`/`WordSpec` `with Matchers` directly.

### Why it matters

The old checklist told reviewers to flag shared `var` state without `@@ TestAspect.sequential` as `[BLOCKER]` — but for the 930 `ZIOBaseSpec` suites that aspect is already applied spec-wide, so the flag would be noise. It's only meaningful for raw `ZIOSpecDefault` suites. And the phantom `UnitSpec` row would send reviewers hunting for a base class that doesn't exist.

Related correction: multi-region tests don't need a `-j1` runner flag anymore — order-dependent suites belong in the dedicated sequential module `gondor.gondor.jvm.multiregionitseq` (`AnduinSequentialIntegTests`), which sits alongside plain `multiregionit`.

---

## Gap 10 — Five enforced scalafix rules missing from the Scala-quality checklist

**Checklists:** `01-scala-quality.md`, `04-scala-anti-slop.md`

### What they are

From `.scalafix.conf` (all lint-error level):

```
InterpolationToStringWarn   # s"...$x" warnings policy
ObjectSelfType              # self-type conventions
WarnUnusedCode              # writes out/unused.json (feeds WarnUnusedCode/RemoveUnusedCode workflow)
NoDorisRuntimeLeakage       # custom — Doris chokepoint enforcement
NoPerElementDatalakeRead    # custom — per-element datalake access ban
```

The last two are Anduin-custom (sources live in the external `com.anduin::osiris` plugin, not this repo) and mechanically enforce what checklist 04 previously described only conceptually: bulk-over-per-element datalake access.

Plus a fourth DisableSyntax regex the checklist never mentioned:

```hocon
{
  id = integrationTestBypassReason
  pattern = "(?-i)AdminBypassReason\\.IntegrationTest"
  message = "...reserved for integration tests. Production code must use a domain-specific reason
             (DataRoomPublicApi, DataRoomAdminPortal, WorkflowSystemTask, ...). If you are writing an
             integration test, suppress with `// scalafix:ok DisableSyntax.integrationTestBypassReason`
             and a one-line justification."
}
```

### Also corrected in 01

- The build compiles with `-preview` repo-wide — preview syntax compiles without extra flags, so "the compiler will catch experimental use" was a false assumption.
- JDK claim softened: `.mill-jvm-version` = `system` (repo pins no JVM; local runs observed on JVM 26).
- Copyright header convention documented: `// Copyright (C) 2014-<year> Anduin Transactions Inc.`

### Also corrected in 04

- `scala-anti-slop-review.md` (referenced as authoritative) **does not exist** in the repo yet — instruction reworded to "if it exists"; inline rules remain the fallback.
- The `SAFETY:`-comment convention is aspirational (≈1 occurrence repo-wide, and that one is prose in a doc string) — reworded to "introduce the comment when touching a suppression rather than expecting to find one."
- Suppression-culture context added: ~1000 `scalafix:ok` / ~1200 `scalafix:off` occurrences make the narrowest-scope rule genuinely load-bearing.

---

## Gap 11 — Vendored `OcrMarkdown.scala` shadows JAR symbols (do not "fix")

**Checklists:** `12-ai-llm-mcp.md`, `13-infrastructure-sre.md`

### What it is

`platform/serverless/src/anduin/serverless/models/OcrMarkdown.scala` intentionally declares the same `anduin.serverless.models.OcrMarkdown` symbols that a pinned dependency JAR also ships. From `build/versions.mill`:

> the vendored ... OcrMarkdown.scala does not land in an empty namespace — it declares the same anduin.serverless.models.OcrMarkdown, and the in-repo source SHADOWS the JAR's copy (scalac resolves a symbol from source over a classpath class file). That is what makes the vendored trim to the cached page-shape types safe here... Retiring the vendored file therefore requires a starlink build that merges #112 into this lineage, not just a pin bump.

### Why it matters

An innocent-looking cleanup — "delete the duplicate file" or "re-add the dependency so there's one source of truth" — breaks the build or silently changes the wire shape. Scalac resolves source over classpath, so the vendored copy is authoritative; the JAR's wider copy simply never resolves. Un-retiring requires a specific upstream lineage merge, not a version bump.

Same supply-chain theme, JS side: `scripts/bun-vendor-build.js` + `scripts/gen-vendor-entries.js` run a custom vendor pipeline that bypasses normal lockfile/package-addition review. And SDK pins like mcp-ui-scala `0.3.0-16-34bb85` are CI-published immutable snapshots of another repo's master — bump reviews must check the pin comment's provenance (source commit + publishing CI), which versions.mill documents meticulously.

---

## Gap 12 — MCP Apps widget rendering is a model-influenced UI trust boundary

**Checklist:** `12-ai-llm-mcp.md` → MCP bullet expanded

### What it is

The mcp-ui-scala SDK (`dev.mcpui` mcp-ui-core/mcp-ui-widgets) renders rich cells inside the host. From versions.mill pin history:

- `link` cells **open via the host bridge** (`ui/open-link`) rather than a sandboxed `<a target=_blank>` — i.e., model-provided hrefs trigger host navigation actions.
- An 8-type rich-cell `render_table` contract (currency/date/progress cells, variant badges, http(s)-only link guard, editable-column validation) renders model-influenced content.
- isError results announce via `role=alert` + danger styling; array structuredContent is rejected; text blocks trimmed/joined with a display cap.

Consumers include fundsub `show_funds`/`show_orders` open-link columns.

### Why it matters

Rendered cell content is effectively untrusted input executed inside the host UI — injection/phishing surface (a crafted label/href rendered as a trusted-looking action). The generic "validate tool schemas" bullet didn't cover widget rendering trust at all. Related telemetry surface: `modules/mcp/mcpAnalytics/` tracks AI/MCP usage — PII-in-telemetry concerns apply.

---

## Gap 13 — `NdjsonAccumulator` exists (07 claimed it didn't)

**Checklist:** `07-tapir-endpoints.md` → B2 snippet comment fixed

### What it is

```scala
// platform/stargazerCore/shared/src/anduin/tapir/ndjson/NdjsonAccumulator.scala
def onItem(item: T): NdjsonAccumulator[T, A]
def onError(error: Throwable): NdjsonAccumulator[T, Nothing]
def onComplete(): Either[Throwable, A]

object NdjsonAccumulator {
  // VectorAcc: folds items into Vector[T], short-circuits on error
}
```

Imported by `AuthenticatedEndpointClient` (`anduin.tapir.ndjson.{NdjsonAccumulator, NdjsonPipeline}`). The old checklist asserted "(no dedicated Accumulator class)" — factually wrong; inline `scanLeft` remains fine for simple cases, but shared accumulation logic exists and should be preferred over hand-rolling stateful folds.

Other 07 fixes: `PublicEndpointClient` removed (no such class — verified 0 defs/usages); A1 base-class rule now names both `AuthenticatedEndpointServer` (`authRoute*`) and `AuthenticatedValidationEndpointServer` (`validateRoute*`); public-API glob list gained `modules/integplatform/**/api/PublicApiEndpointService.scala`; GraphQL bullet now names Caliban 3.1.2/caliban-tapir, the Narya server, and the generated public GraphQL spec (`js/public-api-specs/scripts/generate-graphql.mjs`) as compatibility-sensitive surface.

---

## Left-open items (flagged, deliberately NOT guessed)

Agents marked these unverified rather than fabricating. Follow up before hardening them into checklist text:

| Item | Where | Status |
|------|-------|--------|
| `ItoolsServer.scala` example file (07 A4) | olympian server wiring | Not found by fuzzy search — verify name or drop |
| `NdjsonAccumulator` full semantics (deprecated? helper role?) | stargazerCore ndjson | Signature confirmed, role unread |
| K8s manifest paths inside repo (13) | `apps/*/resources/deployment/` assumed | Not located — no path hints added |
| `ZStream.unfoldChunkZIO` internal claim (05 §11) | FDBCommonDatabase large*Stream | Signatures confirmed, combinator unread |
| `ZQueryDataSource.fromFunctionBatchedTask` (05 §9) | ZQuery utils | No hit surfaced — possible dead API ref |
| Individual `FDBExceptions` names (05 §15) | client/exception | File confirmed, names not individually checked |
| Money internals: `ln()` helper type, order/subscription state enums (14) | fundsub | `MoneySchema` (cue, `amount: Double` + currency index) confirmed; fundsub-side enums unresolved |
| Playwright fixtures (11) | `playwright.conf`, `playwright-jsenv` | Existence known from build files; fixture classes unchecked |
| `NatsAuthClient` purpose (09) | heimdallCore service/nats | Filename suggests internal service auth; contents unread |
| Nested AGENTS.md below `modules/*/*/` (14) | repo-wide | Pattern search found none; deeper nesting not exhaustively ruled out |

---

## Summary

| Category | Count |
|----------|-------|
| Hard mismatches corrected (checklist contradicted repo) | 9 |
| Major gaps filled (real hazard, zero prior coverage) | 13 sections across 12 files |
| Items flagged unverified, not guessed | 10 |
| Files touched | 12 of 14 checklists |

**Recurring theme:** the codebase's most dangerous contracts are documented in *comments on version pins* (`build/versions.mill`) and *production call sites*, not in types. Several gaps (group-commit fusion, OcrMarkdown shadowing, TypeMapper degradation) were invisible to any checklist that only inspects changed lines without reading the surrounding contract commentary — which is exactly why the specialists now name those anchors explicitly.
