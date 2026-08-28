# Evidence Ledger Format

Evidence = why obligation currently believed to hold. Answers **what checked, against which obligation, result, limitation**.

Approval → `nodes/`. Rationale → ADR. Evidence alone grants `verified`.

## Layout — index, one file per node

Existing verification / test-plan convention if present. Else:

```text
docs/design/<topic>/
  EVIDENCE.md              index only: record table
  evidence/D-120.md        every record for node D-120, one `##` section each
```

Records change status (passed → stale) → grouped per node, edited in place.

## Entry Rules

- **One record = one (node, obligation, method).** Same test covering two clauses → two sections, same `Artifact`.
- **Heading = anchor.** `## EV-D120-01 <name>` → `evidence/D-120.md#ev-d120-01-<slug>`. No punctuation inside heading.
- **Self-describing section.** First line after heading: `Status`, `Recorded`.
- **Link, never repeat.** Quote obligation clause by link + short label; don't paste node contract.
- **Size cap.** Section ≤ 15 lines.
- Section + `EVIDENCE.md` row written in same edit. Create index + node file on first obligation w/ evidence.
- Never record command not run or proof not established.

## Index — `EVIDENCE.md`

```markdown
# <Design name> — Evidence

Kind: index · Design: [./DESIGN.md](./DESIGN.md)

| ID | Node | Obligation | Method | Status | Recorded | File |
| --- | --- | --- | --- | --- | --- | --- |
| EV-D120-01 | D-120 | Post: <label> | property-test | passed | YYYY-MM-DD | [D-120.md#ev-d120-01](evidence/D-120.md#ev-d120-01-<slug>) |
```

Row mirrors section header. Status change in section → same edit updates row.

## Records — `evidence/D-120.md`

```markdown
# D-120 — Evidence

Kind: evidence · Index: [../EVIDENCE.md](../EVIDENCE.md) · Node: [D-120](../nodes/D-120-<slug>.md)

## EV-D120-01 <Short evidence name>

Status: passed | failed | partial | stale · Recorded: YYYY-MM-DD

Obligation: <Contract clause label, e.g. "Post: at-least-once tool effect">
Method: type-check | example | property-test | integration-test | static-analysis | proof | model-check | benchmark | fault-injection | observation
Artifact: <test name, code path, model, report, or command>
Environment: <versions, config, hardware, dataset, assumptions>
Observed: <actual result>
Expected: <required result>
Limitations: <what this does NOT establish>
```

Node's `Realization → Evidence` links back here.

## Method Selection — cheapest covering risk

- types / compiler diagnostics → structural constraints
- focused examples → concrete boundary behavior
- property tests → laws over input space
- integration tests → effect boundaries, composition
- static analysis / formal proof → universal properties
- model check → state machines, concurrency, failure interleavings
- benchmark → latency / throughput / memory / cost budgets
- fault injection → retry, recovery, durability, partial failure
- production observation → only w/ explicit environment + sampling limits

Never promote evidence kind. Examples ≠ proof. Local proof ≠ environmental assumptions. Benchmark ≠ prod guarantee.

## Verification Rule — `verified` iff ALL

- every clause under node's Contract (Pre / Post / Failure / Invariant / Budget) has current evidence
- all records `passed`
- `Limitations` don't exclude claimed operating conditions
- applicable ADR invariants have impl evidence
- no dependency stale

Else `unverified` or `partial` + name missing obligation.

## Staleness

Mark `stale` (section + index row) on change to: contract / vocab tested; ancestor or child composition; applicable ADR; impl code / config; dependency versions; anything in `Environment`.

Stale ≠ false. Old result no longer justifies current claim. Keep record; add fresh; restore `verified` only after coverage current.
