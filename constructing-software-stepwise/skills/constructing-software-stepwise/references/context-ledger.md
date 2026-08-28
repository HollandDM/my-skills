# Context Ledger Format

Context = shared meaning. Answers **what we mean, what world design must fit**. Not decomposition, not impl.

## Layout — one item per file

Repo glossary/context convention if exists. Else scoped to design:

```text
docs/design/<topic>/
  CONTEXT.md                            index only
  context/terms/<slug>.md               one canonical term
  context/facts/CTX-F01-<slug>.md       one confirmed fact / constraint
  context/scenarios/CTX-S01-<slug>.md   one scenario
```

`CONTEXT.md` holds scope, non-goals, and tables linking items. Never item bodies. Item file + index row written in same edit.

Term → project-wide glossary only when used across multiple designs / bounded contexts. Local stays local.

Create index on first mutually-understood item. Update at that moment. Never batch at end.

## Index — `CONTEXT.md`

```markdown
# <Design area> — Shared Context

Status: active
Last confirmed: YYYY-MM-DD

## Scope

<The problem boundary, actors, environment, and observable concern.>

## Vocabulary

| Term | Definition (one line) | File |
| --- | --- | --- |
| Job Key | Caller-chosen idempotency key identifying one Job | [context/terms/job-key.md](context/terms/job-key.md) |

## Confirmed facts and constraints

| ID | Short name | Applies to | File |
| --- | --- | --- | --- |
| CTX-F01 | <short name> | D-000, D-020 | [context/facts/CTX-F01-<slug>.md](context/facts/CTX-F01-<slug>.md) |

## Scenarios

| ID | Scenario | Settles | File |
| --- | --- | --- | --- |
| CTX-S01 | <scenario name> | <term or boundary it fixes> | [context/scenarios/CTX-S01-<slug>.md](context/scenarios/CTX-S01-<slug>.md) |

## Explicit non-goals

- <Meaning or behavior outside this design's scope>
```

## Term — `context/terms/<slug>.md`

```markdown
# <Canonical term>

Definition: <one precise meaning>
Not: <rejected synonyms or nearby concepts, when useful>
Examples: <one or more boundary-revealing examples>
Applies to: <design node IDs, if known>
Source: <user confirmation date, or code path / document>
Last confirmed: YYYY-MM-DD
```

## Fact — `context/facts/CTX-F01-<slug>.md`

```markdown
# CTX-F01 — <short name>

Status: confirmed | stale
Source: <user decision, code path, test, document, experiment, or authoritative source>
Applies to: <scope or node IDs>
Last confirmed: YYYY-MM-DD

<fact or constraint, stated precisely>
```

## Scenario — `context/scenarios/CTX-S01-<slug>.md`

```markdown
# CTX-S01 — <scenario name>

Applies to: <node IDs>
Last confirmed: YYYY-MM-DD

- Given: <starting context>
- When: <event or action>
- Then: <observable meaning or boundary>
- Excludes: <nearby interpretation this scenario rules out>
```

## Belongs

- canonical domain/design terms
- distinctions between overloaded / confusable concepts
- environment facts shaping interpretation
- external constraints
- scenarios settling semantic boundaries
- non-goals blocking scope drift

## Not Here

- decompositions, impl architecture → `nodes/`
- chosen DB/framework/algo/protocol — unless already immutable environmental fact
- rationale for hard-to-reverse choices → ADR
- task lists, estimates, progress, conversation summaries
- unverified assumptions as facts
- every question asked

Approved composition → `nodes/`. Trade-off history → ADR. Verification → `evidence/`.

## Eligibility — mutual-understanding rule

Entry allowed only if ONE holds:

- user explicitly confirmed; or
- inspected fact w/ cited source, needs no user authority; or
- direct derivation from confirmed entry, derivation shown.

Agent inference alone → not eligible. No confident prose from guesses.

User vs code disagree → surface conflict. Record resolution. Never both as true.

Ambiguous term → scenario forcing boundary. Resolve distinction iff it changes active node's contract clause; else list under that node's `Deferred boundaries`. Ex: don't record "cancellation stops order" until agreed — completed items remain? compensation? full vs partial? — only clauses active node's contract needs.

## Change + Invalidation

Terms/facts = dependencies of design nodes. Item changes →

1. update item file (meaning changed → date + one-line reason; typo/wording fix: no note)
2. update its index row
3. find nodes under `Applies to` or otherwise dependent
4. mark nodes + their evidence stale until reviewed

No obsolete definition as active context. Historical meaning mattered to durable decision → keep in that ADR.
