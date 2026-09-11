---
name: constructing-software-stepwise
description: Stepwise software design, reconstruction of existing code, fresh reconstruction, incremental sync, and interactive design review.
---

# Constructing Software Stepwise

Refine an abstract operation into smaller operations whose contracts compose, until each leaf maps to a real construct or has a bounded implementation approach and validation plan. Keep the design, assumptions, decisions, and evidence durable enough for another engineer to continue.

## Pseudocode is the primary artifact

**Pseudocode is the most important output of this work. It must let a reader understand and reason about the system at a high level, then follow each substantial operation down to its implementation.** The hierarchy, source hashes, claims, diagrams, and reports support that explanation; none substitutes for it.

**Keep pseudocode closely aligned with implementation, always.** During reconstruction and maintenance, describe the actual data flow, decisions, ownership, state changes, ordering, failures, retries, and externally visible outcomes. Do not beautify away awkward behavior, invent guarantees, or leave important work hidden behind an unexplained helper. A code change is not fully reconciled until the affected pseudocode and its references have been reinspected and updated in the same task. If inspection is blocked, mark the correspondence as unresolved instead of presenting stale pseudocode as current.

Forward design describes intended behavior until implementation exists. Once code exists, compare it with that intent explicitly: update the observed algorithm to match the code, then fix the code or revise the intended design through the authorized workflow. Never silently rewrite an approved requirement to make the implementation appear conformant.

Read [pseudocode.md](references/pseudocode.md) before writing or reviewing algorithms. Every substantial operation must have an explicit link to its own procedure or a concrete implementation mapping; explain small operations inline. Calls remain clickable at the algorithm line in the HTML reader. Preserve the reader's ability to reason at the current abstraction level without opening every child. Finish with a top-down readability pass, a source-correspondence pass, and `check --strict-pseudocode`; a green structural audit is necessary for a complete artifact, not proof of semantic adequacy.

## Choose the workflow

- **Design new or changed behavior:** use the design discipline below.
- **Reconcile:** rebuild the model from current implementation in a fresh ledger. Derive responsibilities and relationships independently of the previous node tree; read [existing-work.md](references/existing-work.md).
- **Sync:** update an existing model incrementally, preserving node identities and reinspecting changed sources. Whole-file SHA-256 versions signal affected nodes, including uncommitted changes; read [existing-work.md](references/existing-work.md).
- **Browse a model:** read [html-view.md](references/html-view.md).

## Approval mode

- **Interviewed (default):** work through one node with the user. Read [interaction.md](references/interaction.md).
- **Auto-approval:** when the user explicitly delegates recommendations or says to proceed without waiting, refine coherent batches of nodes. Read [auto-approval.md](references/auto-approval.md). Honor existing authorization; do not request it again.

State the scope and completion boundary briefly. Respect an explicit design-only, subtree, or depth bound. For forward design, otherwise finish the refinement tree. For adoption or reconciliation, use the source-inspection completion boundary in existing-work.md. Implement and verify only when implementation is part of the request. Auto-approval changes pacing and decision ownership within that scope, not permission for unrelated external actions.

## HTML before every review question

**HTML is the primary user review surface. Before every user-facing question, clarification, decision request, or approval request in a Stepwise workflow, persist the current review context through the CLI and export a fresh HTML snapshot with `node <skill>/dist/stepwise.mjs html <dir>`.** This applies to design, reconstruction, sync, and follow-up questions after a previous answer. Export again before each request; an older snapshot does not satisfy this requirement.

Record the relevant draft proposal, pseudocode, alternatives, or unresolved question before export so the reader contains what the user is being asked to assess. Keep drafts and unknowns explicit; exporting does not approve anything. Include a clickable HTML link in the question, with the relevant node fragment and intended/observed pseudocode route when applicable. Keep chat focused on the decision and recommendation rather than making the user review a duplicate inline design.

If no ledger exists yet, create a minimal draft with the known scope and explicit unknowns through the CLI, then export before asking. If creation or export is genuinely blocked, report the blocker and request only the information needed to unblock it; do not present a stale snapshot as current review material. Internal CLI queries and source inspection do not require exports. Before the final handoff, export the latest state and link its HTML as well.

## Design discipline

