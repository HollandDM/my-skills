# Design Ledger Format

`DESIGN.md` = approved refinement tree, serialized. Answers **how accepted semantic ops compose to satisfy parent contracts**.

Not: interview transcript, impl diary, backlog, component inventory.

## Location + Update Rule

Existing design-doc convention if present. Else beside context file:

```text
docs/design/order-execution/DESIGN.md
```

Write node immediately after its user-owned decisions approved. Never reconstruct tree from memory at session end.

Only approved design authoritative. Candidates live in conversation / scratch notes. Unapproved proposal never appears as accepted.

## Header

```markdown
# <Design name>

Context: ./CONTEXT.md
Evidence: ./EVIDENCE.md
Applicable ADRs:
- ../../adr/0003-example.md

## Root

Root node: D-000
Active frontier: D-120, D-240
```

Stable IDs (`D-NNN`) from first node. ID = semantic node; never renumber for document order.

`Active frontier` updated in same edit that adds, approves, or stales a node.

## Node Kinds

| Kind | Test | Fields |
|---|---|---|
| Terminal | Effect = ONE existing fn / lib call / platform feature / repo pattern, named in `Realization` | Header lines + Effect + Realization |
| Composite | else | all fields below |

Composite fan-out 2–7. 1 → rename, not refinement. >7 → add intermediate node.

## Node Format

```markdown
## D-120 — <Semantic operation>

Design status: approved | stale | superseded
Realization: not-started | partial | implemented
Verification: unverified | partial | verified
Parent: D-100
Depends on: CTX-F03, D-090, ADR-0003

### Effect

<The net observable behavior this node establishes.>

### Contract

- Preconditions: <facts required before activation>
- Postconditions: <guarantees after successful completion>
- Failure semantics: <errors, cancellation, retries, partial progress, recovery>
- Invariants: <properties preserved throughout or across transitions>
- Budgets: <relevant latency, memory, cost, security, reliability, operability>
- Vocabulary: <links to terms or scenarios in CONTEXT.md>

### Refines into

- D-121 — <child operation>
- D-122 — <child operation>

### Composition argument

<Why the children, in their stated order or relationship, establish this node's contract. Cover each of data flow, failures, cleanup, invariants, progress; write `n/a: <reason>` for any that does not apply.>

### Approved decisions

- <Decision and concise rationale>

### Deferred boundaries

- <Question deliberately deferred> — becomes relevant at <child node or trigger>

### Realization

- Code or configuration: <paths or identifiers>
- Evidence: <EVIDENCE.md record IDs>
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

Dependency changes → node `stale`, keep last approved content for comparison, revisit affected frontier only. Never keep `approved` / `verified` silently.

## State Separation

Three independent axes:

- `Design status` — semantic design accepted?
- `Realization` — impl exists?
- `Verification` — current evidence covers obligations?

Approved ≠ implemented. Implemented can violate design. Verified goes stale on dependency change.
