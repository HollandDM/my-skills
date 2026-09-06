# Rebuild or sync a model from existing code

`reconcile` rebuilds a model from scratch. `sync` updates an existing model incrementally.

## Reconcile: reconstruct independently

Start from source entry points and the user's scope. Trace current implementation before consulting the old hierarchy. Recover a fresh decomposition from responsibilities, state transitions, effects, failures, and interactions. Previous IDs, leaf decisions, topology, approvals, and evidence are not a template for the new model.

Run `reconcile <old-dir> [--output <new-dir>] [--repo ROOT]` to initialize an empty reconstruction ledger. Without `--output`, the CLI chooses a timestamped sibling directory. It carries over only the declared scope/non-goals, title, and source repository; it records the previous ledger path and hash for comparison. The old ledger and its history remain intact. Node IDs are local to each ledger.

Initialization is not completion: the CLI does not analyze source. Continue with source inspection and batches of `adopt`, `bind`, and `observe` in the new directory. Write source-backed pseudocode for substantial operations. Establish new intended contracts and approvals only when authorized. With no previous ledger, start directly with `adopt`.

Read applicable requirements and accepted architectural constraints while deriving the topology independently. Rebuilt ledgers keep their ADRs under `<new-dir>/adr/`, so old ADR node IDs cannot silently constrain unrelated new nodes. Map applicable decisions to the rebuilt responsibilities and record their source. Do not discard a requirement because code omits it.

After reconstructing the selected behavior, compare with the previous ledger: report missing responsibilities, changed boundaries, splits/merges, and differences from approved intent. Link the new directory as the replacement review artifact. Resume an interrupted rebuild there using `adopt`, `observe`, and `sync`; another `reconcile` starts another fresh model.

## Follow dispatched application behavior

Application-owned Temporal workflows, activities, queue consumers, actor handlers, callbacks, and Lambda functions require inspection and refinement. The runtime API dispatching them is a mechanism, not a sufficient stopping boundary. Resolve the actual implementation and trace it. If it lives in another repository, inspect it when available or explicitly report an unresolved/out-of-scope boundary.

Attach the dispatched responsibility to its initiating responsibility through observational relationships. Describe starts/attaches, signals, waits, and completion in claims and behavior diagrams. Do not invent a synchronous pseudocode call solely to satisfy graph validation. A runtime execution with no child workflows can still have many design refinement children.

Stop at an understood primitive, an explicitly scoped external boundary, or a small responsibility whose internal obligations are fully explained. For an application-owned leaf, record why further decomposition adds no useful reasoning. Naming a function, obtaining current file hashes, or recording matching clause assessments does not establish adequate refinement depth.

Use this workflow to explain existing implementation or keep its model current. It shares the ledger and viewer with forward design, but its observations are descriptive. Recording what code does does not approve that behavior as a requirement.

## Choose the scope

Start from a bounded operation, entry point, or subsystem. Trace inputs, effects, failures, state transitions, ownership, and dependencies as needed to explain that behavior. Recover responsibilities from those traces: a node may span several functions, and a shared function may belong to several nodes.

Read relevant implementation, configuration, tests, and documentation. Distinguish observed behavior from inferred intent. When sources disagree, name the disagreement; do not make the code appear to satisfy the documentation by silently rewriting the contract. Do not stop merely because an application function exists: inspect the behavior the user wants explained. Stop expanding at an understood responsibility or a trusted external boundary.

## Adopt a model

`adopt` creates observational nodes without approving or changing intended contracts. Supply `--parent` to create their descriptive hierarchy. It can also link an existing node under an observational parent without modifying that node's statement or approval. Shared nodes may have multiple parents; recursive calls belong in observed pseudocode, not cyclic parent relationships.

```sh
adopt <dir> D-000 "result <- process(input)"
adopt <dir> D-001 "value <- normalize(input)" --parent D-000
bind <dir> D-000 src/process.py --repo /path/to/repository --symbol process
bind <dir> D-001 src/labels.py --symbol normalize
scan <dir> --json
```

Use the existing `batch` command to create and bind a coherent slice together. The agent reads and explains the code; the CLI tracks sources, versions, observations, and comparisons. It does not infer semantics from a call graph automatically.

The first binding needs `--repo`. The repository root is stored relative to the design directory so a normal clone can retain its layout. Paths inside a binding must be repository-relative; symlinks resolving outside the repository are refused. Use `bind ... --binding S01` to replace a binding, or `unbind <dir> D-NNN S01 --reason "..."` to remove it. Prior bindings and observations remain in history.

## Implementation versions and signals

**The containing file is the hashing boundary.** Each binding gets a SHA-256 over its complete file bytes. `--symbol` and optional `--lines START:END` are navigation hints only; neither narrows the hash nor changes the code version. An edit elsewhere in the same file flags every associated node. These conservative false positives are intentional: a signal means inspect the node, not that its behavior necessarily changed.

