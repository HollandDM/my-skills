# Context Ledger Format

`CONTEXT.md` = shared meaning. Answers **what we mean, what world design must fit**. Not decomposition, not impl.

## Location + Scope

Repo glossary/context convention if exists. Else scoped to design:

```text
docs/design/order-execution/CONTEXT.md
```

Term → project-wide glossary only when used across multiple designs / bounded contexts. Local stays local.

Create on first mutually-understood item. Update at that moment. Never batch at end.

## Shape — omit empty sections

```markdown
# <Design area> — Shared Context

Status: active
Last confirmed: YYYY-MM-DD

## Scope

<The problem boundary, actors, environment, and observable concern.>

## Vocabulary

### <Canonical term>

Definition: <one precise meaning>
Not: <rejected synonyms or nearby concepts, when useful>
Examples: <one or more boundary-revealing examples>
Applies to: <design node IDs, if known>

## Confirmed facts and constraints

- **CTX-F01 — <short name>:** <fact or constraint>
  - Source: <user decision, code path, test, document, experiment, or authoritative source>
  - Applies to: <scope or node IDs>

## Scenarios

### CTX-S01 — <scenario name>

- Given: <starting context>
- When: <event or action>
- Then: <observable meaning or boundary>
- Excludes: <nearby interpretation this scenario rules out>

## Explicit non-goals

- <Meaning or behavior outside this design's scope>
```

## Belongs

- canonical domain/design terms
- distinctions between overloaded / confusable concepts
- environment facts shaping interpretation
- external constraints
- scenarios settling semantic boundaries
- non-goals blocking scope drift

## Not Here

- decompositions, impl architecture → `DESIGN.md`
- chosen DB/framework/algo/protocol — unless already immutable environmental fact
- rationale for hard-to-reverse choices → ADR
- task lists, estimates, progress, conversation summaries
- unverified assumptions as facts
- every question asked

Approved composition → `DESIGN.md`. Trade-off history → ADR. Verification → `EVIDENCE.md`.

## Eligibility — mutual-understanding rule

Entry allowed only if ONE holds:

- user explicitly confirmed; or
- inspected fact w/ cited source, needs no user authority; or
- direct derivation from confirmed entry, derivation shown.

Agent inference alone → not eligible. No confident prose from guesses.

User vs code disagree → surface conflict. Record resolution. Never both as true.

Ambiguous term → scenario forcing boundary. Resolve distinction iff it changes active node's contract clause; else list under that node's `Deferred boundaries`. Ex: don't record "cancellation stops order" until agreed — completed items remain? compensation? full vs partial? — only clauses active node's contract needs.

## Change + Invalidation

Terms/facts = dependencies of design nodes. Entry changes →

1. update canonical entry
2. meaning changed → add date + one-line reason (typo/wording fix: no note)
3. find nodes under `Applies to` or otherwise dependent
4. mark nodes + their evidence stale until reviewed

No obsolete definition as active context. Historical meaning mattered to durable decision → keep in that ADR.
