# Design ledger

The ledger records how child operations satisfy parent contracts, what was approved, and what evidence covers the current design. Write self-contained prose and refer to shared concepts by name or ID.

## Storage and node fields

`docs/design/<topic>/ledger.json` is canonical. `DESIGN.md`, `CONTEXT.md`, and `nodes/D-NNN.md` are generated views. Ledger mutations use the CLI. ADR prose is maintained in separate Markdown files.

| Field | Meaning |
|---|---|
| `statement` | Abstract call such as `result <- normalize(value)`, established by `new`. |
| `gloss`, `effect`, `contract` | Explanation, intended effect, and an object of lowercase clause labels to explicit requirements. Draft unknowns use `?slug`. |
| `body` | Parsed pseudocode lines, set with `body --text` or `--file`. |
| `walkthrough`, `composition` | What the body does and why it establishes the contract. |
| `target`, `adaptation` | Existing construct and clause-to-construct mappings at a terminal. |
| `implementation_plan` | An implementation-ready leaf's `approach` and `validation`, set with `ready`. |
| `decisions`, `deferred`, `depends` | Design choices, unresolved child-specific decisions, and shared dependencies. |
| `behavior` | Explicit state-transition and/or interaction-sequence records; see [html-view.md](html-view.md). |
| `design` | `draft`, `approved`, `stale`, `superseded`, or `retired`. Changed by state verbs. |
| `approved`, `approved_at`, `revision`, `approved_content_hash` | Attribution and identity of the accepted design revision. |
| `realization` | `not-started`, `partial`, or `implemented`; explicitly recorded independently of evidence. |
| `verification` | Derived: `unverified`, `partial`, `verified`, `stale`, or `failed`. |
| `evidence`, `history`, `revisions` | Check records, state changes, and full design snapshots preserved when reopening. |

JSON `set` accepts the prose fields, contract, metadata arrays, dependencies, implementation plan, behavior, and realization. Supplied arrays and nested objects replace their whole field. Approval content includes the statement, contract, body, target, adaptation, decisions, dependencies, plans, and behavior. Changes require `reopen`; historical retired or superseded content cannot be silently edited. Reopening a retired node explicitly revives it.

## Observed implementations

A node may additionally contain `bindings`, `observed_children`, `observation`, `observation_history`, `binding_history`, and implementation-version history. These are descriptive records, outside the approved intended-content fingerprint. They are maintained by `adopt`, `bind`, `observe`, and `reconcile`, not ordinary `set`.

Whole-file source fingerprints feed the evidence dependency context. A source change can invalidate verification without rewriting an approved contract. `implementation_version` and `implementation_revision` record recognized code versions; `current_implementation_version` and `source_state` are refreshed when inspecting the ledger. The observation keeps the exact inspected version. `conformance` compares current observations with intended clauses and never promotes verification. See [existing-work.md](existing-work.md) for these workflows and their completion rules.

## Refinement and leaves

Use a composite when separate operations or obligations need separate reasoning. There are no fixed clause, statement, or fan-out caps. Explain the relevant data flow, failures, cleanup, invariants, progress, and budgets. A large body is a signal to inspect its responsibilities, not a reason to split mechanically.

- **Terminal:** one existing construct satisfies the contract. Use `terminal D-NNN "python: str.strip"` and adaptation identifying how each clause is met. The CLI checks target syntax; inspect code or documentation to establish existence and guarantees.
- **Collapsed leaf:** the body reaches concrete constructs on each operation line, without further child refinement.
- **Implementation-ready leaf:** the contract and residual implementation risk are understood, but the code is not yet written. Use `ready D-NNN --approach "..." --validation "..."`. State enough detail to guide implementation and check the obligations; unknown behavior is not an implementation plan. Approval does not mark the leaf implemented.
- **Reuse:** call an approved node and rely on its contract. If the contract does not fit, revise it explicitly or define a distinct operation.

## Body notation

```pseudo
run_job(key):
  item <- validate(key)       -- D-001: Validate the caller's identity.
  { item is valid }
  result <- execute(item)     -- D-002: Produce the requested result.
  -> result
```

One statement per line; indentation represents nesting. An optional first signature line is removed by the parser. Abstract assignment is `<-`; return is `->`; conditions and loops use ordinary pseudocode. Assertions use `{ ... }`.

Tags: `-- D-NNN: explanation` defines a child; `-- ↗ D-NNN -- explanation` reuses an approved node; `-- ⇒ target: identifier -- explanation` maps an operation to a concrete construct. An existing child's gloss can supply its explanation. Calls with one unambiguous existing signature may be auto-tagged.

`Program` expands approved composite bodies and hoists shared procedures. Implementation-ready leaves display `◇ implementation-ready`. The HTML reader retains draft and historical content with visible state labels.

## Approval and changes

Follow [interaction.md](interaction.md) or [auto-approval.md](auto-approval.md) for decision ownership. Approval covers the entire design content, not just the contract. A revision number and fingerprint bind evidence to that accepted content.

`reopen` moves approved/stale/retired work to draft and preserves its previous content. `stale` records an invalidated current design. `supersede` names a replacement; `retire` records dropped work. Dropping child calls and retiring their orphaned nodes may need one `batch` so the final graph is valid.

Re-approval after a contract change invalidates dependent designs transitively. A body-only revision preserves caller contracts, but evidence depending on that revision becomes stale. Context changes automatically mark affected approved nodes and their dependents stale. `--minor` on a context wording change means its semantics are unchanged. Dependency and ADR changes also change the evidence context.

## Evidence coverage

```sh
evidence <dir> D-001 --kind property-test --ref tests/test_normalize.py --result pass --clause pre --clause post --note "Covers finite strings, including whitespace-only inputs."
```

Use one or more `--clause` labels from the node's contract. Evidence records the current approval revision, full design fingerprint, and dependency context. Describe scope and limits in `--note`; record only checks actually performed or arguments actually established.

For each `(clause, kind, ref)` check, the latest result in the current revision applies. Any current failing check produces `failed`, including an unscoped failure. Rerun the same check and record its passing result to resolve it. Different passing checks do not erase an unresolved failure. All clauses need current passing evidence before `verified`; incomplete coverage is `partial`. Evidence from an older design or dependency context is `stale`. An unscoped record is retained but cannot establish clause coverage.

Verification is derived and cannot be manually promoted with `set`. Evidence never sets realization to implemented. A design argument may establish a contract while implementation is still outstanding; the two statuses remain separate. The tool verifies coverage bookkeeping, not the truth or adequacy of the supplied evidence.

## Existing ledgers

Existing nodes and evidence remain readable. Legacy approvals receive a revision-zero fingerprint in memory; old unscoped evidence is retained as stale rather than treated as complete coverage. Use `sync` to refresh stored statuses and generated Markdown, then record fresh scoped evidence as appropriate. HTML exports show current derived status without rewriting the ledger. No design is silently claimed implemented or verified during migration.