A node associated with one source file uses that file's SHA-256 directly as its implementation version. A node spanning multiple bound or dependent files uses a combined SHA-256 of their repository-relative paths and whole-file hashes. Changes to uncommitted working-tree content are detected. The Git commit hash is recorded as context; a new commit with identical bound file contents does not itself imply a new implementation version. Deletions or unreadable sources remain explicit notifications.

`scan --json` is read-only. It reports current, recorded, and observed implementation versions; changed bindings; affected nodes; inspection tokens; conformance; `assessment_pending` for intended clauses needing comparison; and a `notifications` list. `status` also signals pending implementation inspection. Run a scan when beginning or resuming this workflow and before relying on previously reconstructed nodes. There is no background watcher; the signal is refreshed on CLI reads/writes and HTML export.

`sync <dir>` persists detected source states and implementation-version history, and invalidates evidence that depended on older source bytes. It does not advance an observation's inspected baseline or rewrite the intended design. A monotonically increasing `implementation_revision` records each newly recognized implementation fingerprint, with previous/current hashes and Git context. Nodes retain the old observations until reinspected.

## Record inspected behavior

After `scan`, inspect the relevant source files. Submit its node-specific `inspection_token` with `observe --at`. The CLI rejects the observation if source bytes or the binding scope changed during inspection. New dependencies introduced by observed pseudocode must also be covered: bind their files and rescan if the command reports an expanded scope.

```json
{
  "effect": "The implementation trims whitespace from the input string.",
  "claims": [
    {"text":"normalize calls str.strip and returns its result.","basis":"observed","sources":["S01"]},
    {"text":"The operation appears intended to canonicalize labels.","basis":"inferred","sources":["S01"]}
  ],
  "unknowns": ["The behavior expected for non-string input is not documented."],
  "pseudocode": "normalize(input):\n  -> input.strip() -- ⇒ python: str.strip -- Remove surrounding whitespace."
}
```

```sh
observe <dir> D-001 --file observation.json --at <inspection_token>
```

An observation requires an effect and nonempty claims. Each claim cites this node's binding IDs and labels its basis `observed` or `inferred`. Use `unknowns` for unresolved requirements or runtime assumptions. `pseudocode` and `behavior` diagrams are optional and remain separate from the intended body and diagrams. The inspection is attributed through `--by` (default `agent inspection`). Observation revisions preserve earlier claims, source bindings, and implementation fingerprints.

Intended design state, approval, realization, and evidence are never promoted by `adopt`, `bind`, or `observe`. For an existing approved node, observation updates do not need reopening because they do not change its accepted contract. Actual contract changes use the normal design workflow and its approval mode. An intended refinement may rely on an adopted operation only after that operation receives an explicit contract; observed-only metadata is not a substitute for the child guarantee.

## Compare with an intended contract

If a contract exists, add clause-level comparisons to the observation:

```json
{
  "comparisons": {
    "post": {"status":"differs","reason":"The implementation uppercases input but does not remove surrounding whitespace."}
  }
}
```

Merge this field into the full observation payload. Comparisons name existing clause labels and use `matches`, `differs`, or `unknown` with a reason. A difference remains a difference even if other clauses are unassessed. An overall `matches` requires every intended clause to have a current matching assessment. Source drift or a later intended-design change makes conformance unknown until reassessed. This is an inspection assessment, not verified evidence. With no intended contract, conformance is `unassessed`.

## Sync incrementally

Use `scan` to identify changed files and their affected nodes. Reinspect that slice, update observations and comparisons in batches, and preserve unchanged node identities. File movement requires rebinding; hash comparison cannot infer a renamed symbol's meaning. `sync --repo /new/location` explicitly relocates a ledger's source root; `scan --repo` inspects an alternate root without persisting it.

If the implementation diverges from approved intent, record the difference. Changing the implementation or revising the intended contract is a separate decision within the user's task scope. Current code is not automatically the authority on what the system should do.

## Completion and review

Reconcile is complete only when the fresh model explains the selected implementation through source-backed responsibilities and relationships, substantial dispatched work has been traced, and comparison with the previous model is reported. A newly initialized directory or an empty scan result is not a reconstructed model. The previous graph must not be copied forward and merely relabeled as rebuilt.

Adoption is complete when the selected behavior is explained by current source-backed observations, its relevant relationships are modeled, and uncertainties are explicit. The absence of intended contracts does not prevent completion. Reconstruction does not need a fully approved design frontier.

Sync is complete when the affected observations are current or remaining inaccessible/unresolved areas are explicitly reported, and differences from intended contracts remain visible. `scan` lists pending inspections and recorded differences. Missing sources cannot be called current merely to finish the workflow.

In the HTML reader, **Observed code** shows source bindings, implementation hashes and revision history, claims, uncertainties, and conformance. Filters expose changed/uninspected implementations and contract differences. The full-width map includes observed relationships; choose **Observed behavior** to inspect the descriptive state/sequence charts. The existing Changes tab compares these records against the human review baseline.
