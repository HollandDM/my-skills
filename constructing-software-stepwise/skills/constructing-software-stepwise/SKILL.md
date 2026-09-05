---
name: constructing-software-stepwise
description: Contract-based software design when the user requests Stepwise or auditable refinement; interactive HTML browsing of existing Stepwise ledgers.
---

# Constructing Software Stepwise

Refine an abstract operation into smaller operations whose contracts compose, until each leaf maps to a real construct or has a bounded implementation approach and validation plan. Keep the design, assumptions, decisions, and evidence durable enough for another engineer to continue.

## Choose the working mode

- **Interviewed (default):** work through one node with the user. Read [interaction.md](references/interaction.md).
- **Auto-approval:** when the user explicitly delegates recommendations or says to proceed without waiting, refine coherent batches of nodes. Read [auto-approval.md](references/auto-approval.md). Honor existing authorization; do not request it again.

State the scope and completion boundary briefly. Respect an explicit design-only, subtree, or depth bound. Otherwise finish the refinement tree; implement and verify only when implementation is part of the request. Auto-approval changes pacing and decision ownership within that scope, not permission for unrelated external actions.

## Design discipline

Write a node's statement, effect, and contract before resolving its unknowns or refining it. Use `?slug` for an unresolved term or decision. Inspect relevant code, documentation, or experiments for factual answers; ask the user only for information or choices they hold. Defer child-specific unknowns to their owning nodes.

Choose boundaries around responsibilities, invariants, and uncertainty. Explain how the body establishes the parent guarantees without strengthening preconditions or permitting forbidden behavior. Address relevant data flow, failures, cleanup, invariants, and progress; give difficult obligations enough detail to assess them. Reopen an ancestor when a deeper finding invalidates its contract.

Use pseudocode for composite operations and concrete targets at leaves. Established platform constraints may appear in contracts and facts when they determine feasibility. When a documented primitive already satisfies the contract, cite it and map each clause to the actual construct; do not reimplement its guarantees in the design. Unwritten application functions are still design work, not existing terminal targets.

Refine until the remaining obligations and implementation risks are understood. Split by responsibility or difficult reasoning, not clause or line counts. Use `ready` for a bounded implementation leaf whose contract, approach, and validation are clear; unresolved behavior still needs refinement. Write self-contained sentences and explain tagged body lines. Use names and IDs to reference shared definitions instead of repeating them.

## Durable state

Use the bundled `scripts/stepwise.py` (Python 3, standard library) for all ledger mutations. `ledger.json` is canonical; `DESIGN.md`, `CONTEXT.md`, and `nodes/*.md` are generated views. Only ADR prose is edited by hand. Default location: `docs/design/<topic>/`; follow an established repository convention when present.

Read only the reference needed for the current operation:

- [html-view.md](references/html-view.md): export a browsable tree, contract/pseudocode reader, and diagram with `html <dir> [--output FILE]`.
- [tooling.md](references/tooling.md): CLI commands, creation, updates, and error handling.
- [design-ledger.md](references/design-ledger.md): node fields, body notation, realization, change propagation, and evidence.
- [context-ledger.md](references/context-ledger.md): terms, facts, scenarios, and unresolved decisions.
- [adr-ledger.md](references/adr-ledger.md): consequential architectural decisions and conflicts with accepted ADRs.

Use `status`, `frontier`, and relevant node views to orient. Persist a coherent slice through `batch`: operations are applied in memory, validated together, and committed with one render. A rejected operation or invalid final state leaves the ledger and views unchanged. Group node fields in one JSON `set`; never invent content to satisfy validation.

Approval, implementation, and verification are distinct claims. Record who supplied decisions and who approved nodes. Preserve changed decisions through `reopen`, `stale`, `supersede`, or `retire`; revisit affected dependents instead of silently editing approved work.

## Completion

For a complete design, every live node is approved, each leaf is terminal, collapsed, or implementation-ready, the frontier is empty, applicable ADRs are resolved, and `check` succeeds. An empty frontier alone is insufficient if draft or stale nodes remain. For a bounded request, report the completed boundary and remaining frontier explicitly.

When implementation is requested, realize the approved design and gather evidence covering its contract obligations. Choose verification proportional to the obligation. Record evidence against explicit contract clauses. Verification is derived from coverage of the current approval revision and dependencies; failing checks prevent verified status. Evidence never changes implementation status. The CLI tracks coverage but cannot establish that an argument or test is sufficient.

Continue through the authorized scope until completion or a genuine blocker. Finish with the result, consequential decisions, validation limits, and any remaining work, linking the durable design rather than repeating it.
