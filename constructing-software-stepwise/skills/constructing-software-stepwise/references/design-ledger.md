# Design Ledger Format

Design = approved refinement tree, serialized. Answers **how accepted semantic ops compose to satisfy parent contracts**.

Not: interview transcript, impl diary, backlog, component inventory.

## Layout — one node per file

Existing design-doc convention if present. Else:

```text
docs/design/<topic>/
  DESIGN.md                index only: root, frontier, ADR list, node table
  nodes/D-000-<slug>.md    one node = one refinement step
  nodes/D-010-<slug>.md
```

## Atomic File Rules

- **One node = one refinement step = one file.** Parent contract + children + why they compose. Nothing about grandchildren.
- **Self-describing header.** `Kind`, ID, `Index` link, three status axes, `Parent`, `Depends on` — all links. Reader orients w/o opening index.
- **Link, never repeat.** Contract references context items by link. Never restate a term's definition or a fact's text inside node.
- **One line per clause.** Each precondition / postcondition / invariant / decision = one line. Needs a paragraph → it hides a term or fact → extract to `context/`, link it.
- **Size cap.** Node file ≤ 80 lines. Over → mixed levels or hidden context. Split or extract.
- Node file + `DESIGN.md` row written in same edit. Never append node content to `DESIGN.md` "for now".

Write node file immediately after its user-owned decisions approved. Never reconstruct tree from memory at session end.

Only approved design authoritative. Candidates live in conversation / scratch. Unapproved proposal never appears as accepted.

## Index — `DESIGN.md`

```markdown
# <Design name>

Kind: index · Context: [./CONTEXT.md](./CONTEXT.md) · Evidence: [./EVIDENCE.md](./EVIDENCE.md)
Root: D-000 · Active frontier: D-120, D-240

## Applicable ADRs

- [ADR-0003 <title>](../../adr/0003-<slug>.md) — accepted — constrains D-100, D-120

## Nodes

| ID | Operation | Parent | Design | Realization | Verification | File |
| --- | --- | --- | --- | --- | --- | --- |
| D-000 | <root operation> | — | approved | not-started | unverified | [nodes/D-000-<slug>.md](nodes/D-000-<slug>.md) |
| D-120 | <operation> | D-100 | approved | partial | unverified | [nodes/D-120-<slug>.md](nodes/D-120-<slug>.md) |
```

Row mirrors node header. Status change in file → same edit updates row.

Stable IDs (`D-NNN`) from first node. ID = semantic node; never renumber. Slug may change; ID never.

`Active frontier` updated in same edit that adds, approves, or stales a node.

## Node Kinds

| Kind | Test | Fields |
|---|---|---|
| Terminal | Effect = ONE existing fn / lib call / platform feature / repo pattern, named in `Realization` | Header + Effect + Realization |
| Composite | else | all fields below |

Composite fan-out 2–7. 1 → rename, not refinement. >7 → add intermediate node.

## Node — `nodes/D-120-<slug>.md`

```markdown
# D-120 — <Semantic operation>

Kind: node · Index: [../DESIGN.md](../DESIGN.md)
Design: approved | stale | superseded · Realization: not-started | partial | implemented · Verification: unverified | partial | verified
Parent: [D-100](D-100-<slug>.md)
Depends on: [CTX-F03](../context/facts/CTX-F03-<slug>.md), [D-090](D-090-<slug>.md), [ADR-0003](../../../adr/0003-<slug>.md)
Approved: YYYY-MM-DD by <user>

## Effect

<One or two sentences: net observable behavior this node establishes.>

## Contract

- Pre: <one line>
- Post: <one line>
- Failure: <one line: errors, cancellation, retries, partial progress, recovery>
- Invariant: <one line>
- Budget: <one line: latency / memory / cost / security / reliability>
- Vocabulary: [<term>](../context/terms/<slug>.md), [CTX-S01](../context/scenarios/CTX-S01-<slug>.md)

## Refines into

- [D-121 — <child operation>](D-121-<slug>.md)
- [D-122 — <child operation>](D-122-<slug>.md)

## Composition argument

- Data flow: <how outputs of one child feed the next>
- Failures: <which child fails how; how parent Failure clause holds>
- Cleanup: <what is released / compensated; or `n/a: <reason>`>
- Invariants: <which child establishes / preserves each>
- Progress: <why it terminates / stays live; or `n/a: <reason>`>

## Decisions

- <one line: decision — reason>

## Deferred

- <question> → resolves at [D-121](D-121-<slug>.md)

## Realization

- Code: <paths or identifiers>
- Evidence: [EV-D120-01](../evidence/EV-D120-01-<slug>.md)
```

Composition argument: five fixed bullets, each present. Not applicable → `n/a: <reason>`. Never omit silently.

## Approval Rule

Agent derives + recommends. User approves anything changing product semantics, accepted risk, compatibility, cost commitment, hard-to-reverse architecture.

Approval covers recorded contract + decomposition, not prose. Preserve user's exact negatives, ordering constraints, numeric limits, failure semantics verbatim. No weakening in summary.

## Refinement Obligation — before `approved`

- **Coverage:** children establish every parent guarantee
- **Safety:** composition permits nothing parent forbids
- **Assumptions:** no precondition silently strengthened
- **Composition:** ordering, data flow, errors, retries, cleanup, recovery fit
- **Invariants:** inherited + local initialized and preserved
- **Progress:** termination / liveness justified when required
- **Budgets:** non-functional reqs feasible
- **ADR compat:** satisfies every applicable accepted ADR

Argument may be mathematical, operational, type-based, or evidence-backed. Examples / tests ≠ proof. Don't claim proof.

## Reuse as Composition

Approved node = fn w/ contract. Callers / parents rely on contract; never reopen internals.

Reopen only when one changes: context item it links; parent contract; invariant / budget; applicable ADR; child contract; evidence needed for verification state.

Dependency changes → `stale` in file header AND index row. Keep last approved content for comparison. Revisit affected frontier only. Never keep `approved` / `verified` silently.

## State Separation

Three independent axes:

- `Design` — semantic design accepted?
- `Realization` — impl exists?
- `Verification` — current evidence covers obligations?

Approved ≠ implemented. Implemented can violate design. Verified goes stale on dependency change.
