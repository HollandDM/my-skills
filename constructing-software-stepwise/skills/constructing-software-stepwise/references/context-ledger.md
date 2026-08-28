# Context Ledger Format

Context = shared meaning. Answers **what we mean, what world design must fit**. Glossary + facts + scenarios. Nothing else — not spec, not scratch pad, not impl decisions.

## Layout — one item per file

Repo glossary/context convention if exists. Else scoped to design:

```text
docs/design/<topic>/
  CONTEXT.md                            index only
  context/terms/<slug>.md               one canonical term
  context/facts/CTX-F01-<slug>.md       one confirmed fact / constraint
  context/scenarios/CTX-S01-<slug>.md   one scenario
```

## Atomic File Rules

- **One claim per file.** Two statements each citable alone → two files. Test: sentence joins independent claims with "and" / ";" → split.
- **Self-describing header.** First lines: `Kind`, ID, `Index` link, `Status`, `Confirmed` date. Reader understands file w/o opening another.
- **Link, never repeat.** Reference other items by relative link. Copying another file's content = duplicate truth.
- **Tight.** Definition 1–2 sentences. What it IS, not what it does.
- **Opinionated.** One canonical term. Rejected synonyms under `Avoid:`. Confusable neighbours under `Not:` w/ link.
- **Size cap.** Term / fact / scenario file ≤ 30 lines. Over → you packed two items. Split.
- **Project-specific only.** General programming concepts (timeout, retry, error type) not terms — even when used heavily.
- Item file + `CONTEXT.md` row written in same edit. Create index on first item. Never batch at end.

Term → project-wide glossary only when used across multiple designs / bounded contexts. Local stays local.

## Index — `CONTEXT.md`

```markdown
# <Design area> — Shared Context

Kind: index · Status: active · Last confirmed: YYYY-MM-DD
Design: [./DESIGN.md](./DESIGN.md) · Evidence: [./EVIDENCE.md](./EVIDENCE.md)

## Scope

<One or two sentences: problem boundary, actors, observable concern.>

## Vocabulary

| Term | Is | Avoid | File |
| --- | --- | --- | --- |
| Job Key | Caller-chosen idempotency key naming one Job | run id, correlation id | [context/terms/job-key.md](context/terms/job-key.md) |

## Facts and constraints

| ID | Fact (one line) | Used by | File |
| --- | --- | --- | --- |
| CTX-F01 | <one line> | D-000, D-020 | [context/facts/CTX-F01-<slug>.md](context/facts/CTX-F01-<slug>.md) |

## Scenarios

| ID | Scenario | Settles | File |
| --- | --- | --- | --- |
| CTX-S01 | <name> | <term / boundary it fixes> | [context/scenarios/CTX-S01-<slug>.md](context/scenarios/CTX-S01-<slug>.md) |

## Open ambiguities

| Term / claim | Conflict | Resolves at |
| --- | --- | --- |
| <term> | <reading A vs reading B> | D-040 |

## Explicit non-goals

- <Meaning or behavior outside this design's scope>
```

Index rows mirror item headers. Never hold item bodies.

## Term — `context/terms/<slug>.md`

```markdown
# <Canonical term>

Kind: term · Index: [../../CONTEXT.md](../../CONTEXT.md)
Confirmed: YYYY-MM-DD · Source: <user | code path | document>

<One or two sentences. What it IS, not what it does.>

Avoid: <alias>, <alias>
Not: <confusable neighbour> → [<slug>.md](<slug>.md)
Example: <one boundary-revealing example>
Used by: [D-020](../../nodes/D-020-<slug>.md), [CTX-S01](../scenarios/CTX-S01-<slug>.md)
```

## Fact — `context/facts/CTX-F01-<slug>.md`

```markdown
# CTX-F01 — <short name>

Kind: fact · Status: confirmed | stale · Index: [../../CONTEXT.md](../../CONTEXT.md)
Source: <code path | document | experiment | user decision>
Confirmed: YYYY-MM-DD

<ONE fact or constraint. One or two sentences.>

Used by: [D-000](../../nodes/D-000-<slug>.md), [D-020](../../nodes/D-020-<slug>.md)
```

## Scenario — `context/scenarios/CTX-S01-<slug>.md`

```markdown
# CTX-S01 — <scenario name>

Kind: scenario · Index: [../../CONTEXT.md](../../CONTEXT.md)
Settles: [<term>](../terms/<slug>.md) boundary
Confirmed: YYYY-MM-DD

Given <starting context>.
When <event or action>.
Then <observable meaning or boundary>.
Excludes: <nearby interpretation this rules out>

Used by: [D-040](../../nodes/D-040-<slug>.md)
```

## Not Here

- decompositions, impl architecture → `nodes/`
- chosen DB / framework / algo / protocol — unless already immutable environmental fact
- rationale for hard-to-reverse choices → ADR
- task lists, estimates, progress, conversation summaries
- unverified assumptions as facts
- every question asked

## Eligibility — mutual-understanding rule

Entry allowed only if ONE holds:

- user explicitly confirmed; or
- inspected fact w/ cited source, needs no user authority; or
- direct derivation from confirmed entry, derivation shown.

Agent inference alone → not eligible. No confident prose from guesses.

User vs code disagree → surface conflict: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?" Record resolution. Never both as true.

User term conflicts w/ existing term file → call out immediately: "Glossary defines 'cancellation' as X, you seem to mean Y — which?"

Vague / overloaded term → propose canonical: "'account' — Customer or User? Different things."

Ambiguous boundary → scenario forcing it. Resolve iff it changes active node's contract clause; else row in `Open ambiguities` + node's `Deferred boundaries`.

## Change + Invalidation

Terms / facts = dependencies of design nodes. Item changes →

1. update item file (meaning changed → date + one-line reason; typo / wording: no note)
2. update its index row
3. follow `Used by` links → mark those nodes + their evidence stale
4. review before resuming

No obsolete definition as active context. Historical meaning mattered to durable decision → keep in that ADR.
