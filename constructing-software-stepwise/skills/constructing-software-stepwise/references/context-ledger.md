# Context Ledger Format

Context = shared meaning. Answers **what we mean, what world design must fit**. Glossary + facts + scenarios. Nothing else — not spec, not scratch pad, not impl decisions.

## Layout — central index, one file per kind

Repo glossary/context convention if exists. Else scoped to design:

```text
docs/design/<topic>/
  CONTEXT.md            central index: scope, tables, open ambiguities, non-goals
  context/terms.md      every term, one `##` section each
  context/facts.md      every fact, one `##` section each
  context/scenarios.md  every scenario, one `##` section each
```

Context entries get edited in place (meaning sharpens, facts go stale) → grouped files. Nodes + ADRs append-only → one file each (see design / adr ledgers).

## Entry Rules

- **One claim per section.** `##` heading = canonical term or `ID name`. Sentence joins two citable claims with "and" / ";" → two sections.
- **Heading = anchor.** `## Agent Run` → `terms.md#agent-run`. `## CTX-F01 Required runtime` → `facts.md#ctx-f01-required-runtime`. No punctuation inside heading; anchor stays predictable.
- **Self-describing section.** First line after heading: `Confirmed: YYYY-MM-DD · Source: <…>` (+ `Status:` for facts). Reader understands section alone.
- **Link, never repeat.** Other entries + nodes by relative link. Copying = duplicate truth.
- **Tight.** Definition 1–2 sentences. What it IS, not what it does.
- **Opinionated.** One canonical term. Rejected synonyms under `Avoid:`. Confusable neighbours under `Not:` w/ link.
- **Size cap.** Section ≤ 10 lines. Over → two claims. Split.
- **Project-specific only.** General programming concepts (timeout, retry, error type) not terms — even when used heavily.
- **Order.** Terms alphabetical. Facts / scenarios by ID, append at end.
- Section + `CONTEXT.md` row written in same edit. Create index + kind file on first entry. Never batch at end.

Term → project-wide glossary only when used across multiple designs / bounded contexts. Local stays local.

## Index — `CONTEXT.md`

```markdown
# <Design area> — Shared Context

Kind: index · Status: active · Last confirmed: YYYY-MM-DD
Design: [./DESIGN.md](./DESIGN.md) · Evidence: [./EVIDENCE.md](./EVIDENCE.md)

## Scope

<One or two sentences: problem boundary, actors, observable concern.>

## Vocabulary

| Term | Is | Avoid | Entry |
| --- | --- | --- | --- |
| Job Key | Caller-chosen idempotency key naming one Job | run id, correlation id | [terms.md#job-key](context/terms.md#job-key) |

## Facts and constraints

| ID | Fact (one line) | Status | Used by | Entry |
| --- | --- | --- | --- | --- |
| CTX-F01 | <one line> | confirmed | D-000, D-020 | [facts.md#ctx-f01](context/facts.md#ctx-f01-<slug>) |

## Scenarios

| ID | Scenario | Settles | Entry |
| --- | --- | --- | --- |
| CTX-S01 | <name> | <term / boundary it fixes> | [scenarios.md#ctx-s01](context/scenarios.md#ctx-s01-<slug>) |

## Open ambiguities

| Term / claim | Conflict | Resolves at |
| --- | --- | --- |
| <term> | <reading A vs reading B> | D-040 |
| <term> | <surfaced during D-000 interview, no `?` for it in D-000 draft> | child of D-000 |

## Explicit non-goals

- <Meaning or behavior outside this design's scope>
```

Index rows mirror section headers. Never hold bodies.

## Terms — `context/terms.md`

```markdown
# <Design area> — Terms

Kind: terms · Index: [../CONTEXT.md](../CONTEXT.md)

## Job Key

Confirmed: YYYY-MM-DD · Source: <user | code path | document>

<One or two sentences. What it IS, not what it does.>

Avoid: <alias>, <alias>
Not: <neighbour> → [#<anchor>](#<anchor>)
Example: <one boundary-revealing example>
Used by: [D-020](../nodes/D-020-<slug>.md), [CTX-S01](scenarios.md#ctx-s01-<slug>)
```

## Facts — `context/facts.md`

```markdown
# <Design area> — Facts

Kind: facts · Index: [../CONTEXT.md](../CONTEXT.md)

## CTX-F01 <short name>

Status: confirmed | stale · Confirmed: YYYY-MM-DD · Source: <code path | document | experiment | user decision>

<ONE fact or constraint. One or two sentences.>

Used by: [D-000](../nodes/D-000-<slug>.md), [D-020](../nodes/D-020-<slug>.md)
```

## Scenarios — `context/scenarios.md`

```markdown
# <Design area> — Scenarios

Kind: scenarios · Index: [../CONTEXT.md](../CONTEXT.md)

## CTX-S01 <scenario name>

Confirmed: YYYY-MM-DD · Settles: [<term>](terms.md#<anchor>) boundary

Given <starting context>.
When <event or action>.
Then <observable meaning or boundary>.
Excludes: <nearby interpretation this rules out>

Used by: [D-040](../nodes/D-040-<slug>.md)
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

User term conflicts w/ existing entry → call out immediately: "Glossary defines 'cancellation' as X, you seem to mean Y — which?"

Vague / overloaded term → propose canonical: "'account' — Customer or User? Different things."

Ambiguous boundary → scenario forcing it. Resolve iff active node's draft Contract carries a `?` for it; else row in `Open ambiguities`, `Resolves at: child of D-NNN`, and node's `Deferred` at approval. Entries exist only for resolved `?` — one per question asked, no more.

## Change + Invalidation

Terms / facts = dependencies of design nodes. Entry changes →

1. edit section in place (meaning changed → `Changed: YYYY-MM-DD — <reason>` line; typo / wording: no note)
2. update its index row
3. follow `Used by` links → mark those nodes + their evidence stale
4. review before resuming

No obsolete definition as active context. Historical meaning mattered to durable decision → keep in that ADR.
