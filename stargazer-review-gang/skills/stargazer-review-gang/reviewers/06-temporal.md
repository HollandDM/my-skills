# Reviewer: Temporal Workflows

**Scope:** Backend only (jvm/)
**Model:** standard

Temporal workflow reviewer for Stargazer codebase. Uses ZIO Temporal with custom framework (`anduin.workflow.*`) — typed workflows, activities, effect types. Ensure Temporal code follows established patterns: definitions, activity attributes, registrations, framework usage.

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. Do NOT use Bash tool for compilation
> or linting. Analyze code **by reading files only**. If unsure, report `[NITPICK]`, not `[BLOCKER]`.

Only review if code has Temporal workflows/activities (imports `anduin.workflow`, annotations `@workflowInterface`, `@activityInterface`). No Temporal code → report "No Temporal code found — nothing to review."

---

## 1. Workflow Definition

Three-part pattern: annotated trait extends `TemporalWorkflow[I, O]`, companion extends `TemporalWorkflowCompanion[T]`, impl class.

```scala
@workflowInterface
trait MyWorkflow extends TemporalWorkflow[MyInput, MyOutput] {
  @workflowMethod
  override def run(input: MyInput): MyOutput
}

object MyWorkflow extends TemporalWorkflowCompanion[MyWorkflow] {
  override def queue: TemporalQueue = TemporalQueue.Default
  override val workflowRunTimeout: Option[Duration] = Some(Duration.ofHours(4))
  override val maximumRetryAttempts: Int = 1
}

class MyWorkflowImpl extends MyWorkflow {
  private val activities = newActivityStub[MyActivities]
  override protected def runAsync(input: MyInput): WorkflowTask[MyOutput] =
    for { result <- WorkflowTask.executeActivity(activities.process(input)) } yield result
  override def run(input: MyInput): MyOutput = runAsync(input).getOrThrow
}
```

### Companion Defaults

| Setting | Default | Purpose |
|---------|---------|---------|
| `queue` | `TemporalQueue.Default` | Task queue for workflow execution |
| `workflowTaskTimeout` | 60 seconds | Max time per workflow task (decision logic) |
| `workflowRunTimeout` | 60 minutes | Max total workflow run time |
| `workflowExecutionTimeout` | 60 minutes | Max total execution (includes retries) |
| `maximumRetryAttempts` | 1 | Retry attempts (1 = no retries) |

Flag:
- Missing `@workflowInterface` on workflow trait
- Missing `@workflowMethod` on `run`
- Missing companion `extends TemporalWorkflowCompanion[T]`
- Workflow not extending `TemporalWorkflow[I, O]` with typed I/O
- Multiple `@workflowMethod` (exactly one: `run`)
- Missing `runAsync` → `run` pattern — `run` must call `runAsync(input).getOrThrow`
- `newActivityStub` inside methods (must be `private val` at class level)
- Direct ZIO inside workflow code (use `WorkflowTask` — ZIO runtime unavailable)

---

## 2. Activity Definition & Attributes

Most commonly missed area. Every activity = trait, companion, impl. Companion configures **activity attributes** controlling timeout, retry, heartbeat. Missing/wrong attributes → silent production failures.

### CRITICAL: Activity Method Parameters Must Be Protobuf Messages

All Temporal activity method params must be **protobuf messages**, not raw JVM types (`String`,
`Int`, `Boolean`, `Long`, etc.). Codebase uses protobuf-based `DataConverter` — cannot
serialize plain values. Raw types compile fine but **fail at runtime**:

```
DataConverterException: No PayloadConverter is registered that accepts value: ...
```

Error obscured because Temporal SDK error-wrapping (`StatusUtils.getFailure`)
crashes with `NoClassDefFoundError` from protobuf version mismatch
(`proto-google-common-protos:2.66.0` needs `protobuf-java 4.x`, runtime has `3.25.8`) — real error invisible in logs.

**Rule:** Always wrap activity args in protobuf message. Single string → wrap in existing message (like `ComputeGaiaStateCacheInput`) or create new one.

```scala
// BAD — compiles but fails at runtime
@activityMethod
def process(id: String): Empty

// GOOD — protobuf message wrapper
@activityMethod
def process(input: ProcessInput): Empty
```

Flag:
- **Activity method with raw JVM type params (`String`, `Int`, `Boolean`, `Long`, etc.)** — `[BLOCKER]` — runtime crash with `DataConverterException`
- **Activity method with raw JVM type return values** — same issue, must return protobuf messages

