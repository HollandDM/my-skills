# ADR Ledger Format

ADR = durable history of consequential choice. Backstop for refinement tree: future designs satisfy it or explicitly supersede.

Not: explanation, meeting note, claim that impl is correct.

## Eligibility — ALL three

1. **Hard to reverse:** later change costs migration, compat, data, ops, security, or org effort.
2. **Surprising w/o context:** future engineer could reasonably remove / bypass; reason not visible in code.
3. **Real trade-off:** viable alternatives existed; choice accepted specific disadvantages.

Typical: persistent data formats, ownership boundaries, public protocols, consistency models, irreversible migrations, trust boundaries, durability semantics, cross-system IDs.

Skip: reversible impl details, no-alternative choices, temporary experiments, decisions fixed by external binding standard.

## Authority + Lifecycle

Agent recommends. User approves accept / supersede.

Repo status convention if present. Else:

- `proposed` — written, not yet binding
- `accepted` — binding on future refinements
- `superseded` — not binding; links replacement
- `deprecated` — kept for history while transition removes applicability

Track implementation separately. Accepted may be unimplemented.

Never delete / rewrite accepted ADR to erase changed decision. Typo / wording fix OK if meaning identical. Decision change → new ADR; old → `superseded`.

## File Format

Repo numbering / location if established. Else `docs/adr/NNNN-<slug>.md`. One ADR per file; never bundle several decisions in one ADR:

```markdown
---
id: ADR-0003
title: <Decision title>
status: proposed | accepted | superseded | deprecated
date: YYYY-MM-DD
deciders: <people or role>
design_nodes: [D-120, D-121]
supersedes: []
superseded_by: null
implementation: pending | partial | complete | unknown
---

# ADR-0003 — <Decision title>

## Context

<The forces, constraints, and problem that made a decision necessary. Link relevant CONTEXT.md entries and design nodes.>

## Decision

<The chosen rule stated precisely enough to constrain future design.>

## Invariants imposed

- <Property every affected refinement must preserve>

## Alternatives considered

### <Alternative>

- Advantages: <what it offered>
- Rejected because: <why it lost under the accepted constraints>

## Consequences

- Benefits: <what becomes easier or guaranteed>
- Costs: <what becomes harder, slower, more expensive, or less flexible>
- Migration/compatibility: <effects on existing data, APIs, operations, or users>

## Supporting evidence

- <Measurements, incidents, experiments, regulations, code constraints, or design analysis that informed the decision>

## Revisit conditions

- <Concrete condition that would justify reopening the decision>

## History

- YYYY-MM-DD — proposed
- YYYY-MM-DD — accepted by <authority>
```

`Supporting evidence` here = why decision rational. Impl satisfies it → `EVIDENCE.md`.

## Conflict Protocol

Before approving node: read its applicable accepted ADRs. Candidate conflicts →

1. name exact candidate behavior + ADR constraint in conflict
2. stop refinement of that branch
3. show user two legitimate paths:
   - preserve ADR, revise candidate; or
   - supersede ADR, accept migration / compat / risk / invalidation work
4. resolve factual uncertainty first (investigate), then ask
5. explicit user approval
6. superseding → create + accept replacement ADR, link both directions, mark dependent nodes + evidence stale
7. resume from new valid frontier

Unawareness ≠ permission. No adapter / exception preserving wording while defeating invariant.

## Applicability

Link ADR → affected node IDs + invariants. Global ADR constrains many branches; scoped ADR states boundary so unrelated work doesn't inherit.

Repo distinguishes planned vs in-force architecture → preserve. Never present proposed as implemented reality.