Write a node's statement, effect, and contract before resolving its unknowns or refining it. Use `?slug` for an unresolved term or decision. Inspect relevant code, documentation, or experiments for factual answers; ask the user only for information or choices they hold. Defer child-specific unknowns to their owning nodes.

Choose boundaries around responsibilities, invariants, and uncertainty. Explain how the body establishes the parent guarantees without strengthening preconditions or permitting forbidden behavior. Address relevant data flow, failures, cleanup, invariants, and progress; give difficult obligations enough detail to assess them. Reopen an ancestor when a deeper finding invalidates its contract.

Use research-paper-style algorithms for composite operations and concrete targets at leaves. When writing or reviewing pseudocode, read [pseudocode.md](references/pseudocode.md): named procedures, explicit contract headers, numbered steps, structured blocks, and separate correctness arguments. Use state and event rules when they better express a protocol. Established platform constraints may appear in contracts and facts when they determine feasibility. When a documented primitive already satisfies the contract, cite it and map each clause to the actual construct; do not reimplement its guarantees in the design. A named application function may be a terminal target before it is written; record its intended clause mappings and leave realization as `not-started`. Refine further when its responsibilities or risks remain unclear.

Refine until the remaining obligations and implementation risks are understood. Split by responsibility or difficult reasoning, not clause or line counts. Use `ready` for a bounded implementation leaf whose contract, approach, and validation are clear; unresolved behavior still needs refinement. Write self-contained sentences and explain tagged body lines. Use names and IDs to reference shared definitions instead of repeating them.

## Durable state

Use the bundled CLI `node <skill>/dist/stepwise.mjs <verb> <dir> ...` (Node.js 22+, no installation) for all ledger mutations. `ledger.json` is canonical; `DESIGN.md`, `CONTEXT.md`, and `nodes/*.md` are generated views. Only ADR prose is edited by hand. Default location: `docs/design/<topic>/`; follow an established repository convention when present.

Read only the reference needed for the current operation:

- [html-view.md](references/html-view.md): export a browsable tree, contract/pseudocode reader, and diagram with `html <dir> [--output FILE]`.
- [tooling.md](references/tooling.md): CLI commands, creation, updates, and error handling.
- [design-ledger.md](references/design-ledger.md): node fields, body notation, realization, change propagation, and evidence.
- [context-ledger.md](references/context-ledger.md): terms, facts, scenarios, and unresolved decisions.
- [adr-ledger.md](references/adr-ledger.md): consequential architectural decisions and conflicts with accepted ADRs.

Use `status`, `frontier`, and relevant node views to orient. Persist a coherent slice through `batch`: operations are applied in memory, validated together, and committed with one render. A rejected operation or invalid final state leaves the ledger and views unchanged. Group node fields in one JSON `set`; never invent content to satisfy validation.

Approval, implementation, inspection, and verification are distinct claims. Record who supplied decisions and who approved nodes. Preserve changed decisions through `reopen`, `stale`, `supersede`, or `retire`. Revise a statement and all parent calls coherently in one batch. Use `repair` for dependency order and `reaffirm` when a stale node is unchanged and its dependencies have been re-accepted. Export observations before editing them; withdraw invalid evidence explicitly instead of disguising it as a passing correction.

## Completion

For a complete intended design, every in-scope design node is approved, each leaf is terminal, collapsed, or implementation-ready, the frontier is empty, applicable ADRs are resolved, and `check --strict-pseudocode` succeeds. An empty frontier alone is insufficient if intended design nodes remain draft or stale. Observational-only nodes do not require approval; assess source freshness and algorithm traceability separately through `scan`. A complete reconstruction requires both `coverage.complete` and `pseudocode.complete`, plus the semantic reading and correspondence passes above. Source-current files with disconnected or opaque algorithms do not complete the work. If an intended refinement relies on an observed node, give it an explicit contract through the design workflow. For a bounded request, report the completed boundary and unresolved obligations explicitly.

When implementation is requested, realize the approved design and gather evidence covering its contract obligations. Choose verification proportional to the obligation. Record evidence against explicit contract clauses. Verification is derived from coverage of the current approval revision and dependencies; failing checks prevent verified status. Evidence never changes implementation status. The CLI tracks coverage but cannot establish that an argument or test is sufficient.

Continue through the authorized scope until completion or a genuine blocker. Finish with the result, consequential decisions, validation limits, and any remaining work, linking the durable design rather than repeating it.