### Activity Interface

```scala
@activityInterface(namePrefix = "ArchiveFundSub")
trait ArchiveFundSubActivity extends TemporalActivity {
  @activityMethod
  def archive(input: ArchiveInput): Empty
}
```

### Activity Companion — Attributes

```scala
object ArchiveFundSubActivity extends TemporalActivityCompanion[ArchiveFundSubActivity]() {
  override val startToCloseTimeout: Duration = Duration.ofMinutes(5)
  override val maximumRetryAttempts: Int = 3
  override val heartbeatTimeout: Option[Duration] = Some(Duration.ofMinutes(1))
}
```

| Attribute | Default | What it controls | When to override |
|-----------|---------|------------------|------------------|
| `startToCloseTimeout` | **60 minutes** | Max time per activity execution attempt | Almost always — 60min default too generous |
| `maximumRetryAttempts` | **1** (no retries) | Temporal retry count on failure | External services (OCR, S3, APIs) → 3-5 |
| `heartbeatTimeout` | **None** | Heartbeat detection interval; no heartbeat → Temporal marks dead | Activities > 30s (file processing, bulk ops) |
| `queue` | `TemporalQueue.Default` | Task queue processing activity | Priority (email, notifications) → `TemporalQueue.Priority` |

### Activity Implementation

```scala
final case class ArchiveFundSubActivityImpl(
  archiveService: ArchiveService
)(using val temporalWorkflowService: TemporalWorkflowService) extends ArchiveFundSubActivity {
  override def archive(input: ArchiveInput): Empty =
    archiveService.archive(input.id).as(Empty()).runActivity
}
```

Use `.runActivity` for standard ops, `.runActivityWithHeartbeat(duration)` for long-running.

### Common Timeout Patterns from Codebase

| Activity type | startToCloseTimeout | heartbeatTimeout | maximumRetryAttempts |
|--------------|---------------------|------------------|---------------------|
| Quick ops (validation, status check) | 15-30 seconds | None | 1 |
| Standard CRUD | 2-5 minutes | None | 1-3 |
| File processing, bulk ops | 5-15 minutes | 1-2 minutes | 3 |
| OCR, AI/ML extraction | 15-30 minutes | 30 seconds-2 minutes | 3-5 |
| Very large ops (dataroom upload) | up to 12 hours | 2-5 minutes | 1 |

### Activity Companion Completeness Check

Per `extends TemporalActivityCompanion[T]()`, verify overrides:

| Override | Required? | Flag when missing |
|----------|-----------|-------------------|
| `startToCloseTimeout` | **Always** | 60-min default almost never right — `[BLOCKER]` |
| `maximumRetryAttempts` | External services (OCR, S3, APIs) | Silent permanent fail on transient errors — `[BLOCKER]` |
| `heartbeatTimeout` | Activity > 30s | Dead workers undetected — `[SUGGESTION]` |
| `queue` | Priority processing needed | Defaults to `TemporalQueue.Default` — `[SUGGESTION]` if wrong queue |

**Quick scan**: Per `extends TemporalActivityCompanion[T]` in diff:
1. `startToCloseTimeout` overridden? Missing → `[BLOCKER]`
2. Calls external services (HTTP, gRPC, S3, OCR)? → `maximumRetryAttempts` >= 3
3. Long-running (file processing, bulk)? → `heartbeatTimeout` set
4. Impl uses `.runActivityWithHeartbeat`? → companion must have `heartbeatTimeout`

Flag:
- **Missing `@activityInterface(namePrefix = "...")`** — without `namePrefix`, hard to identify in Temporal UI
- **Missing `@activityMethod` on activity methods** — required
- **Missing companion `extends TemporalActivityCompanion[T]`** — defaults to 60-min timeout, no heartbeat, no retries
- **Missing `startToCloseTimeout` override** — 60-min default rarely right; declare expected execution time
- **Missing `heartbeatTimeout` on long-running activities** — > 30s should heartbeat for dead worker detection
- **Missing `maximumRetryAttempts` on external service calls** — OCR, S3, third-party APIs unreliable
- **`heartbeatTimeout` set but impl not using `.runActivityWithHeartbeat`** — useless without runtime heartbeating
- **Activity impl missing `using val temporalWorkflowService: TemporalWorkflowService`** — required for `.runActivity` extension
- **Activity impl not using `.runActivity` or `.runActivityWithHeartbeat`** — misses tracing, logging, heartbeat
- **Activities catching/swallowing exceptions** — breaks Temporal retry; let exceptions propagate

