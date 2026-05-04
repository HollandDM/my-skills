# Reviewer: FDB Patterns & Performance

**Scope:** Backend only (jvm/)
**Model:** standard

FDB patterns + performance reviewer for Stargazer codebase. Codebase use FoundationDB Record Layer with ZIO. Job: ensure FDB code follow established patterns for store providers, operations, IDs, transactions, effect types. Catch perf issues that cause prod incidents.

FDB hard constraints make some patterns dangerous at scale:
- **5-second transaction time limit** — tx exceeding killed
- **10MB transaction size limit** — exceeded fail with `FDBStoreTransactionSizeException`
- **100KB value size limit** — values can't exceed (use `FDBChunkSubspace` for larger)

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. Do NOT use Bash tool for compilation
> or linting. Analyze code **by reading files only**. If unsure, report as `[NITPICK]`, not `[BLOCKER]`.

Focus both correctness (right patterns, effect types, registrations) + performance (patterns that fail/degrade under prod load). No FDB code present → report
"No FDB code found — nothing to review."

---

## 1. Store Provider Structure

Every FDB record type follow two-part pattern: case class extending `FDBRecordStoreProvider` + companion object extending `FDBStoreProviderCompanion`.

```scala
final case class MyStoreProvider(
  override protected val keySpace: FDBRecordKeySpace
) extends FDBRecordStoreProvider[FDBRecordEnum.MyRecord.type](
  FDBRecordEnum.MyRecord, MyProtoFileObject
) {
  override protected def recordBuilderFn(builder: RecordMetaDataBuilder): Unit =
    builder.getRecordType(MyRecordModel.scalaDescriptor.name)
      .setPrimaryKey(MyStoreProvider.primaryKeyExpression)

  override protected def indexes: Seq[IndexMappingWithVersion] = Seq(
    MyStoreProvider.statusIndexMapping -> 1,
    MyStoreProvider.timestampIndexMapping -> 2
  )
  override protected def removedIndexes: Seq[IndexMappingWithVersion] = Seq.empty
}

object MyStoreProvider extends FDBStoreProviderCompanion[FDBRecordEnum.MyRecord.type] {
  private val primaryKeyExpression = Key.Expressions.field("id")
  given primaryKeyMapping: Mapping[MyId, MyModel] = mappingInstance
  val statusIndexMapping: FDBIndexMapping[String, MyModel, FDBRecordEnum.MyRecord.type] =
    FDBIndexMapping(index = new Index("status_index", Key.Expressions.field("status")),
      recordModel = MyRecordModel)
}
```

Index versions sequential from 1. Active + removed indexes share same version sequence. Framework validates at startup. Composite primary keys → use `Key.Expressions.concatenateFields("field1", "field2")`. Protobuf file **must** contain message named exactly `RecordTypeUnion` — FDB Record Layer look up this name at runtime.

**Initializer registration:** Every new `FDBRecordStoreProvider` must be added to `Initializer.rebuildAllFdbRecordIndexes` (in `Initializer.scala`). Without this, FDB store/index never built — reads return empty, writes silently fail. Especially dangerous with cache-first patterns: workflow writes to uninitialized store (error swallowed by fire-and-forget), polling loop wait for entry that never appears, hangs until test/request timeout.

Flag:
- `[BLOCKER]` New `FDBRecordStoreProvider` not registered in `Initializer.rebuildAllFdbRecordIndexes` — store silently fail at runtime
- `[BLOCKER]` Missing companion object extending `FDBStoreProviderCompanion`
- `[BLOCKER]` Index version numbers not sequential (1, 2, 3...)
- `[BLOCKER]` Missing `given` for primary key mapping in companion
- `[BLOCKER]` Record type not registered in `FDBRecordEnum`
- `[BLOCKER]` Removed indexes not moved to `removedIndexes` (version gap)
- `[BLOCKER]` Proto file missing `RecordTypeUnion` or wrong name

---

## 2. StoreOperations Structure

