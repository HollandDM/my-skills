---
name: stargazer-review-gang
description: >
  Read-only, capability-based multi-angle review for Stargazer changes. Use for
  reviewing current changes, commits, branches, or pull requests before pushing.
---

# Stargazer Review Gang

Review changes without modifying the repository. This skill is portable across agent runtimes: describe work in terms of capabilities and intent, never assume a particular workflow, team, messaging, or agent API.

## Read-only contract

Allowed: inspect git status, log, merge bases, diffs, source, documentation, configuration, and local instructions. Do not edit files or run compile, test, lint, format, build, dependency-install, generation, or deployment commands. Do not auto-fix findings or require them to be persisted anywhere.

## Flow

1. Infer the exact review scope from the request. Resolve an explicit commit/range/file list as given; otherwise use git state and recent history to choose the narrowest defensible diff. State the selected scope in the final report.
2. Inspect repository instructions before reviewing: repository-root `AGENTS.md`, `CLAUDE.md`, and review guidance such as `scala-anti-slop-review.md`, then every applicable nested instruction file for changed paths. Read relevant build/package/config files when the diff or instructions make them material.
3. Perform one routing pass using `agents/orchestrator.md`. Route only specialists whose path or semantic triggers apply; there is no mandatory baseline reviewer.
4. Assign each routed specialist its checklist and the exact changed files/hunks. Fan out independent reviewers concurrently when the runtime supports concurrent delegation; otherwise execute them sequentially. If subagents are unavailable, the main agent performs every routed checklist itself.
5. Reviewers inspect source and the selected diff. They report every finding with confidence at least 50, a severity (`BLOCKER`, `SUGGESTION`, or `NITPICK`), the causal changed `file:line`, current code, and suggested code. When a changed contract breaks an unchanged consumer, registration, or configuration, include that affected location as evidence. They do not pre-filter borderline findings and do not edit.
6. Give all findings to one strongest available validator using `agents/validator.md`. The validator verifies findings against the actual changed lines and surrounding source, removes false positives and duplicates, and retains every unique finding with confidence at least 50. The final wording may be synthesized rather than copied verbatim from a reviewer.
7. Return a findings-first report. Include the chosen review scope, routed specialists, and review limitations after findings. If there are no retained findings, say so plainly.

## Specialist Checklists

Route the existing focused reviewers when applicable:

| Checklist | File | Use for |
|---|---|---|
| Scala quality and code health | `reviewers/01-scala-quality.md` | Scala source, shared models, Scala build/tooling changes |
| ZIO, observability, streams | `reviewers/02-zio-patterns.md` | ZIO effects, concurrency, logging, metrics, streams |
| Architecture and serialization | `reviewers/03-foundations.md` | module boundaries, shared/proto/codec changes |
| Scala anti-slop | `reviewers/04-scala-anti-slop.md` | Scala source, shared models, and Scala build/tooling changes; same assigned scope as Scala quality |
| FoundationDB | `reviewers/05-fdb-patterns.md` | FDB records, transactions, keyspaces, CDC-adjacent stores |
| Distributed execution | `reviewers/06-temporal.md` | Temporal, DBOS, outbox, CDC, queues, async/background work |
| API and wire compatibility | `reviewers/07-tapir-endpoints.md` | Tapir, GraphQL/Caliban, protobuf, OpenAPI, generated clients |
| Frontend | `reviewers/08-frontend.md` | Scala.js, Laminar, Airstream, scalajs-react, UX/a11y/client security/performance |
| Identity and authorization | `reviewers/09-identity-auth.md` | authentication, authorization, tenants, RLS, secrets/session handling |
| SQL, databases, migrations | `reviewers/10-sql-databases.md` | Postgres, TiDB, Yugabyte, Doris, S3 data paths, schema/data migrations |
| Testing | `reviewers/11-testing.md` | changed tests and production behavior requiring regression, integration, multi-region, or concurrency coverage |
| AI, LLM, MCP safety | `reviewers/12-ai-llm-mcp.md` | models, prompts, tools, MCP, retrieval, AI data flows |
| Infrastructure, SRE, build | `reviewers/13-infrastructure-sre.md` | Rivendell TypeScript/Bun, Java/Python/shell tooling, Kubernetes, CI, configs, dependencies/supply chain |
| Domain integrity | `reviewers/14-domain-integrity.md` | financial workflows, documents/forms/signatures/OCR, hidden local contracts |

Use only evidence supported by the diff, applicable instructions, and source. A checklist is guidance, not a reason to manufacture findings.

`01-scala-quality` and `04-scala-anti-slop` are a paired route: assign both to the same files and hunks whenever either applies. Reviewer 01 owns compiler/lint enforcement, Scala 3 mechanics, and local totality; reviewer 04 owns functional domain modelling, evidence preservation, and explicit effect/dependency boundaries.
