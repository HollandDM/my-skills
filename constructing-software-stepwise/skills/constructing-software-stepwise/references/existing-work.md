# Adopt and reconcile existing code

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

`reconcile <dir>` persists detected source states and implementation-version history, and invalidates evidence that depended on older source bytes. It does not advance an observation's inspected baseline or rewrite the intended design. A monotonically increasing `implementation_revision` records each newly recognized implementation fingerprint, with previous/current hashes and Git context. Nodes retain the old observations until reinspected.

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

## Reconcile incrementally

Use `scan` to identify changed files and their affected nodes. Reinspect that slice, update observations and comparisons in batches, and preserve unchanged node identities. File movement requires rebinding; hash comparison cannot infer a renamed symbol's meaning. `reconcile --repo /new/location` explicitly relocates a ledger's source root; `scan --repo` inspects an alternate root without persisting it.

If the implementation diverges from approved intent, record the difference. Changing the implementation or revising the intended contract is a separate decision within the user's task scope. Current code is not automatically the authority on what the system should do.

## Completion and review

Adoption is complete when the selected behavior is explained by current source-backed observations, its relevant relationships are modeled, and uncertainties are explicit. The absence of intended contracts does not prevent completion. Reconstruction does not need a fully approved design frontier.

Reconciliation is complete when the affected observations are current or remaining inaccessible/unresolved areas are explicitly reported, and differences from intended contracts remain visible. `scan` lists pending inspections and recorded differences. Missing sources cannot be called current merely to finish the workflow.

In the HTML reader, **Observed code** shows source bindings, implementation hashes and revision history, claims, uncertainties, and conformance. Filters expose changed/uninspected implementations and contract differences. The full-width map includes observed relationships; choose **Observed behavior** to inspect the descriptive state/sequence charts. The existing Changes tab compares these records against the human review baseline.
