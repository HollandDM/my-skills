# Design Ledger Format

Design = approved refinement tree, serialized as pseudocode, with each node's evidence beside its contract. Answers **how accepted abstract statements compose to satisfy parent contracts, and why each is believed to hold**. Dijkstra: program text refined in place — abstract statement → body of smaller statements — until each maps onto one real thing.

Not: interview transcript, impl diary, backlog, component inventory.

## Layout — one typed ledger, generated views

Existing design-doc convention if present. Else:

```text
docs/design/<topic>/
  ledger.json          canonical — nodes, terms, facts, scenarios, scope, ambiguities. Written ONLY by `stepwise.py`
  DESIGN.md            generated view: root, frontier, ADR list, node table, Program (whole pseudocode, bodies substituted)
  CONTEXT.md           generated view: scope, tables, ambiguities, non-goals, every entry
  nodes/D-NNN.md       generated view: one node, readable alone
  .stepwise.log        every verb call (audit)
docs/adr/NNNN-<slug>.md   hand-written paragraph; header + status owned by `adr new` / `adr accept`
```

Views exist for humans and PR review. The agent reads them (or `show D-NNN`) and never edits them; `check` fails on a hand-edited view.

## Node record — `ledger.json › nodes › D-NNN`

| Field | Set by | Meaning |
|---|---|---|
| `statement` | `new` (from parent body line, or root statement) | `x <- f(a, b)` · `-> f(a)` · `f(a)`. ID = statement; never renumber |
| `gloss`, `effect` | `set D-NNN gloss\|effect "…"` | one line; 1–2 sentences |
| `contract` | `set D-NNN pre\|post\|failure\|invariant\|<any lowercase label> "…"` | ≤ 6 clauses, one line each, labels free (`budget`, `determinism`, `boundary`, `cancellation`, `progress`); unknowns `?slug` |
| `depends` | `answer`; `set D-NNN depends "Name" …` (append); also derived from any term / `CTX-…` / `ADR-…` named in gloss, effect, contract | dependencies for `Used by` and staleness |
| `body` | `body D-NNN` (stdin / `--file`) | pseudocode lines → `{indent, code, child \| reuse \| target \| note}`; refused on an approved node |
| `composition`, `decisions`, `deferred`, `adaptation` | `set D-NNN <field> "b1" "b2" …` | bullet lists, replaced whole |
| `target` | `terminal D-NNN "<target>: <identifier>"` | the real thing; Exists test enforced |
| `design` | `approve` · `reopen` · `stale` · `supersede` · `adr new` (→ draft, `adr_pending`) · `adr accept` | `draft` · `approved` · `stale` · `superseded` (+ `superseded_by`) |
| `approved`, `approved_at`, `approved_hash` | `approve` | who / when; body hash guards against silent edits |
| `realization`, `verification` | `set D-NNN realization\|verification <v>` · `evidence` | `not-started \| partial \| implemented` · `unverified \| partial \| verified \| stale` |
| `evidence` | `evidence D-NNN --kind K --ref R --result pass\|fail [--note]` | one record per (obligation, method) |
| `history` | every state verb | `{date, event, reason}` — reopen / stale / supersede / re-approve reasons live here, never in status text |

Parents are derived: every node whose body tags `D-NNN` as `child` or `reuse`. Frontier is derived: child ids tagged in non-draft bodies with no node yet. Nothing structural is typed twice.

Status shown in views: `draft` · `draft (k ?)` · `draft (ADR pending ADR-NNNN)` · `approved` · `stale` · `superseded by D-MMM`. No other words exist.

## Realization Target

"Real" = whatever the statement maps onto **outside the design**: language construct, framework API, platform primitive, managed service, infra resource, config, repo function that exists on disk. Written `<target>: <identifier>` — `scala: AgentRuns.claim`, `dbos: DBOS.startWorkflow`, `postgres: SELECT … ORDER BY seq`, `k8s: CronJob`, `repo: src/billing/Ledger.scala#append`.

Exists test: target resolvable today — docs page, API signature, file path, SQL. Own code not yet written (`service: AgentLedger.read`, `module: Foo`, `application service: …`) is not a target; it is the design. `terminal` refuses it. Such a statement is composite or a collapsed leaf (see Node Kinds), never terminal.

Adaptation = one line per Contract clause, `<clause> → <concrete construct>`: query text, API call with arguments, type / constraint, config key. Contract verb restated ("query one snapshot in order") ≠ adaptation. No construct nameable → not terminal.

