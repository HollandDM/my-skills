---
name: constructing-software-stepwise
description: Use when designing or implementing systems with interacting components, state transitions, durable or long-running workflows, concurrency, distributed state, or explicit correctness/reliability constraints — or when user asks for stepwise, refinement-based, correct-by-construction, or one-step-at-a-time interviewed design. Not for isolated mechanical edits.
---

# Constructing Software Stepwise

Stepwise refinement (Dijkstra EWD249/EWD340, Wirth CACM 1971): minute steps, decide as little as possible per step, proof grows with program, representation deferred, back up to any ancestor when needed. Spec not given here → interview builds it, per node.

Cycle, this order: (1) pick ONE node, draft contract ≤ 6 clauses, unknowns `?slug` → (2) one question per `?`, this node only → (3) propose ONE refinement + composition argument → (4) user approves / denies → (5) persist → next node.

Small refinement → small contract → small vocabulary. Many questions = scope leaking from children.

## Pacing — hard rules

| Rule | Observable test |
|---|---|
| One refinement per approval | Turn proposes children for exactly one node |
| Draft before ask | Node file exists, `Design: draft`, Effect, Contract ≤ 6 clauses, unknowns `?slug`, before first question |
| Interview bounded | Every question names the `?` it clears. No `?` → no question → `Open ambiguities` row, `Resolves at: child of D-NNN` |
| Scope leak gauge | `?` > 6 at draft → shrink Effect, push detail to children, redraft. Questions per node ≤ initial `?` count |
| Interview before proposal | No children while draft has any `?` or open user-owned decision |
| One question per turn | Exactly one question to user. Then wait |
| Approval explicit | Yes to shown Proposal block. Agreement to prose ≠ approval → show block, ask |
| Step small | Each composition bullet ≤ 2 lines. Longer → insert intermediate node |
| Back up freely | Obligation fails → revise children or reopen ancestor |

## Node Kinds

| Kind | Test | Record |
|---|---|---|
| Terminal | Effect = ONE existing fn / lib call / platform feature / repo pattern, named in `Realization` | Effect + Realization |
| Composite | else | every field in [design-ledger.md](references/design-ledger.md) |

Composite → 2–7 children. 1 = rename. >7 = missing intermediate node. "Trivial / obvious / clear enough" not decision words; tables decide.

## Durable Artifacts

Repo convention wins; else:

```text
docs/design/<topic>/
  CONTEXT.md              index: scope, non-goals, term/fact/scenario tables, open ambiguities
  context/terms.md        every term, one ## section
  context/facts.md        every fact, one ## section
  context/scenarios.md    every scenario, one ## section
  DESIGN.md               index: root, frontier, ADRs, node table
  nodes/D-000-<slug>.md   one node = one refinement step = one file
  EVIDENCE.md             index: record table
  evidence/D-000.md       every record for D-000, one ## section
docs/adr/NNNN-<slug>.md   one decision = one file
```

| Dimension | Unit | Why | Index | Format |
|---|---|---|---|---|
| Meaning | `##` section, one file per kind | edited in place | `CONTEXT.md` | [context-ledger.md](references/context-ledger.md) |
| Design | one file per node | append-only once approved | `DESIGN.md` | [design-ledger.md](references/design-ledger.md) |
| Evidence | `##` section, one file per node | status flips | `EVIDENCE.md` | [evidence-ledger.md](references/evidence-ledger.md) |
| Decision | one file per ADR | supersede, never rewrite | — | [adr-ledger.md](references/adr-ledger.md) |

Rules:
- One claim per unit. Two citable statements → two units.
- `##` heading = anchor: `## CTX-F01 Required runtime` → `facts.md#ctx-f01-required-runtime`. Link anchors.
- Unit first line: ID, status, date. Readable alone.
- Link, never repeat. Definition 1–2 sentences, what it IS. Canonical term + `Avoid:` aliases.
- Caps: context section ≤ 10 lines, evidence section ≤ 15, ADR ≤ 40, node ≤ 80. Over → split.
- Index = status + link only. Unit + row same edit. Create index on first unit.

## Core Loop