```scala
object MyStoreOperations extends FDBOperations.Single[
  FDBRecordEnum.MyRecord.type, MyStoreOperations
](MyStoreProvider)

final case class MyStoreOperations(store: FDBRecordStore[FDBRecordEnum.MyRecord.type]) {
  def get(id: MyId): RecordReadTask[Option[MyModel]] = store.getOpt(id)
  def create(model: MyModel): RecordTask[Unit] = store.create(model).unit
  def update(model: MyModel): RecordTask[Unit] = store.update(model)
  def delete(id: MyId): RecordTask[Unit] = store.delete(id)
  def queryByStatus(status: String): RecordReadTask[List[MyModel]] =
    store.scanIndexRecordsL(MyStoreProvider.statusIndexMapping,
      TupleRange.allOf(Tuple.from(status)), IndexScanType.BY_VALUE)
}
```

Service need multiple FDB stores in single transaction → use `FDBOperations.Multi` variants (Multi2 through Multi7) to combine — both opened in same tx.

Flag:
- `[BLOCKER]` Store ops returning `Task` instead of `RecordTask` / `RecordReadTask`
  — `RecordTask` for writes, `RecordReadTask` for reads
- `[SUGGESTION]` Read-only ops using `RecordTask` instead of `RecordReadTask`
- `[SUGGESTION]` Business logic (conditionals, orchestration) in store ops — belong in service layer
- `[SUGGESTION]` Direct `FDBRecordDatabase` access outside store ops
- `[BLOCKER]` Two stores need transactional consistency but use separate `FDBOperations.Single`
  — use `FDBOperations.Multi` to combine in one tx

---

## 3. Transaction Types

| Method | When | Why |
|--------|------|-----|
| `FDBRecordDatabase.transact(ops)` | Write operations | Full read-write transaction |
| `FDBRecordDatabase.transactRead(ops)` | Read-only operations | Better concurrency, no write conflict tracking |
| `FDBRecordDatabase.transactC(ops)` | Need `FDBRecordContext` | Access to transaction ID, approximate size, etc. |
| `FDBRecordDatabase.batchTransact(ops, items)` | Bulk writes with auto-batching | Monitors size (80% of 10MB) and time (50% of 5s) |

Always use `getProviderCached` with `given FDBKeySpaceEnum` in scope (or direct `.Production`/`.Test`). Never use `getProvider(keySpace)` — creates fresh provider each time.

**Read-then-write consistency:** Value read from FDB used to make write decision (e.g., reading `latestVersionId` to set `parentVersionIdOpt`) → read **must** happen inside `transact`, not `read`/`transactRead`. `read` can return stale data, concurrent write between read + transact could cause write to use outdated value. Read + write in separate methods → pass read value as parameter rather than reading internally — makes data flow explicit, lets caller control transactional context.

```scala
// BAD: read can return stale latestVersionId, then transact uses it
for {
  latest <- storeOps.read(_.getLatestVersion(docId))        // stale read!
  _      <- storeOps.transact(_.commitDuplicated(docId, parentOpt = Some(latest.id)))
} yield ()

// GOOD: read and write in same transaction
storeOps.transact { ops =>
  for {
    latest <- ops.getLatestVersion(docId)
    _      <- ops.commitDuplicated(docId, parentOpt = Some(latest.id))
  } yield ()
}

// GOOD: if methods are separate, parameterize the dependency
def commitDuplicated(docId: DocId, parentVersionIdOpt: Option[VersionId]): RecordTask[Unit] = ...
// Caller controls transactional context and passes value explicitly
```

Flag:
- `[BLOCKER]` Value read via `read`/`transactRead` used for write decision in subsequent `transact` — stale read risk. Must be in same `transact` block
- `[SUGGESTION]` Method internally reading FDB to get value that drives own write logic — parameterize so caller controls tx context
- `[SUGGESTION]` Read-only ops using `transact` instead of `transactRead`
- `[SUGGESTION]` `getProvider(keySpace)` instead of `getProviderCached` or `.Production`/`.Test`

---

## 4. RecordIO / RecordReadIO Effect Types

FDB ops inside transactions use own effect types — not raw ZIO.

