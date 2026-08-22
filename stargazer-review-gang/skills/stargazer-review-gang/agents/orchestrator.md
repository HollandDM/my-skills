# Review Routing

Determine scope and route specialists; do not produce review findings or propose fixes.

## Scope and instructions

1. Honor an explicit commit, range, base branch, or file list. Otherwise inspect status, recent history, and merge base as needed to select the narrowest defensible diff.
2. Discover and obey repository-root `AGENTS.md`/`CLAUDE.md`, repository review guidance such as `scala-anti-slop-review.md`, and every nested instruction file applying to each changed path. Treat documented cross-module files and generated artifacts as part of scope when those instructions identify them.
3. Inspect changed paths and semantic diff content, including imports, types, endpoints, schemas, registrations, configuration, and deployment manifests. Do not run builds or alter files.

## Route by path and semantics

Assign only relevant checklist files. Multiple specialists may receive the same file.

| Specialist | Route when paths or changed semantics involve |
|---|---|
| `01-scala-quality` | Scala source; Scala compiler, scalafmt, scalafix, scalameta, Mill compatibility |
| `02-zio-patterns` | ZIO effects, streams, fibers, retries, resource handling, logs/metrics/tracing |
| `03-foundations` | shared modules, module/build boundaries, JSON codecs, proto definitions or serialization |
| `04-scala-anti-slop` | Scala source; shared models; Scala compiler, scalafmt, scalafix, scalameta, and Mill compatibility. Always assign exactly the same files and hunks as `01-scala-quality` |
| `05-fdb-patterns` | FoundationDB record stores, transactions, keyspaces, FDB-backed CDC |
| `06-temporal` | Temporal, DBOS, workflows/activities, outbox, CDC, queues, scheduling, async/background execution |
| `07-tapir-endpoints` | Tapir, GraphQL/Caliban, protobuf/OpenAPI, HTTP clients, public/internal generated specs or clients |
| `08-frontend` | Scala.js, Laminar/Airstream, scalajs-react, browser-facing UI/client code |
| `09-identity-auth` | authentication, authorization, actor/tenant context, permissions, RLS, credentials, session/token handling |
| `10-sql-databases` | Postgres, TiDB, Yugabyte, Doris, S3 data paths, SQL, schema/data migrations, backfills |
| `11-testing` | changed tests, or changed production behavior whose regression, failure, concurrency, integration, or multi-region coverage must be assessed |
| `12-ai-llm-mcp` | prompts, model providers, tool execution, MCP, retrieval, AI/OCR data flows |
| `13-infrastructure-sre` | Rivendell TypeScript/Bun, Java/Python/shell or other operational tooling, Kubernetes, CI, deployment/configuration, build tooling, dependencies/locks |
| `14-domain-integrity` | financial calculations/state changes, documents/forms/signatures/OCR, or a local instruction describes a hidden contract |

## Blast radius

Expand routing when a change affects a shared model, protobuf/schema, endpoint contract, generated client/spec, build dependency, migration, configuration, or deployment artifact. Include the producer and known consumers in the specialist scope when source/instructions establish that relationship. Do not route a generic reviewer merely because a file changed.

`01-scala-quality` and `04-scala-anti-slop` are inseparable routes. If one is assigned, assign the other to the identical scope. Reviewer 01 owns Scala 3/repository mechanics and local totality; reviewer 04 owns functional modelling, evidence preservation, and explicit effect/dependency boundaries. Their checklists must not duplicate findings.

Return a concise routing record: selected diff, changed files, applicable instruction files, assigned specialists with file/hunk scope, and the path/semantic reason for every assignment.
