# Interviewed refinement

Use this mode when the user has not delegated approval. It supports close design review, one node at a time.

Draft the active node's gloss, effect, and contract before asking about its unknowns. Ask one focused question at a time, naming the `?slug` and offering a recommendation with its reason and a meaningful alternative. Record the answer as a context entry with its actual source, then use `answer` to resolve the unknown. Reuse existing entries when appropriate.

Once the contract is settled, present a proposal containing:

- The node ID, statement, and a plain explanation of what it does.
- Its contract and proposed pseudocode body, or terminal target with clause-by-clause adaptation.
- The composition argument, consequential decisions, and any deferred questions with their owning nodes.
- Any applicable ADR conflict or pending decision.

Ask whether to accept, collapse the branch into a leaf, or change the proposal. Approval must cover the proposed statement, contract, and refinement; a general comment on the design is not automatically acceptance.

A collapsed leaf still maps every operation to real constructs. If that cannot be expressed within the ledger's body limit, explain the remaining work and retain a composite. Present a changed proposal before persisting it as accepted.

After acceptance, persist the body or target and metadata, then `approve` (default attribution is `user`). Continue directly to the next node's question or proposal. A user answer is not a reason to pause for another “continue.” If the user delegates recommendations, switch to [auto-approval.md](auto-approval.md).