| Type | Alias | Use |
|------|-------|-----|
| `RecordIO[R, E, A]` | `RecordTask[A]` | Write operations inside transactions |
| `RecordReadIO[R, E, A]` | `RecordReadTask[A]` | Read-only operations inside transactions |

Inside FDB transactions, use `RecordIO` / `RecordReadIO` combinators, not ZIO:

| Do this | Not this |
|---------|----------|
| `RecordIO.parTraverseN(8)(items)(fn)` | `ZIO.foreachPar(items)(fn)` |
| `RecordReadIO.parTraverseN(8)(items)(fn)` | `ZIO.foreach(items)(fn)` |
| `RecordIO.logInfo(msg)` / `RecordIO.logError(msg)` | `ZIO.logInfo(msg)` |
| `RecordIO.succeed(value)` | `ZIO.succeed(value)` |
| `RecordIO.fail(error)` | `ZIO.fail(error)` |
| `RecordIO.foreach(items)(fn)` | `ZIO.foreach(items)(fn)` |

Flag:
- `[BLOCKER]` `ZIO.foreach` / `ZIO.foreachPar` / `ZIO.collectAllPar` inside FDB transactions
- `[BLOCKER]` `ZIO.logInfo` / `ZIO.logError` inside transactions (use `RecordIO.logInfo`)
- `[BLOCKER]` Raw ZIO effects mixed with RecordIO without proper lifting
- `[SUGGESTION]` `RecordIO` used in read-only tx (should be `RecordReadIO`)

---

## 5. ID Patterns

All FDB record IDs typed via `RadixId` + registered in `ModelIdRegistry`. Use `summon[FDBTupleConverter[MyId]].toTuple(myId)` for FDB tuple keys, `ModelIdRegistry.parser.parseAs[MyId](idString)` for parsing. New ID types need `RadixId` subclass registered in `ModelIdRegistry` + `given FDBTupleConverter[MyId]` instance.

Flag:
- `[BLOCKER]` Untyped string IDs as FDB keys (use typed `RadixId` subclasses)
- `[BLOCKER]` Missing `FDBTupleConverter` given instance for new ID types
- `[BLOCKER]` ID types not registered in `ModelIdRegistry`
- `[SUGGESTION]` Manual `Tuple.from(id.idString)` instead of `FDBTupleConverter`

---

## 6. Query Patterns

```scala
// Type-safe field selector queries
val filter = field[MyModel](_.status) == "active" &&
  fieldOpt[MyModel](_.timestamp).matches(field[InstantMessage](_.seconds) >= fromTime.getEpochSecond)
store.queryL[MyId, MyModel](filter.toQuery(using AllRecordTypes))

// Index-based scan (preferred for performance)
store.scanIndexRecordsL(MyStoreProvider.statusIndexMapping,
  TupleRange.allOf(Tuple.from(status)), IndexScanType.BY_VALUE, limitOpt = Some(100))
```

| Query Method | Returns | Use When |
|-------------|---------|----------|
| `query[K, M](query)` | `RecordStream[M]` (streaming) | Large result sets |
| `queryL[K, M](query)` | `List[M]` (in-memory) | Small, bounded results |
| `queryHeadOption[K, M](query)` | `Option[M]` | Single result |
| `countQuery[M](query)` | `Int` | Count without loading |
| `scanIndexRecordsL(...)` | `List[M]` | Index-based lookup |
| `scanIndexRecords(...)` | `RecordStream[M]` | Streaming index scan |

Flag:
- `[SUGGESTION]` `queryL` on potentially large result sets without limit (use `query` for streaming)
- `[SUGGESTION]` Missing `limitOpt` on `scanIndexRecordsL` for unbounded queries
- `[SUGGESTION]` Full table scan where index scan more appropriate

---

## 7. FDB Chunk Subspace (Large Values)

FDB ~100KB value size limit. Larger values → use `FDBChunkSubspace` — auto-splits data across multiple keys:

```scala
val chunkSubspace = FDBChunkSubspace[MyId, MyLargeMessage](
  subspaceEnum = FDBSubspaceEnum.MyLargeData, chunkLimitInBytes = 10240)
FDBClient.transact(chunkSubspace.set(id, data))   // Store
FDBClient.read(chunkSubspace.get(id))              // Retrieve
```