```dot
digraph refine {
    "Pick one composite node at frontier" [shape=box];
    "Draft node file: Effect + Contract, unknowns as ?slug" [shape=box];
    "More than 6 ? marks?" [shape=diamond];
    "Shrink Effect; push detail to children" [shape=box];
    "Any ? left in draft?" [shape=diamond];
    "Answerable from code/docs/tools?" [shape=diamond];
    "Explore; write fact entry + row; clear ?" [shape=box];
    "Ask ONE question naming its ?, w/ recommendation" [shape=box];
    "WAIT for answer" [shape=ellipse];
    "Write term/fact/scenario entry + row; clear ?" [shape=box];
    "Propose 2-7 children + 5-bullet composition" [shape=box];
    "Each bullet <= 2 lines and obligation holds?" [shape=diamond];
    "Insert intermediate node or reopen ancestor" [shape=box];
    "Conflicts accepted ADR?" [shape=diamond];
    "STOP branch: user picks preserve ADR or supersede" [shape=octagon, style=filled, fillcolor=red, fontcolor=white];
    "Show Proposal block; ask approval" [shape=box];
    "WAIT for approval" [shape=ellipse];
    "Approved?" [shape=diamond];
    "Node file -> approved; DESIGN.md row" [shape=box];
    "Frontier empty at requested depth?" [shape=diamond];
    "Done" [shape=doublecircle];

    "Pick one composite node at frontier" -> "Draft node file: Effect + Contract, unknowns as ?slug";
    "Draft node file: Effect + Contract, unknowns as ?slug" -> "More than 6 ? marks?";
    "More than 6 ? marks?" -> "Shrink Effect; push detail to children" [label="yes"];
    "Shrink Effect; push detail to children" -> "Draft node file: Effect + Contract, unknowns as ?slug";
    "More than 6 ? marks?" -> "Any ? left in draft?" [label="no"];
    "Any ? left in draft?" -> "Answerable from code/docs/tools?" [label="yes"];
    "Answerable from code/docs/tools?" -> "Explore; write fact entry + row; clear ?" [label="yes"];
    "Explore; write fact entry + row; clear ?" -> "Any ? left in draft?";
    "Answerable from code/docs/tools?" -> "Ask ONE question naming its ?, w/ recommendation" [label="no"];
    "Ask ONE question naming its ?, w/ recommendation" -> "WAIT for answer";
    "WAIT for answer" -> "Write term/fact/scenario entry + row; clear ?";
    "Write term/fact/scenario entry + row; clear ?" -> "Any ? left in draft?";
    "Any ? left in draft?" -> "Propose 2-7 children + 5-bullet composition" [label="no"];
    "Propose 2-7 children + 5-bullet composition" -> "Each bullet <= 2 lines and obligation holds?";
    "Each bullet <= 2 lines and obligation holds?" -> "Insert intermediate node or reopen ancestor" [label="no"];
    "Insert intermediate node or reopen ancestor" -> "Propose 2-7 children + 5-bullet composition";
    "Each bullet <= 2 lines and obligation holds?" -> "Conflicts accepted ADR?" [label="yes"];
    "Conflicts accepted ADR?" -> "STOP branch: user picks preserve ADR or supersede" [label="yes"];
    "Conflicts accepted ADR?" -> "Show Proposal block; ask approval" [label="no"];
    "Show Proposal block; ask approval" -> "WAIT for approval";
    "WAIT for approval" -> "Approved?";
    "Approved?" -> "Propose 2-7 children + 5-bullet composition" [label="no: revise"];
    "Approved?" -> "Node file -> approved; DESIGN.md row" [label="yes"];
    "Node file -> approved; DESIGN.md row" -> "Frontier empty at requested depth?";
    "Frontier empty at requested depth?" -> "Done" [label="yes"];
    "Frontier empty at requested depth?" -> "Pick one composite node at frontier" [label="no"];
}
```

### 1. Ground + draft

Read `DESIGN.md`, active node, its `Depends on`, linked ADRs, code, tests, evidence. Pick ONE composite node at frontier. Terminal → Effect + Realization, next node.

Write `nodes/D-NNN-<slug>.md`, `Design: draft`: Effect (1–2 sentences) + Contract (≤ 6 clauses, one line each). Term / decision without entry on disk → `?slug`. Draft = scope fence; interview fills only its holes. Root example, 4 `?`:

```markdown
Effect: one Agent Run ends in exactly one terminal outcome and survives process restart.
- Pre: caller supplies ?run-identity + objective
- Post: ?verified-result or typed failure recorded once
- Failure: ?failure-channels
- Invariant: no ?tool-effect duplicated across restart
```

Journal shape, budgets, tool ordering, cancellation → children's `?`. `?` > 6 → shrink Effect, redraft.

### 2. Interview — one question per `?`

Goal: zero `?` in draft.

- Answerable from code / docs / tools / experiment → explore, never ask. Finding → fact entry, clear `?`.
- Else ONE question, shape below, naming its `?`. Wait.
- Each question carries recommended answer + one-line why.
- `?` whose prerequisite `?` unresolved waits.
- Challenge, don't transcribe: conflicts existing entry → "Glossary defines X as A; you mean B — which?"; vague → propose canonical; relationship → scenario probing edge; claim vs code → "Code does X; you said Y — which?"
- Each answer → entry + index row + `?` → anchor link, same turn.
- New term / question with no `?` → not this node. `Open ambiguities` row, `Resolves at: child of D-NNN`.
- Draft clause wrong → fix (may add one `?`). Total `?` ever > 6 → §1, shrink Effect.
- Done iff zero `?` and every user-owned decision draft names answered.