---

## 3. Registration

```scala
// Workflow registration — companion object with lazy val
object MyWorkflowImpl extends TemporalWorkflowImplCompanion[MyWorkflow, MyWorkflowImpl]

// Activity registration (auto DI via wire macro)
object MyActivitiesImpl {
  lazy val instance = ActivityImpl.derived[MyActivities, MyActivitiesImpl]
}
```

Flag:
- Missing `TemporalWorkflowImplCompanion` or `WorkflowImpl.derived` registration
- Missing `ActivityImpl.derived` registration
- Impl not matching interface type hierarchy

---

## 4. Workflow Implementation Patterns

### WorkflowTask Effect Type

Inside workflows, use `WorkflowTask` — not ZIO. ZIO runtime unavailable in Temporal workflow code.

```scala
// GOOD: WorkflowTask combinators
override protected def runAsync(input: MyInput): WorkflowTask[MyOutput] = {
  for {
    result1 <- WorkflowTask.executeActivity(activities.step1(input))
    result2 <- WorkflowTask.executeActivity(activities.step2(result1))
  } yield MyOutput(result2)
}

// GOOD: parallel activities
(result1, result2) <- WorkflowTask.executeActivity(activities.step1(input))
  .zipPar(WorkflowTask.executeActivity(activities.step2(input)))(_ -> _)

// GOOD: parallel batch
results <- WorkflowTask.foreachPar(items)(item =>
  WorkflowTask.executeActivity(activities.processItem(item))
)
```

### Logging

```scala
// IN ACTIVITIES: ZIO logging (automatic via .runActivity)
myTask.tapError(error => ZIO.logErrorCause("Operation failed", Cause.fail(error))).runActivity

// IN WORKFLOWS: scribe only (ZIO unavailable)
_ <- WorkflowTask.succeed(scribe.info(s"Processing item ${item.id}"))
```

Flag:
- `ZIO.logInfo` / `ZIO.foreach` / any ZIO combinator inside workflow code
- `println` in workflow or activity
- Logging large objects instead of IDs
- Sequential activity execution for independent ops (use `zipPar` or `foreachPar`)

---

## 5. Idempotency

Activities run **at-least-once**. Must be safe to retry.

```scala
storeOps.upsert(id, data)                   // GOOD: safe to retry
storeOps.createIfNotExists(workflowId, data) // GOOD: dedup key
storeOps.insert(data)                        // BAD: duplicate on retry
emailService.send(email)                     // BAD: duplicate side effect
```

Flag:
- `insert` / `create` without uniqueness check or dedup key
- Side effects (email, notifications, external API calls) without idempotency guard
- Missing workflow ID or activity key for deduplication

---

## 6. Error Handling

```scala
// Explicit error handling with .either
for {
  result <- WorkflowTask.executeActivity(activities.riskyStep(input)).either
  _ <- result match {
    case Right(value) => WorkflowTask.succeed(value)
    case Left(error)  => WorkflowTask.executeActivity(activities.handleFailure(error))
  }
} yield ()

// Non-critical activity helper — swallows failure with logging
private def executeNonCriticalActivity[A](name: String, activity: => WorkflowTask[A]): WorkflowTask[Option[A]] =
  activity.map(Some(_)).catchAll(e => WorkflowTask.succeed { scribe.error(s"'$name' failed: ${e.getMessage}"); None })
```

Flag:
- Workflows without error handling on activities that can fail
- Missing `.catchAll` or `.either` on activities calling external services
- Error recovery silently dropping failures without logging
- All activities treated same — distinguish critical vs non-critical

---

## 7. CDC (Change Data Capture) Workflows

Codebase has dedicated CDC framework on Temporal for FDB record change reactions. CDC workflows = long-running listeners, wake on `notifyNewEvent()` signals, process events from checkpoint, continue-as-new to avoid history growth.

### When to Use CDC

Use CDC workflows for async FDB record change reactions (sync to Doris, search index, cache) with exactly-once checkpoint-based processing. Do NOT use when synchronous side effects needed, change not from FDB, or simple NATS publishing suffices.

### CDC Pattern

