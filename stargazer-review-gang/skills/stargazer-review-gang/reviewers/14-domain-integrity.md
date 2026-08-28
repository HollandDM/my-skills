# Reviewer: Domain Integrity and Local Contracts

**Scope:** Financial state/calculations, documents, forms, signature workflows, OCR/extraction, and contracts documented in scoped instruction files.

Read-only review. Contracts live less in nested AGENTS.md (rare here) and more in: root `AGENTS.md` (typed-ID rule via `ModelIdRegistry.parser`), gitignored root `CLAUDE.local.md` (build-command contract: `./mill-fast --no-server`), `docs/adr/*.md` (e.g. 0001-editable-import-preview-storage), `docs/plans/*.md`, and endpoint/trace catalogs under `docs/`. These may describe behavior that types and tests do not encode. AML/KYC workflow correctness is in scope; authentication decisions consuming KYC outcomes route to reviewer 09.

## Checklist

- Financial: preserve typed IDs (`ModelIdRegistry.parser`), currency/decimal precision (money surfaces via cue `MoneySchema`/`MoneyJson` and fundsub amount parse/format helpers such as `LpReviewServiceLive.parseCommitmentAmount` — flag raw `BigDecimal`/`Double`/float-money introduction), rounding, timestamps/effective dates, idempotency, state transitions, audit trails, and authorization boundaries. Check that retries cannot duplicate financial effects.
- Documents/forms/signatures: preserve versioning, access controls, template/schema compatibility, signer identity/order, immutable audit evidence, storage lifecycle, and failure/retry behavior. Changes touching the import-item-result store, `gaiaState` snapshots, or Order Creation seeding must honor `docs/adr/0001-editable-import-preview-storage.md` (snapshot override in `FundSubDataImportInterface` store, required upsert op, createdAt/updatedAt + Temporal GC cron, V1/V2 gaia engine replay compatibility).
- OCR/extraction: preserve source/provenance, confidence and human-review gates where required, page/field mapping, PII handling, and idempotent reprocessing.
- Local contracts: trace changed behavior to the scoped instructions and documented consumer/catalog/config files — concretely: `docs/adr/`, `docs/plans/`, `docs/datalake-commenting-endpoint-catalog.md`, `docs/commenting-api-trace-catalog.md`, protobuf schema registrations, and typed-ID registry entries. Flag an update that leaves an explicitly required companion artifact, registration, ordering, or explanatory contract stale.

Report every changed-line finding at confidence >=50 with severity, `file:line`, current code, and a concrete correction.