Never: batch questions; ask what code answers; ask without a `?`; propose children mid-interview.

```markdown
**Node:** D-NNN — <operation> · **Resolves:** ?<slug> in <clause> · **Left:** <k> of <n> ?
**Q:** <one question>
**Recommend:** <answer> — <one-line why>
**Else:** <alternative> — <trade-off, one line>
```

### 3. Propose ONE refinement

Parent Effect + Contract → 2–7 children + composition argument (data flow / failures / cleanup / invariants / progress, ≤ 2 lines each). Representation, storage, framework → deferred to deepest node needing them.

Composition = proof obligation: children preserve parent `{Pre} S {Post}`. Checklist: Refinement Obligation in [design-ledger.md](references/design-ledger.md). Fails → revise children or reopen ancestor.

Then STOP. Show block. Nothing else that turn.

```markdown
## Proposal — D-NNN — <operation>
Contract: Pre <…> · Post <…> · Failure <…> · Invariant <…>
Refines into: D-a <op> · D-b <op> · …
Composition:
- Data flow: <≤2 lines>
- Failures: <≤2 lines>
- Cleanup: <≤2 lines | n/a: reason>
- Invariants: <≤2 lines>
- Progress: <≤2 lines | n/a: reason>
Decisions: <one line each>
Deferred: <Open ambiguities rows for children of D-NNN → D-x>
ADRs: <checked, none conflict | conflict → protocol>
**Approve D-NNN as above?** yes / change: …
```

### 4. Approve + persist

User owns semantic / risk / compat / hard-to-reverse choices. Approval = explicit yes to block. Then node file → `Design: approved`, fill Refines into / Composition / Decisions / Deferred, + `DESIGN.md` row, same turn.

Approved node = composed fn: descendants use contract, never re-derive. Reopen only on changed context entry, invariant, dependency, ADR, evidence.

### 5. ADR

Only if ALL: hard to reverse + surprising w/o context + real trade-off. Offer → user approves → binding.

Before Proposal: check linked ADRs. Conflict → STOP branch, Conflict Protocol in [adr-ledger.md](references/adr-ledger.md). Never bypass, weaken, delete, rewrite ADR.

### 6. Implement + verify to requested depth

Design-only → stop at approved frontier. Implementation → refine until every leaf terminal.

Evidence: cheapest method covering obligation (types → examples → property → integration → static/proof → model-check → benchmark → fault-injection). Record → `##` section in `evidence/D-NNN.md` + row; link from node `Realization`.

States independent, never inferred from each other: `approved` (design accepted) · `implemented` (code exists) · `verified` (every Contract clause has current passing evidence).

### 7. Propagate change

Context entry, ancestor, ADR, or dependency changes:

1. edit unit in place + row
2. follow `Used by` / `Depends on` to dependents
3. mark nodes + evidence stale — header AND row
4. revisit only invalidated frontier, one node per cycle
5. superseded ADR: keep, link replacement

## Discipline

- Terminology at node needing it.
- Semantic ops, not tech-named components. Representation at deepest node needing it; data representation postponed until no algorithm fits without it.
- Open decision explicit. Silence ≠ approval.
- Authz, privacy, durability, ordering, idempotency threaded through every affected node.
- Stateful → transitions + invariants first. Concurrent / distributed → ownership, atomicity, retries, dupes, reordering, cancellation, partial failure exposed.
- Prototype → fact entries. Prototype ≠ spec.
- Long proof = warning.

## Red Flags — STOP

| Thought | Rule |
|---|---|
| Several questions to save turns | One. Wait |
| Related question, no `?` for it | `Open ambiguities`, child's job. Question count = leak gauge |
| Root needs full vocabulary | Root ≤ 6 coarse clauses. Detail = children |
| Ask first, draft later | Draft first. No draft = no bound |
| Context clear, skip to proposal | Zero `?`, not feeling |
| Design next node too | One node per approval |
| Agreement to prose = approval | Yes to Proposal block only |
| Skip composition bullets | Five bullets ≤ 2 lines. Can't → step too big |
| Composition needs paragraph | Insert intermediate node |
| Pick storage / framework now | Deepest node needing it |
| Append node to `DESIGN.md` | One node = one file from first write |
| Tests pass → verified | Evidence per Contract clause |
| ADR doesn't apply | Conflict Protocol decides |
| Reopening ancestor = failure | Normal |
| Ask user a fact in code | Explore |

## Completion

Done at requested depth when: frontier approved; every exposed op has contract; each parent justified by ≤ 2-line-bullet composition; ADRs satisfied or superseded; another engineer / agent continues from files alone.