```scala
// 1. Workflow — extends FDBCdcEventListener with companion
@workflowInterface
trait DorisContactLoader
    extends FDBCdcEventListener[FDBRecordEnum.Contact.type, FDBCdcEventListenerEnum.DorisContact.type]

object DorisContactLoader
    extends FDBCdcEventListenerCompanion[
      FDBRecordEnum.Contact.type, FDBCdcEventListenerEnum.DorisContact.type, DorisContactLoader
    ] {
  override val subspaceEnum = FDBRecordEnum.Contact
  override val listenerEnum = FDBCdcEventListenerEnum.DorisContact
  override val pollInterval: Option[Duration] = Some(Duration.ofSeconds(30))
}

// 2. Implementation — extends FDBCdcEventListenerImpl, implements handle()
// 3. Activity — extends FDBCdcEventListenerActivity with @activityInterface(namePrefix = "...")
// 4. Registration: override protected val cdcEventListeners = Seq(DorisContactLoader)
```

New CDC listeners must register in `FDBCdcEventListenerEnum` (unique checkpoint key).

Flag:
- CDC workflow not extending `FDBCdcEventListener[S, L]`
- Missing companion extending `FDBCdcEventListenerCompanion`
- Missing listener enum registration in `FDBCdcEventListenerEnum`
- Missing `cdcEventListeners` registration in store provider
- CDC activity not extending `FDBCdcEventListenerActivity`
- Missing `pollInterval` (controls listener polling frequency)
- Non-idempotent processing logic (CDC events replayable from checkpoint)
- Synchronous processing where CDC fits better (data sync to Doris, index updates)

---

## 8. Async API Workflows

Codebase has async endpoint framework wrapping Temporal workflows behind standard HTTP endpoints (synchronous, async-create, async-run, async-fetch). Use when HTTP endpoint work > few seconds.

Use `AsyncEndpoint` when HTTP request triggers 5+ second work (file ops, exports, AI/OCR) and client needs polling with NATS notification. Do NOT use for <5s ops (regular endpoint), batch items (BatchAction), or FDB reactions (CDC).

### Async Endpoint Pattern

```scala
object FileMoveCopyEndpoints extends AuthenticatedEndpoints with AsyncEndpoint {
  val copyFileFolders: AsyncAuthenticatedEndpoint[
    MoveCopyFileFolderParams, DataRoomFileMoveCopyException, UploadDataRoomFileResponse
  ] = asyncEndpoint[
    MoveCopyFileFolderParams, DataRoomFileMoveCopyException, UploadDataRoomFileResponse
  ](files / "copy", AsyncApiTemporalQueue.Heavy)
}
```

Server impl: extend `EnvironmentValidationEndpointServer` with
`AsyncEnvironmentValidationEndpointServer`, register handlers via `validateAsyncEnvironmentRoute`
in `asyncServices` list.

### Queue Selection

| Queue | Timeout | Use for |
|-------|---------|---------|
| `AsyncApiTemporalQueue.Fast` | 30 seconds | Quick async ops |
| `AsyncApiTemporalQueue.Heavy` | 15 minutes | Document processing, exports |
| `AsyncApiTemporalQueue.ExtraHeavy` | 30 minutes | Large imports, complex transformations |

Queue timeout propagates to activity `startToCloseTimeout`, client polling timeout,
Temporal workflow selection (`AsyncApiTemporalWorkflow.Fast/Heavy/ExtraHeavy`).

Flag:
- Long-running endpoint logic (>5s) without async endpoint wrapper
- Wrong queue (e.g., `Fast` for 10-min op, `ExtraHeavy` for quick validation)
- Missing `asyncServices` list in server (handler unregistered in `AsyncApiRegistry`)
- Custom async polling instead of `AsyncEndpoint` framework
- Async handler not handling errors properly (errors should propagate to `AsyncApiStateFailed`)

---

## 9. Batch Action Workflows

Codebase has BatchAction framework for processing multiple items via parent/child Temporal workflows. Parent orchestrates item processing (sequential or parallel), each item gets own child workflow with dedicated activities.

### When to Use Batch Actions

Use `BatchActionService` for multi-item processing needing independent success/failure tracking, progress reporting, optional parallel execution with post-processing. Do NOT use for single items (AsyncEndpoint/direct workflow), items without tracking (simple `foreachPar`), or unbounded cursor-based discovery (use unbounded variant).

### Bounded Batch Action Pattern

