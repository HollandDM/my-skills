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
| `target`, `adaptation` | Named implementation and clause-to-construct mappings at a terminal. |
| `implementation_plan` | An implementation-ready leaf's `approach` and `validation`, set with `ready`. |
| `decisions`, `deferred`, `depends` | Design choices, unresolved child-specific decisions, and shared dependencies. |
| `behavior` | Explicit state-transition and/or interaction-sequence records; see [html-view.md](html-view.md). |
| `design` | `draft`, `approved`, `stale`, `superseded`, or `retired`. Changed by state verbs. |
| `approved`, `approved_at`, `revision`, `approved_content_hash` | Attribution and identity of the accepted design revision. |
| `realization` | `not-started`, `partial`, or `implemented`; explicitly recorded independently of evidence. |
| `verification` | Derived: `unverified`, `partial`, `verified`, `stale`, or `failed`. |
| `evidence`, `history`, `revisions` | Check records, state changes, and full design snapshots preserved when reopening. |

JSON `set` accepts the prose fields, contract, metadata arrays, dependencies, implementation plan, behavior, and realization. Supplied arrays and nested objects replace their whole field. Approval content includes the statement, contract, body, target, adaptation, decisions, dependencies, plans, and behavior. Changes require `reopen`; historical retired or superseded content cannot be silently edited. Reopening a retired node explicitly revives it.

`statement` may be changed only while the node is draft. If its callable name changes, reopen every intended parent whose tagged body line calls the old name in the same `batch`; the CLI rewrites those exact direct calls while ignoring strings, member calls, and semantic relationships with different names. Re-approve the revised parents and child together. Update the statement, contract, body, and walkthrough as one coherent revision. Renaming should not require a replacement node when the responsibility retains its identity.

## Observed implementations

A node may additionally contain `bindings`, `observed_children`, `observation`, `observation_history`, `binding_history`, and implementation-version history. These are descriptive records, outside the approved intended-content fingerprint. They are maintained by `adopt`, `bind`, `observe`, and `sync`, not ordinary `set`.

Whole-file source fingerprints feed the evidence dependency context. A source change can invalidate verification without rewriting an approved contract. `implementation_version` and `implementation_revision` record recognized code versions; `current_implementation_version` and `source_state` are refreshed when inspecting the ledger. The observation keeps the exact inspected version. `conformance` compares current observations with intended clauses and never promotes verification. See [existing-work.md](existing-work.md) for these workflows and their completion rules.

## Refinement and leaves

Use a composite when separate operations or obligations need separate reasoning. There are no fixed clause, statement, or fan-out caps. Explain the relevant data flow, failures, cleanup, invariants, progress, and budgets. A large body is a signal to inspect its responsibilities, not a reason to split mechanically.

- **Terminal:** one named construct implements the contract, including an application function still to be written. Use `terminal D-NNN "python: str.strip"` and adaptation identifying how each clause is met. The CLI checks target syntax; inspect code or documentation to establish existing guarantees. For unwritten code, record the intended mappings and keep realization `not-started`.
- **Collapsed leaf:** the body reaches concrete constructs on each operation line, without further child refinement.
- **Implementation-ready leaf:** the contract and residual implementation risk are understood, but the code is not yet written. Use `ready D-NNN --approach "..." --validation "..."`. State enough detail to guide implementation and check the obligations; unknown behavior is not an implementation plan. Approval does not mark the leaf implemented.
- **Reuse:** call an approved node and rely on its contract. If the contract does not fit, revise it explicitly or define a distinct operation.

## Body notation

Follow [pseudocode.md](pseudocode.md) for paper-style algorithms, mathematical notation, and state/event rules.

```pseudo
procedure RunJob(key)
  item ← Validate(key)       ▷ D-001: Validate the caller's identity.
  assert item is valid
  result ← Execute(item)     ▷ D-002: Produce the requested result.
  return result
end procedure
```

One logical action per line; indentation represents nesting. Use explicit `if … then` / `end if` and `for each … do` / `end for` blocks. The optional matching procedure wrapper is removed on input and generated on output. Store contract headers in `contract`, not the body; line numbers are generated. Existing ASCII arrows and `--` tags remain accepted.

