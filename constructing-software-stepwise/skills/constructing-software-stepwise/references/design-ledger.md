# Design Ledger Format

Design = approved refinement tree, serialized. Answers **how accepted semantic ops compose to satisfy parent contracts**.

Not: interview transcript, impl diary, backlog, component inventory.

## Layout — one node per file

Existing design-doc convention if present. Else:

```text
docs/design/<topic>/
  DESIGN.md                index only: root, frontier, ADR list, node table
  nodes/D-000-<slug>.md    one node
  nodes/D-010-<slug>.md
```

`DESIGN.md` holds no node body. Node file + its `DESIGN.md` row written in same edit. Never append node content to `DESIGN.md` "for now".

Write node file immediately after its user-owned decisions approved. Never reconstruct tree from memory at session end.

Only approved design authoritative. Candidates live in conversation / scratch notes. Unapproved proposal never appears as accepted.

## Index — `DESIGN.md`

```markdown
# <Design name>

Context: ./CONTEXT.md
Evidence: ./EVIDENCE.md
Applicable ADRs:
- ../../adr/0003-example.md (accepted)

## Root

Root node: D-000
Active frontier: D-120, D-240

## Nodes

| ID | Operation | Parent | Design | Realization | Verification | File |
| --- | --- | --- | --- | --- | --- | --- |
| D-000 | <root operation> | — | approved | not-started | unverified | [nodes/D-000-<slug>.md](nodes/D-000-<slug>.md) |
| D-120 | <operation> | D-100 | approved | partial | unverified | [nodes/D-120-<slug>.md](nodes/D-120-<slug>.md) |
```

Table row = mirror of node file header. Status changes in file → same edit updates row.

Stable IDs (`D-NNN`) from first node. ID = semantic node; never renumber for document order. Slug may change; ID never.

`Active frontier` updated in same edit that adds, approves, or stales a node.

## Node Kinds

| Kind | Test | Fields |
|---|---|---|
| Terminal | Effect = ONE existing fn / lib call / platform feature / repo pattern, named in `Realization` | Header lines + Effect + Realization |
| Composite | else | all fields below |

Composite fan-out 2–7. 1 → rename, not refinement. >7 → add intermediate node.

## Node — `nodes/D-120-<slug>.md`

```markdown
# D-120 — <Semantic operation>

Design status: approved | stale | superseded
Realization: not-started | partial | implemented
Verification: unverified | partial | verified
Parent: D-100
Depends on: CTX-F03, D-090, ADR-0003

## Effect

<The net observable behavior this node establishes.>

## Contract

- Preconditions: <facts required before activation>
- Postconditions: <guarantees after successful completion>
- Failure semantics: <errors, cancellation, retries, partial progress, recovery>
- Invariants: <properties preserved throughout or across transitions>
- Budgets: <relevant latency, memory, cost, security, reliability, operability>
- Vocabulary: <links to context/terms or context/scenarios files>

## Refines into

- D-121 — <child operation> → [nodes/D-121-<slug>.md](D-121-<slug>.md)
- D-122 — <child operation> → [nodes/D-122-<slug>.md](D-122-<slug>.md)

## Composition argument

<Why the children, in their stated order or relationship, establish this node's contract. Cover each of data flow, failures, cleanup, invariants, progress; write `n/a: <reason>` for any that does not apply.>

## Approved decisions

- <Decision and concise rationale>

## Deferred boundaries

- <Question deliberately deferred> — becomes relevant at <child node or trigger>

## Realization

- Code or configuration: <paths or identifiers>
- Evidence: <evidence/EV-D120-NN-<slug>.md links>
```

Composition argument covers each of: data flow, failures, cleanup, invariants, progress. Not applicable → `n/a: <reason>`. Never omit silently.

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

Argument may be mathematical, operational, type-based, or evidence-backed. Examples/tests ≠ proof. Don't claim proof.

## Reuse as Composition

Approved node = fn w/ contract. Callers / parents rely on contract; never reopen internals.

Reopen only when one changes:

- context term / fact it depends on
- parent contract
- invariant or budget
- applicable ADR
- child contract / dependency
- evidence required for verification state

Dependency changes → node `stale` in file header AND index row, keep last approved content for comparison, revisit affected frontier only. Never keep `approved` / `verified` silently.

## State Separation

Three independent axes:

- `Design status` — semantic design accepted?
- `Realization` — impl exists?
- `Verification` — current evidence covers obligations?

Approved ≠ implemented. Implemented can violate design. Verified goes stale on dependency change.