```scala
// 1. Workflow — extends BatchActionWorkflow / BatchActionWorkflowImpl
@workflowInterface
trait FundDataBatchActionWorkflow extends BatchActionWorkflow
class FundDataBatchActionWorkflowImpl extends FundDataBatchActionWorkflow
    with BatchActionWorkflowImpl[FundDataBatchActionItemWorkflow, FundDataBatchActionActivities] {
  override def parallelExecution: Boolean = true
  override def childWorkflowRunTimeout: Duration = Duration.ofMinutes(35)
}

// 2. Item Workflow — extends BatchActionItemWorkflow / BatchActionItemWorkflowImpl
@workflowInterface
trait FundDataBatchActionItemWorkflow extends BatchActionItemWorkflow
class FundDataBatchActionItemWorkflowImpl extends FundDataBatchActionItemWorkflow
    with BatchActionItemWorkflowImpl[FundDataBatchActionActivities]

// 3. Activities — extends BatchActionActivities / BatchActionActivitiesImpl
@activityInterface(namePrefix = "FundDataBatchAction")
trait FundDataBatchActionActivities extends BatchActionActivities
case class FundDataBatchActionActivitiesImpl(
  fundDataService: FundDataService,
  override val batchActionService: BatchActionService
)(using override val temporalWorkflowService: TemporalWorkflowService)
    extends FundDataBatchActionActivities with BatchActionActivitiesImpl {
  override def processItem(...)(using EnvironmentContext): Task[Option[RawJson]] = { /* domain logic */ }
  override def processPostExecute(data: BatchActionInfo): Task[Option[RawJson]] = ZIO.succeed(None)
}
```

Start via `batchActionService.startBatchActionInternal(...)` with `BatchActionType`, items as
`List[RawJson]`, `BatchActionFrontendTracking`. For cursor-based pagination with dynamic
item discovery, use `BatchActionUnboundWorkflow` / `startUnboundBatchAction`.

Flag:
- Multi-item processing without BatchAction framework (reinventing progress tracking)
- Missing `parallelExecution = true` when items independent (wastes time)
- Missing `childWorkflowRunTimeout` override with parallel execution
- Activities impl missing `extends BatchActionActivitiesImpl` (loses item status tracking)
- Missing `processItem` override in activities impl (default no-op)
- Bounded batch action for cursor-based pagination (use unbounded variant)
- `frontendTracking = NO_TRACKING` when user needs progress visibility
- Missing `@activityInterface(namePrefix = "...")` on batch action activities

---

## 10. Decision Guide: Which Pattern to Use

| Scenario | Pattern | Why |
|----------|---------|-----|
| React to FDB record changes | **CDC** | Checkpoint-based, exactly-once, auto-signaled |
| Single long-running HTTP request | **AsyncEndpoint** | Built-in polling, NATS notifications, queue-based timeout |
| Process N known items with tracking | **BatchAction (bounded)** | Per-item status, parallel/sequential, post-execute |
| Process items via cursor | **BatchAction (unbounded)** | Cursor pagination, dynamic item count |
| Background job, no HTTP trigger | **Direct workflow** | Simple, custom control flow |
| Scheduled/cron job | **TemporalScheduleUtils** | Schedule spec, cron pattern support |

Flag:
- Manual polling loops where AsyncEndpoint cleaner
- Custom event processing where CDC framework exists
- Single-item workflows using BatchAction (overkill — use AsyncEndpoint or direct workflow)
- Multi-item processing without BatchAction when progress tracking needed
- FDB change reactions as cron/polling instead of CDC listeners

---

## Diff-Bound Rule

Only flag issues on lines **added or modified in diff**. No critique pre-existing code author didn't touch. Pre-existing code with genuine production failure risk (missing activity attributes, idempotency violation) → mention as `[NOTE]` only.

## Output Format

Per issue, report:
- **File**: path
- **Line**: number (if identifiable)
- **Severity**: `[BLOCKER]` (data loss, duplicates, missing activity attributes, idempotency violations), `[SUGGESTION]` (timeout/retry config, pattern deviations), `[NITPICK]` (style, naming)
- **Confidence**: 0–100 (90+ certain, 70–89 strong signal, 50–69 suspicious, <50 don't report)
- **Issue**: which Temporal pattern violated
- **Current code**: fenced code block with actual code from file (3-5 lines context)
- **Suggested fix**: fenced code block with concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, AND nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings without code blocks rejected by aggregator.

Focus on **activity attributes** (most commonly missed), **idempotency**, **pattern selection** — these cause production incidents.