Tags: `▷ D-NNN: explanation` defines a child; `▷ ↗ D-NNN -- explanation` reuses an approved node; `▷ ⇒ target: identifier -- explanation` maps a concrete operation. An existing child's gloss can supply its explanation. Calls with one unambiguous existing signature may be auto-tagged.

`Program` presents root algorithms and separate named helper procedures. A call does not inline another procedure's local variables or returns. Approved and stale bodies display their actual state; draft bodies remain in node views, and retired/superseded bodies remain historical records. The HTML reader uses the same procedure boundaries and keeps graph references clickable.

## Approval and changes

Follow [interaction.md](interaction.md) or [auto-approval.md](auto-approval.md) for decision ownership. Approval covers the entire design content, not just the contract. A revision number and fingerprint bind evidence to that accepted content. `proposal <dir> D-NNN` returns its full SHA-256; `approve --actor WHO --proposal-hash HASH` checks that exact proposal. `approve --by WHO` remains the concise form for immediate or standing approval.

`repair` lists pending design work in dependency order. `reaffirm <dir> D-NNN --by WHO` re-accepts a stale node only when its approved content is unchanged; it advances the approval revision, retains the superseded-refinement record, and leaves previous evidence stale. Repair related dependencies in one batch when necessary.

`reopen` moves approved/stale/retired work to draft and preserves its previous content. `stale` records an invalidated current design. `supersede` names a replacement; `retire` records dropped work. Dropping child calls and retiring their orphaned nodes may need one `batch` so the final graph is valid.

Re-approval after a contract change invalidates dependent designs transitively. A body-only revision preserves caller contracts, but evidence depending on that revision becomes stale. Context changes automatically mark affected approved nodes and their dependents stale. `--minor` on a context wording change means its semantics are unchanged. Dependency and ADR changes also change the evidence context.

## Evidence coverage

```sh
evidence <dir> D-001 --kind property-test --ref tests/test_normalize.py --result pass --clause pre --clause post --scope implementation --scenario "empty, padded, and normalized finite strings" --assessment "Exercises normalization and output shape; does not cover non-string input."
```

Use one or more `--clause` labels (or `--covers pre,post`) from the contract. Every new record states whether it supports the implementation, the pseudocode composition argument, or implementation-to-design correspondence through `--scope`, and explains its result and limits through `--assessment`. Test-like evidence also names the executed inputs, mode, and path through `--scenario`. `--ref` identifies the artifact. `--note` holds supplementary provenance.

Do not renew evidence by copying an older record to a new revision. Re-open the artifact, confirm the exact configuration and path it exercised, and reassess each named clause. Keep evidence historical when that has not happened. A helper test supports a composed clause only when an accompanying composition/correspondence argument establishes the missing wiring. A passing test for storage alone does not prove that failure cleanup invokes it.

For each `(clause, kind, ref)` check, the latest result in the current revision applies. Any current failing check produces `failed`, including a current legacy unscoped failure. Rerun the same check and record its passing result to resolve it. A different passing check may explicitly resolve it using `--resolves EV-N`, covering every failed clause; otherwise it does not erase that failure. All clauses need current passing evidence before `verified`; incomplete coverage is `partial`. Evidence from an older design or dependency context is `stale`. Legacy unscoped records are retained but cannot establish clause coverage; new records must name clauses.

Verification is derived and cannot be manually promoted with `set`. Evidence never sets realization to implemented. A design argument may establish a contract while implementation is still outstanding; the two statuses remain separate. The tool verifies coverage bookkeeping, not the truth or adequacy of the supplied evidence.

If later inspection shows that evidence did not exercise the claimed behavior, use `withdraw-evidence`. Withdrawal keeps the original record and correction reason while removing its contribution to coverage. Do not encode withdrawal in a passing record's prose; the CLI rejects `pass` records described as withdrawn or retracted.

## Existing ledgers

Existing nodes and evidence remain readable. Intact legacy approvals receive a revision-zero fingerprint in memory; a mismatched legacy proposal hash makes the node stale. Older short proposal hashes must be refreshed with `proposal` before a new approval; old unscoped evidence is retained as stale rather than treated as complete coverage. Use `sync` to refresh stored statuses and generated Markdown, then record fresh scoped evidence as appropriate. HTML exports show current derived status without rewriting the ledger. No design is silently claimed implemented or verified during migration.
