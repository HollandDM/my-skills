# Evidence Ledger Format

Evidence = why obligation currently believed to hold. Answers **what checked, against which obligation, result, limitation**.

Approval → `nodes/`. Rationale → ADR. Evidence alone grants `verified`.

## Layout — one record per file

Existing verification / test-plan convention if present. Else:

```text
docs/design/<topic>/
  EVIDENCE.md                          index only: record table
  evidence/EV-D120-01-<slug>.md        one record
```

Record file + `EVIDENCE.md` row written in same edit. Create index on first obligation w/ evidence. Never record command not run or proof not established.

## Index — `EVIDENCE.md`

```markdown
# <Design name> — Evidence

| ID | Node | Obligation (short) | Method | Status | Recorded | File |
| --- | --- | --- | --- | --- | --- | --- |
| EV-D120-01 | D-120 | <clause> | property-test | passed | YYYY-MM-DD | [evidence/EV-D120-01-<slug>.md](evidence/EV-D120-01-<slug>.md) |
```

Row mirrors record header. Status change in file → same edit updates row.

## Record — `evidence/EV-D120-01-<slug>.md`

```markdown
# EV-D120-01 — <Short evidence name>

Design node: D-120 → [../nodes/D-120-<slug>.md](../nodes/D-120-<slug>.md)
Obligation: <exact contract clause, invariant, ADR constraint, or budget checked>
Method: type-check | example | property-test | integration-test | static-analysis | proof | model-check | benchmark | fault-injection | observation
Artifact: <test name, code path, model, report, or command>
Environment: <relevant versions, configuration, hardware, dataset, or assumptions>
Status: passed | failed | partial | stale
Observed: <actual result>
Expected: <required result>
Limitations: <what this evidence does not establish>
Recorded: YYYY-MM-DD
```

One record per (node, method, aspect). Node's `Realization → Evidence` links back here.

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

- every clause under node's Contract (pre / post / failure / invariants / budgets) has current evidence
- all records `passed`
- `Limitations` don't exclude claimed operating conditions
- applicable ADR invariants have impl evidence
- no dependency stale

Else `unverified` or `partial` + name missing obligation.

## Staleness

Mark `stale` (file + index row) on change to: contract / vocab tested; ancestor or child composition; applicable ADR; impl code / config; dependency versions; anything listed in `Environment`.

Stale ≠ false. Old result no longer justifies current claim. Keep record; add fresh; restore `verified` only after coverage current.
