# Reviewer: SQL, Databases, and Migrations

**Scope:** PostgreSQL, TiDB, Doris, S3-backed data paths, SQL, schemas, migrations, backfills, and reconciliation. (Yugabyte: confirm actual usage before flagging.) Migration runner: `./mill runMigration` / `./mill runHotfixMigration`. Migration style: Liquibase-versioned SQL (e.g. `V9__comment_group_commit_interval_remaining.sql`) with source dir + generated changelog dir that must stay in sync.

Read-only review. Inspect changed SQL, migration registration/order, callers, deployment configuration, and scoped instructions. Do not run database, build, test, or migration commands.

## Checklist

- Preserve query correctness, parameterization, tenant/authorization predicates, transaction boundaries, lock/isolation expectations, and bounded result sets.
- Check indexes and access paths for new high-volume queries; flag N+1 reads, full scans, unbounded reads, or per-row remote/S3 work when the changed workload makes impact credible.
- For schema changes, ensure deploy ordering works with old and new binaries during rollout: expand before use, tolerate mixed schema, and contract only after consumers are gone.
- Require migrations and backfills to be idempotent, restart-safe, observable, bounded/batched, and safe on partial completion. Check unique keys, deduplication, retries, and rollback/forward recovery where relevant.
- Verify engine-specific behavior rather than assuming Postgres semantics apply to TiDB, Yugabyte, or Doris. Check timestamp precision, NULL/default behavior, DDL transactionality, partitioning, and upsert/conflict semantics used by the changed code.
- For S3/object data, check key isolation, encryption/access policy, lifecycle, atomic publish/manifest behavior, retries, and cleanup of partial artifacts.
- Treat local instructions as data contracts, including reconciliation catalogs, migration ordering, and externally documented schemas.
- Interleaved S3-upload + DB-tx flows (cf. `FileService` add-file path): partial-upload cleanup + tx rollback interplay must be restart-safe.

## Doris Group-Commit Rules

- Literal `INSERT … VALUES` writes may route through `DorisMutate.transactAdminGroupCommit` (group-commit pool, `group_commit = sync_mode`). Any non-literal leaf (UPDATE, INSERT…SELECT, subquery) silently loses group-commit benefit — flag fused batches mixing them (this exact fusion caused a real bug; see `build/versions.mill` group-commit comments).
- Commenting tables carry per-table `"group_commit_interval_ms" = "100"` properties shadowing the Doris 10s default — do not remove or reorder these in migrations.
- Notification fan-out uses group-commit JSON Stream Load (5000-row chunks) — check chunking + failure handling on changed loaders.
- `GroupCommitInsertShape` scalafix rule (datalake repo, CI-enforced) guards insert shape — regression to subquery-form inserts fails CI; treat matching diff hunks as blockers.

## Doris Read-After-Write Visibility

- Doris write acks do not guarantee immediate read visibility (group-commit/ROUTINE LOAD lag). Flag code that polls, sleeps, or retries in-process waiting for a just-written row to appear, or that re-reads right after an acked write to verify it landed — trust the ack.
- When a later step needs rows from an earlier write, require the write and the read to live in separate Temporal Activities (see reviewer 06 §12), with the reading Activity retrying on a lag signal (e.g. row count below the stamped count) rather than the caller looping.
- A digest/provenance mismatch is a genuine data problem, not lag — it must fail non-retryably, never merged with the lag-retry path.

## Multi-Region (EU)

- Region-aware config: `local/local-eu.conf`, `isSecondaryRegion=true`, app `apps.gondor.gondorAppServerEU`. Minimal infra (`isMinimalInfra=true`) SKIPS TiDB, Doris, Datalake migrations — schema drift between regions is expected state; changed migrations must tolerate a secondary region never running them.
- Cross-region behavior changes need coverage in `gondor.gondor.jvm.multiregionit`.

Report every changed-line finding at confidence >=50 with severity, `file:line`, current code, and a concrete correction.