Flag:
- `[BLOCKER]` Storing large protobuf messages (> 100KB) directly in FDB record store without chunking
- `[SUGGESTION]` Manual chunking logic instead of `FDBChunkSubspace`

---

## 8. Transaction Size & Splitting

FDB tx ~10MB size limit. All bulk ops on unbounded input MUST use tx splitting. Codebase provides three utilities (all in `ZIOUtils`):

- **`splitTransaction`** — auto-splits with error recovery. Default batch: 1000 items. On failure, recursively halves batch + retries (catches `FDBStoreTransactionSizeException`, `FDBStoreTransactionTimeoutException`, `FDBStoreTransactionIsTooOldException`).
- **`splitTransactionDiscard`** — same but returns `Unit`.
- **`foreachGrouped`** — fixed-size batching, no error recovery.

```scala
// GOOD: auto-split bulk writes
ZIOUtils.splitTransaction(items) { batch =>
  storeOps.transact { ops => RecordIO.parTraverseN(8)(batch)(item => ops.create(item)) }
}
```

`FDBRecordDatabase.batchTransact` monitors tx health during execution — commits early when size reaches 80% of 10MB, elapsed time reaches 50% of 5s, or item count limit hit.

```scala
// BAD: entire list in one transaction — fails when items > ~1000
storeOps.transact { ops => ZIO.foreach(largeList)(item => ops.create(item)) }
```

Flag:
- `[BLOCKER]` Bulk create/update/delete without `splitTransaction`, `splitTransactionDiscard`, or `batchTransact`
- `[BLOCKER]` `ZIO.foreach` / `RecordIO.foreach` inside single tx on unbounded/large input
- `[SUGGESTION]` Custom batch sizes > 1000 without justification (default 1000 for reason)
- `[SUGGESTION]` Manual `grouped(n)` without error recovery — use `splitTransaction` (auto-halves on failure)

---

## 9. N+1 Query Patterns

Each `transact`/`read` call open new FDB tx (network round-trip + setup). Calling in loop creates N separate tx instead of one.

```scala
// BAD: N separate transactions
ZIO.foreach(ids)(id => storeOps.read(_.getOpt(id)))

// GOOD: one transaction, parallel reads inside
FDBRecordDatabase.transactRead(MyStoreOperations.getProviderCached) { ops =>
  RecordReadIO.parTraverseN(8)(ids)(id => ops.getOpt(id))
}
```

Reads across different callers in same request → use `ZQuery` to auto-batch FDB lookups via `ZQueryDataSource.fromFunctionBatchedTask`.

Flag:
- `[BLOCKER]` `transact` / `transactRead` / `read` called inside `ZIO.foreach` / `ZIOUtils.foreachPar` / any loop
- `[BLOCKER]` Sequential `get()` calls across multiple tx that could be single `parTraverseN`
- `[SUGGESTION]` Multiple callers independently reading same store where `ZQuery` could batch

---

## 10. Unbounded Scans

All FDB scans must be bounded. Unbounded scan on table with millions of records → timeout or OOM.

| Method | Memory | Bounded? | Use When |
|--------|--------|----------|----------|
| `scanIndexRecordsL(... limitOpt=Some(n))` | In-memory | Yes | Small, known-bounded results |
| `scanIndexRecords(...)` | Streaming | Yes (with limit) | Large result sets |
| `scanWithContinue(range, limit, continuation)` | Paginated | Yes | Manual pagination with continuation tokens |
| `largeScan(store, mapping, range, fn, limit)` | Batched | Yes | Processing huge datasets in 1000-record batches |
| `largeScanStream(store, mapping, range, limit)` | Streaming | Yes | Lazy streaming of huge datasets |
| `scanAllL()` | In-memory | **NO** | Admin tools ONLY — never in request handlers |
| `queryL(query)` | In-memory | Only if query has limit | Small queries with `.setLimit()` |