An ADR's `Constrains:` list makes it a dependency of each node it names: the link appears under `Depends on` with no verb.

`reopen` snapshots the body, composition, decisions and deferred it invalidates into the node view's `## Superseded refinement` section, so the replaced refinement stays readable while the node is redrafted.

Pseudocode above terminal. Target only in a terminal's `target` or a collapsed leaf's `-- ⇒` body lines. A collapsed leaf's node view derives its own Realization line (`Collapsed leaf. Targets: …`) from those tags — no verb, no prose.

## Pseudocode Notation — what `body` accepts

- first line may be the signature `f(a, b):`; dropped
- one statement per line; sequence = consecutive lines; indent = nesting
- `x <- expr` assign · `-> value` return · `name(args)` abstract call; multi-line calls (open parenthesis) joined
- `if cond: … else: …` · `loop until cond: …` · `for each x in S: …`
- `{ assertion }` = condition holding at that point. One wherever the composition argument leans on it
- `-- D-NNN: <one line>` child · `-- ↗ D-NNN -- <one line>` call to approved node · `-- ⇒ <target>: <identifier> -- <one line>` collapsed-leaf line · other text after `--` = note. The one line says what that pseudocode line does; an existing child's or reused node's own gloss stands in for it.
- untagged call → `body` auto-tags when exactly one node's statement is `name(`; else lint error until tagged
- `?slug` unknown, draft prose only (gloss / effect / contract), never in a body
- abstract data only: `set`, `seq`, `map`, `record{…}`. Concrete types, library / framework / service names → terminal `target`

Program tags are rendered from status: `(frontier)` · `(draft, k ?)` · `(draft (ADR pending …))` · `(stale)` · `(superseded by D-MMM)` · `⇒ <target>` approved terminal, unverified · `✓ <target>` verified · `↗ D-NNN` reused.

## Program Rule

`Program` in `DESIGN.md` = root statement with every approved node's body substituted in place, indented one level per depth, tags per notation. Whole design readable top-down in one block.

- approved body → substituted under its statement line; draft / frontier / stale / superseded → status tag, no body
- approved terminal → `⇒ <target>`; verified → `✓`; shown at every call site (terminals have no body to hoist)
- composite with one parent whose body calls it → inline. Two or more parents, or handed by reference → once under `### Procedures` with `(used by …)`, call sites `↗ D-NNN`
- drift impossible by construction; `check` fails when a view was hand-edited

## Node Kinds

| Kind | Test | Verbs |
|---|---|---|
| Terminal — real | Statement = ONE real thing that passes Exists test, or Contract already met by ONE such thing cited in a fact | `terminal`, `set adaptation`, `approve`; later `evidence` |
| Leaf — collapsed | User rules node not worth child-by-child review; body still fully written to real lines | `body` with every statement `-- ⇒ <target>: <identifier> -- <one line>` (≤ 12 lines, no `-- D-NNN`), `set walkthrough`, `set composition`, `approve` |
| Terminal — reuse | Statement = call to existing `approved` node, Statement + Contract used verbatim | no new node; parent body line `-- ↗ D-NNN` |
| Composite | else | `body` (2–7 child statements), `set composition` (+ `decisions`, `deferred`), `approve` |

Composite fan-out 2–7. 1 → rename. >7 → intermediate node. Terminal = only place refinement stops: adapt to real, or call approved node.

Collapse rule: "not worth digging" is the user's call, and it collapses review, not refinement. Collapsed leaf = one approval, no child nodes, but the body is complete pseudocode down to real constructs — every statement line names its target, control + `{ assertion }` lines as usual, ≤ 12 lines. Needs > 12 lines or a line with no nameable target → it is worth digging: propose children.

Terminal test precedes every body. Contract met by one real thing cited in a fact → terminal; `adaptation` maps each clause onto that thing, evidence verifies it. Platform guarantees (idempotent start by key, resume from checkpoint, CAS, lock, retry, version pin) never get refined into pseudocode — snapshot / decide / CAS / bind / schedule chains above one `dbos: startWorkflow` re-derive the platform.

Reuse rules: target must be `approved` (draft / stale → lint error); call matches its statement signature; parent's composition argument uses its Contract only, never its body; contract doesn't fit → `reopen` that node (all parents go stale via lint) or a new node — never copy a body with a tweak.

## Node view — `nodes/D-020.md` (generated)

