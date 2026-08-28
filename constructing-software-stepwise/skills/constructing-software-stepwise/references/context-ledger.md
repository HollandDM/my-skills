# Context Ledger Format

Context = shared meaning. Answers **what we mean, what world design must fit**. Glossary + facts + scenarios. Nothing else — not spec, not scratch pad, not impl decisions.

## Layout — typed entries in the ledger, one generated view

Repo glossary/context convention if it exists. Else scoped to design:

```text
docs/design/<topic>/
  ledger.json     terms · facts · scenarios · scope · nongoals · ambiguities — written ONLY by `stepwise.py`
  CONTEXT.md      generated view: scope, three tables, open ambiguities, non-goals, then every entry in full
```

Every definition is a full sentence naming the thing itself, readable by someone who was not in the session (SKILL.md → Voice).

Entries change in place (meaning sharpens, facts go stale) → `change` appends a dated reason and lint names every approved dependent.

## Records — `ledger.json`

| Store | Key | Fields | Verb |
|---|---|---|---|
| `terms` | canonical term (`Run Key`) | `definition`, `confirmed`, `source`, `avoid[]`, `not[]`, `example`, `changed[]` | `entry <dir> term "Run Key" "<definition>" [--source S] [--avoid a,b] [--not T] [--example E]` |
| `facts` | `CTX-F<nn>` (allocated) | `name`, `definition`, `status confirmed\|stale`, `confirmed`, `source`, `changed[]` | `entry <dir> fact "<short name>" "<one fact>" [--source S]` |
| `scenarios` | `CTX-S<nn>` (allocated) | `name`, `given`, `when`, `then`, `excludes`, `settles`, `confirmed`, `changed[]` | `entry <dir> scenario "<name>" "" --given G --when W --then T [--excludes X] [--settles "<term> boundary"]` |
| `scope`, `title` | — | one line | `meta <dir> scope "…"` |
| `nongoals` | — | list | `meta <dir> nongoals "a" "b" …` |
| `ambiguities` | claim | `claim`, `conflict`, `resolves_at D-NNN` | `ambiguity <dir> "claim" "conflict" D-NNN` · `ambiguity <dir> "claim" --drop` |

`change <dir> <ref> [--definition D] [--rename "New heading"] [--status confirmed|stale] --reason R` — sharpen an entry, retitle it (`--rename` moves a term's name and every reference to it; a fact / scenario keeps its CTX id), or stale a fact. `Used by` is derived from node `depends` (which `answer` sets and prose mentions extend) and scenario `settles`.

The entry's key is its name everywhere: `answer D-020 run-identity "Run Key"`, `set D-020 pre "Run Key supplied by caller"`, `--not "Model Turn"`, `--settles "Run Key boundary"`. Views render the links.

## Entry Rules

- **One claim per entry.** Sentence joins two citable claims with "and" / ";" → two entries.
- **Name = identity.** `Run Key`, `CTX-F01`. One canonical spelling; the tool matches case-insensitively and refuses duplicates.
- **Tight.** Definition 1–2 sentences. What it IS, not what it does.
- **Opinionated.** Rejected synonyms in `--avoid`. Confusable neighbours in `--not` (must be terms; lint warns otherwise).
- **Project-specific only.** General programming concepts (timeout, retry, error type) are not terms — even when used heavily.
- **Source always.** `--source user | <code path> | <doc url> | experiment`. Confirmation date is filled by the tool.
- Term → project-wide glossary only when used across multiple designs / bounded contexts. Local stays local.

## View — `CONTEXT.md` (generated)

```markdown
# <Design area> — Shared Context

## Scope
<one or two sentences>

## Vocabulary
| Term | Is | Avoid | Used by |

## Facts and constraints
| ID | Fact | Status | Used by |

## Scenarios
| ID | Scenario | Settles |

## Open ambiguities
| Term / claim | Conflict | Resolves at |

## Explicit non-goals
- …

## Terms / ## Facts / ## Scenario entries
### <name>            full entry: meta line, definition, Avoid / Not / Example, Used by, Changed lines
```

Read it; never edit it. `check` fails on a hand-edited view.

## Not Here

- decompositions, impl architecture → nodes
- chosen DB / framework / algo / protocol — unless already an immutable environmental fact
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

Ambiguous boundary → scenario forcing it. Resolve iff active node's draft Contract carries a `?` for it; else `ambiguity <dir> "<claim>" "<conflict>" D-NNN` (the child that will own it) and `set D-NNN deferred …` at approval. Entries exist only for resolved `?` — one per question asked, no more.

## Change + Invalidation

Terms / facts = dependencies of design nodes. Entry changes →

1. `change <dir> <ref> --definition "…" --reason "…"`; typo / wording with identical meaning → add `--minor` (no invalidation)
2. the verb prints every dependent; lint fails for each approved dependent until `stale D-NNN "…"` or `reopen` + `approve`
3. review invalidated nodes before resuming; evidence on them is stale by construction

No obsolete definition as active context. Historical meaning mattered to a durable decision → keep it in that ADR.