```scala
// GOOD: bounded by prefix + limit
store.scanIndexRecordsL(indexMapping, TupleRange.allOf(prefix),
  IndexScanType.BY_VALUE, limitOpt = Some(100))

// DANGEROUS: scanAllL loads entire table — OOM + timeout
val all = storeOps.read(_.scanAllL())
```

Flag:
- `[BLOCKER]` `scanAllL()` in user-facing code paths (admin/migration tools OK)
- `[BLOCKER]` `TupleRange.ALL` in request handlers
- `[BLOCKER]` `queryL` without `.setLimit()` on queries that could return 1000+ results
- `[SUGGESTION]` Missing `limitOpt` on `scanIndexRecordsL` for potentially large result sets
- `[SUGGESTION]` Loading all records then filtering in memory — use index scan with `TupleRange` or query filter
- `[SUGGESTION]` Missing pagination (`scanWithContinue` / `largeScan`) for large result sets

---

## 11. Streaming vs In-Memory Methods

FDB provides streaming (`RecordStream[A]` = `ZStream`) + in-memory (`List[A]`) variants of most read ops.

| Streaming (safe for large data) | In-Memory (small bounded data only) |
|--------------------------------|-------------------------------------|
| `store.scan(mapping, range)` -> `RecordStream[(K, M)]` | `store.scanL(mapping, range)` -> `List[(K, M)]` |
| `store.scanIndexRecords(...)` -> `RecordStream[M]` | `store.scanIndexRecordsL(...)` -> `List[M]` |
| `store.query(fdbQuery)` -> `RecordStream[M]` | `store.queryL(query)` -> `List[M]` |
| — | `store.scanAllL()` -> `List[M]` (**avoid entirely**) |

Datasets too large for single 5-second tx → use `large*` family — auto-handles continuation tokens across multiple tx:

| Method | Returns | Use When |
|--------|---------|----------|
| `largeScan` / `largeScanIndex` | `List[R]` | Batch processing with callback |
| `largeScanStream` / `largeScanIndexStream` | `ZStream` | Lazy streaming, bounded memory |
| `largeQuery` / `largeQueryStream` | `List[M]` / `ZStream[M]` | Query with continuation |

All `large*Stream` methods use `ZStream.unfoldChunkZIO` — each chunk separate read tx, no single tx exceeds 5-second limit.

**`.runCollect` safety:** Safe when stream comes from `large*Stream` methods, bounded by `TupleRange`/filter/`.take(n)`, or results known small (< 10K). Dangerous on `scan(mapping, TupleRange.ALL)` without bounds or `query` without `.setLimit()`.

**Continuation token pagination:** Use `scanWithContinue` for API endpoints with page tokens. Returns `(List[M], Option[Array[Byte]])` — `None` continuation means no more results. `large*` methods handle continuation internally — prefer them unless building paginated APIs.

Flag:
- `[BLOCKER]` `scanL` / `queryL` / `scanAllL` on potentially large/unbounded data — use streaming variants
- `[BLOCKER]` `scan` / `query` (streaming) with `.runCollect` on unbounded streams without `.take(n)` or filter
- `[SUGGESTION]` Missing `large*Stream` methods for cross-tx large dataset processing
- `[SUGGESTION]` `scan(mapping, TupleRange.ALL)` in single tx for large tables — use `largeScanStream`
- `[NITPICK]` In-memory `*L` methods on growing tables where data size will increase over time

---

## 12. Timeout Risks (5-Second Transaction Limit)

FDB kills tx exceeding 5 seconds. Any work with unpredictable latency inside tx = timeout risk.

```scala
// BAD: external API call inside FDB transaction
storeOps.transact { ops =>
  for {
    data     <- ops.get(id)
    enriched <- externalApi.enrich(data)  // 200ms-3s network call inside 5s tx!
    _        <- ops.update(enriched)
  } yield ()
}

// GOOD: read-then-compute-then-write (separate transactions)
for {
  data     <- FDBRecordDatabase.transactRead(ops)(_.getOpt(id))
  enriched <- externalApi.enrich(data)
  _        <- FDBRecordDatabase.transact(ops)(_.update(enriched))
} yield ()
```

