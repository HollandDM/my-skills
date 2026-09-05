# Auto-approval: batch refinement

## Authorization and provenance

Enter when the user explicitly delegates recommendations, such as “auto-accept your recommendations” or “don't wait for me, run it out.” Silence, a favorable comment, or a depth bound alone is not delegation. Briefly state the covered scope, completion boundary, and any applicable exclusions once. Existing authorization remains valid until revoked or its boundary is reached.

The result contains agent-chosen design decisions. Record newly chosen meanings as term or scenario entries with `--source "standing approval <YYYY-MM-DD>: agent recommendation"`, then resolve any corresponding node unknown with `answer`. Implementation choices without a new shared meaning need only the node decision record, attributed to standing approval. Put the rationale and material alternative in the node's `decisions`. Use `approve D-NNN --by "standing approval"` for every auto-approved node. Facts inspected in code or documentation retain their actual source; do not label agent decisions as user answers or empirical facts.

## Work in coherent batches

Select several ready frontier nodes that form a useful design slice: siblings sharing context, a short dependency chain, or a bounded subtree. Choose the size from coupling and uncertainty rather than a fixed count. When several nodes are ready, advance multiple nodes in the same batch; a single uncertain root may first need refinement to expose that frontier.

Use the algorithm structure in [pseudocode.md](pseudocode.md) for pseudocode. Draft contracts across the slice, resolve shared questions once, and reason about how the nodes compose. Keep separate contracts, composition arguments, and decision provenance for every node, plus adaptation or an implementation plan at leaves. Batching changes the unit of planning and reporting; it does not collapse all reasoning into a batch summary.

Persist in an order supported by the ledger:

- Approve a parent body before creating the child IDs it exposes on the frontier.
- Approve a reusable node before adding an explicit reuse call to it.
- Persist the slice with `batch --file changes.json` (or JSON on stdin). The CLI applies operations sequentially in memory, validates the final design, then commits and renders once. No operation in a rejected batch is persisted. See [tooling.md](tooling.md) for the format.
- Include dependency repairs, reopenings, and retirements in the same transaction when they must change together. Context changes invalidate affected nodes automatically. After a rejected batch, revise the batch against the unchanged ledger.

The agent may choose a collapsed leaf when its body reaches real constructs, or an implementation-ready leaf when the approach and validation plan are bounded. Unresolved behavior still needs refinement. Reduce the batch size when a shared assumption is unstable or a composition argument becomes difficult; expand it for routine grounded refinements.

For example, after approving a parent that exposes validation, transformation, and rendering, refine those three children together. If rendering needs a helper exposed by a new body, approve that body and include the helper in the same working batch when useful. There is no mandatory turn boundary between levels.

## Report decisions, keep going

Do not print a question and simulate answering it, or emit an approval menu for each node. The ledger contains the full reasoning. After a coherent batch, give a concise update naming the nodes advanced, consequential decisions, remaining uncertainty, and next slice. Continue immediately to the next batch; the update is not a request for approval or a stopping point.

At completion or a blocker, link the design and give one consolidated list of auto-approved node IDs and agent-sourced entries, grouped by batch if useful. Include the verification limits and any unfinished nodes. This is the review entry point for decisions made under delegated authority.

## Boundaries

Ask when a requirement only the user holds prevents a defensible recommendation, when the proposed action exceeds the granted scope, or when an accepted ADR conflicts with the design and preserve-versus-supersede needs the user's decision. Resolve factual uncertainty through investigation first. For new ADRs within the delegated scope, record the decision and attribution in the ADR prose before accepting it; accepted-ADR conflicts follow [adr-ledger.md](adr-ledger.md).

Keep affected nodes unresolved. While an answer is pending, continue independent nodes whose contracts do not depend on that answer when the host supports it. Never adopt a provisional answer silently. An unresolved CLI limitation blocks ledger progress: report the failing operation and attempted repairs rather than manufacturing content to pass lint.

A blocker does not revoke authorization for the remaining scope. Resume without a fresh grant once it is resolved.