```markdown
# D-020 — next_step

Kind: node · Index: [../DESIGN.md](../DESIGN.md)
Design: approved · Realization: not-started · Verification: unverified
Parents: [D-000](D-000.md)
Depends on: [CTX-F03](../CONTEXT.md#ctx-f03-…), [Run Key](../CONTEXT.md#run-key), [ADR-0003](../../../adr/0003-….md)
Approved: 2026-08-28 by user

## Statement
`step <- next_step(run)` — one model turn decided from run history
## Effect
…
## Contract
- Pre: … · - Post: … · - Failure: … · - Invariant: …
## Refinement
```pseudo
next_step(run):
  msgs <- journal_to_prompt(run)                          -- D-021: project history into a prompt
  { msgs provider-neutral ∧ within run.budget.tokens }
  reply <- call_model(msgs)                               -- D-022: one provider call
  -> decide(reply)                                        -- D-023: classify the reply
```
## Composition argument / Decisions / Deferred
## Realization      (Target: … · Adaptation: …)
## Evidence         (### EV-n kind — result)
## History          (- date — event: reason)
```

Walkthrough: `set D-NNN walkthrough "…"` — at most 3 plain lines saying what the function does, rendered above the pseudocode. Every tagged pseudocode line carries one line of explanation, so a reader knows what each line does before its node exists; an existing child's or reused node's own gloss takes over once it does. `approve` refuses a body missing either.

Composition argument: five bullets — data flow, failures, cleanup, invariants, progress (≤ 2 lines each). Not applicable → `n/a: <reason>`. Never omit. `approve` refuses a composite without composition.

Draft state: gloss / effect / clause may carry `?slug`; `?` count = interview length; > 6 → statement says too much, shrink. `approve` refuses any `?`.

## Approval Rule

Agent derives + recommends. User approves anything changing product semantics, accepted risk, compatibility, cost commitment, hard-to-reverse architecture.

Approval covers Statement + Contract + body, not prose. Preserve user's exact negatives, ordering constraints, numeric limits, failure semantics verbatim. Sequence after the user's yes: `body` (or `terminal`) → `set composition …` → `approve` — all same turn, then next node.

Re-approval: `reopen D-NNN "reason"` → edit via verbs → `approve`. Status stays one word; the reason lives in `history`.

## Refinement Obligation — before `approve`

- **Coverage:** body establishes every parent guarantee
- **Safety:** body permits nothing parent forbids
- **Assumptions:** no precondition silently strengthened
- **Composition:** ordering, data flow, errors, retries, cleanup, recovery fit; `{ }` assertions hold where written
- **Invariants:** inherited + local initialized and preserved
- **Progress:** termination / liveness justified when required
- **Budgets:** non-functional reqs feasible
- **ADR compat:** satisfies every applicable accepted ADR

Argument may be mathematical, operational, type-based, or evidence-backed. Examples / tests ≠ proof.

## Evidence Rules

Evidence = why an obligation is currently believed to hold. Lives in the node it verifies (`evidence D-NNN …`); never elsewhere.

- One record = one (obligation, method). Same test covering two clauses → two records, same `--ref`.
- Never record a command not run or a proof not established.
- Method ladder, cheapest covering risk: types → examples → property-test → integration-test → static-analysis / proof → model-check → benchmark → fault-injection → observation (explicit env + sampling limits). Never promote kind: examples ≠ proof, local proof ≠ env assumptions, benchmark ≠ prod guarantee.
- `--result pass` sets `verification: verified` (and `realization: implemented` if not-started). Set `verification partial` explicitly when a clause still lacks a record.
- `stale`: any state verb that leaves `approved` also drops `verified` → `stale`. Stale ≠ false; keep records, add fresh, `set verification verified` only when coverage is current.

## Reuse as Composition

Approved node = fn w/ contract. Parents rely on Statement + Contract; never reopen internals. Any later node may call it as a reuse terminal (`-- ↗ D-NNN`); parents derive, the body moves to `### Procedures` on the second caller.

Reopen only when one changes: context entry it depends on; parent contract; invariant / budget; applicable ADR; child contract; evidence needed for verification.

## State Separation

Three independent axes:

- `design` — statement + body accepted?
- `realization` — real thing exists?
- `verification` — current evidence covers obligations?

Approved ≠ implemented. Implemented can violate design. Verified goes stale on dependency change (`change` → lint names every approved dependent).