FDB no support nested tx. `transact` inside another `transact` either deadlocks or creates separate tx (loses atomicity). Use `FDBOperations.Multi` to combine stores.

Flag:
- `[BLOCKER]` External API/HTTP/gRPC calls inside FDB transactions
- `[BLOCKER]` Nested `transact`/`read` calls inside transaction block
- `[SUGGESTION]` Heavy computation (map/filter/groupBy on large collections) inside transactions
- `[NITPICK]` `ZIO.sleep` or delays inside transactions
- `[NITPICK]` Logging with side effects (e.g., sending metrics) inside transactions

---

## 13. Parallelism Inside Transactions

Always use `RecordIO.parTraverseN` / `RecordReadIO.parTraverseN` with explicit bound. Standard: **8** (`ZIOUtils.defaultParallelism`), or 4 for lighter workloads.

| Workload | Recommended | Why |
|----------|-------------|-----|
| FDB reads within transaction | 8 | Balanced throughput vs FDB pressure |
| FDB writes within transaction | 4-8 | Writes are heavier, more contention |
| Across transactions (batch processing) | 4-8 | Each transaction uses FDB resources |
| FDB with rate-limited downstream | Match downstream | Don't overwhelm the bottleneck |

Flag:
- `[BLOCKER]` `ZIO.foreachPar` / `ZIO.collectAllPar` inside FDB transactions (unbounded parallelism)
- `[SUGGESTION]` Missing parallelism bound on FDB ops
- `[NITPICK]` Parallelism > 16 for FDB ops without documented justification

---

## 14. Transaction Conflict & Retry

FDB use optimistic concurrency — overlapping read-write ranges cause `FDBStoreTransactionConflictException`. Framework auto-retries. High-contention keys (counters, global state) cause retry storms — minimize contention scope by updating hot keys in small, separate tx.

Flag:
- `[SUGGESTION]` Large tx bodies touching known hot keys (counters, global config)
- `[NITPICK]` Manual retry logic for `FDBStoreTransactionConflictException` (framework handles this)

---

## 15. FDB Error Types

| Exception | Trigger | Handled By |
|-----------|---------|-----------|
| `FDBStoreTransactionSizeException` | Transaction > 10MB | `splitTransaction` (auto-halves batch) |
| `FDBStoreTransactionTimeoutException` | Transaction > 5 seconds | `splitTransaction` (auto-halves batch) |
| `FDBStoreTransactionIsTooOldException` | Transaction too stale | `splitTransaction` (auto-halves batch) |
| `FDBStoreTransactionConflictException` | Read-write conflict | `FDBRecordDatabase.transact` (auto-retries) |

Flag:
- `[BLOCKER]` Missing error handling for FDB exceptions in bulk ops (use `splitTransaction`)
- `[SUGGESTION]` Catching `FDBStoreTransactionConflictException` manually (let framework retry)
- `[SUGGESTION]` Generic `catchAll` swallows FDB exceptions without proper handling

---

## Diff-Bound Rule

Only flag issues on lines **added or modified in diff**. No critique pre-existing code author didn't touch. Pre-existing code with genuine data integrity / prod failure risk → mention as `[NOTE]` only.

## Output Format

For each issue found, report:
- **File**: path
- **Line**: number (if identifiable)
- **Severity**: `[BLOCKER]` (wrong effect type, missing registration, data integrity risk, will fail at scale), `[SUGGESTION]` (wrong tx type, pattern deviation, suboptimal perf), `[NITPICK]` (style, minor convention)
- **Confidence**: 0–100 (90+ certain, 70–89 strong signal, 50–69 suspicious, <50 don't report)
- **Issue**: what FDB pattern / perf rule violated, why dangerous
- **Current code**: fenced code block with actual code from file (3-5 lines context)
- **Suggested fix**: fenced code block with concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, AND nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings without code blocks rejected by aggregator.

Focus both correctness (right patterns, effect types, registrations) + performance (N+1 queries, unbounded scans, missing splits, timeout risks, external calls inside tx).

No issues found → report "FDB patterns and performance look clean — standard conventions followed."