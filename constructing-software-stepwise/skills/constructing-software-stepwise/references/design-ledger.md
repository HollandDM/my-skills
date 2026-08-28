# Design Ledger Format

Design = approved refinement tree, serialized as pseudocode, with each node's evidence beside its contract. Answers **how accepted abstract statements compose to satisfy parent contracts, and why each is believed to hold**. Dijkstra: program text refined in place — abstract statement → body of smaller statements — until each maps onto one real thing.

Not: interview transcript, impl diary, backlog, component inventory.

## Layout — one node per file, one program in index

Existing design-doc convention if present. Else:

```text
docs/design/<topic>/
  DESIGN.md                index (root, frontier, ADRs, node table) + Program (whole pseudocode)
  nodes/D-000-<slug>.md    one node = statement + contract + refinement + evidence
  nodes/D-010-<slug>.md
```

## Realization Target

"Real" = whatever the statement maps onto **outside the design**: language construct, framework API, platform primitive, managed service, infra resource, config, repo function that exists on disk. Written `<target>: <identifier>` — `scala: AgentRuns.claim`, `dbos: DBOS.startWorkflow`, `postgres: SELECT … ORDER BY seq`, `k8s: CronJob`, `repo: src/billing/Ledger.scala#append`.

Exists test: target resolvable today — docs page, API signature, file path, SQL. Own code not yet written (`service: AgentLedger.read`, `module: Foo`) is not a target; it is the design. Such a statement is composite or a collapsed leaf (see Node Kinds), never terminal.

Adaptation = one line per Contract clause, `<clause> → <concrete construct>`: query text, API call with arguments, type / constraint, config key. Contract verb restated ("query one snapshot in order") ≠ adaptation. No construct nameable → not terminal.

Pseudocode above terminal. Target only inside terminal `Realization` or collapsed-leaf body lines.

## Pseudocode Notation

- one statement per line; sequence = consecutive lines; indent = nesting
- `x ← expr` assign · `→ value` return · `name(args)` abstract call
- `if cond: … else: …` · `loop until cond: …` · `for each x in S: …`
- `{ assertion }` = condition holding at that point. One wherever composition argument leans on it
- `-- D-NNN` tags every child statement · `(frontier)` unrefined · `(draft, k ?)` · `(draft, ADR pending)` · `(stale)` · `(superseded by D-MMM)` · `⇒ <target>: <identifier>` approved terminal, unverified · `✓ <target>: <identifier>` verified · `↗ D-NNN` call to approved node defined elsewhere
- collapsed-leaf body: every statement line ends `-- ⇒ <target>: <identifier>` (or `✓`); no `-- D-NNN` inside
- `?slug` unknown, draft only
- abstract data only: `set`, `seq`, `map`, `record{…}`. Concrete types, library / framework / service names → terminal `Realization`
- realized line in `Program` may be replaced by the real line; pseudo and real mix there

## Atomic File Rules

- **One node = one abstract statement = one file.** Contract, body, why body composes, evidence body holds. Nothing about grandchildren.
- **Self-describing header.** `Kind`, ID, `Index` link, three status axes, `Parents`, `Depends on` — all links.
- **Link, never repeat.** Contract references context entries by link. Never restate definitions.
- **One line per clause.** Clause needs a paragraph → hides a term or fact → extract to `context/`, link.
- **Refinement body ≤ 12 lines.** 2–7 child statements + control + assertions. Longer → intermediate node.
- **Evidence record ≤ 4 lines.** One record = one (obligation, method).
- **Size cap.** Node file ≤ 120 lines.
- Node file + `DESIGN.md` row + `Program` substitution written in same edit.

Node born at pick time as `Design: draft`: Statement + Effect + Contract (≤ 6 clauses), unknowns `?slug`. Interview replaces each `?` with link. Approval flips `draft` → `approved`, fills Refinement / Composition / Decisions / Deferred, substitutes body into `Program`. Realization + Evidence filled at implementation.

Only `approved` authoritative. `draft` = scope fence for interview. Candidate body lives in Proposal block until approved.

## Index — `DESIGN.md`

```markdown
# <Design name>

Kind: index · Context: [./CONTEXT.md](./CONTEXT.md)
Root: D-000 · Active frontier: D-022, D-030, D-040

## Applicable ADRs

- [ADR-0003 <title>](../../adr/0003-<slug>.md) — accepted — constrains D-010, D-030

## Nodes

| ID | Statement | Parents | Design | Realization | Verification | File |
| --- | --- | --- | --- | --- | --- | --- |
| D-000 | run_agent(id, objective) → outcome | — | approved | not-started | unverified | [nodes/D-000-<slug>.md](nodes/D-000-<slug>.md) |
| D-010 | claim_run(id) → run | D-000 | approved | implemented | verified | [nodes/D-010-<slug>.md](nodes/D-010-<slug>.md) |
| D-023 | decide(reply) → step | D-020 | draft (2 ?) | not-started | unverified | [nodes/D-023-<slug>.md](nodes/D-023-<slug>.md) |
| D-050 | record(run, event) → run | D-010, D-030 | approved | implemented | verified | [nodes/D-050-<slug>.md](nodes/D-050-<slug>.md) |

## Program

```pseudo
run_agent(id, objective):                              -- D-000
  run ← claim_run(id)                                  -- D-010
    { no run with id exists ∨ same objective }
    run ← record(empty_run(id), Started)               -- ↗ D-050
  loop until terminal(run):
    step ← next_step(run)                              -- D-020
      msgs ← journal_to_prompt(run)                    -- D-021 (frontier)
      reply ← call_model(msgs)                         -- D-022 (frontier)
      → decide(reply)                                  -- D-023 (draft, 2 ?)
    run ← apply(run, step)                             -- D-030
      run ← record(run, step.event)                    -- ↗ D-050
  → outcome(run)                                       -- D-040 (frontier)
```

### Procedures

```pseudo
record(run, event):                                    -- D-050 (used by D-010, D-030)
  journal ← run.journal ++ [event]                     -- D-051 ✓ dbos: Transaction + postgres: INSERT journal
  { journal append-only ∧ event.seq = |journal| }
  → run with journal                                   -- D-052 ✓ scala: Run.copy
```
```

Row mirrors node header. Status change in file → same edit updates row.

Stable IDs (`D-NNN`) from first node. ID = statement; never renumber.

`Active frontier` updated in same edit that adds, approves, or stales a node.

## Program Rule

`Program` = root Statement with every approved node's Refinement substituted in place, indented one level per depth, tags per notation. Whole design readable top-down in one block.

- Approval → substitute body under its statement line, same edit.
- Realization → tag `✓ <target>: <identifier>`, or replace line with real line.
- Stale node → tag `(stale)`; body stays.
- One parent → body inline under its statement. Two or more parents → body once under `### Procedures` with `(used by …)`, every call site `-- ↗ D-NNN`. Second parent approved → move body out, same edit. Big system stays one readable block.
- Test: every `-- D-NNN` in Program ↔ row in Nodes; every approved body appears verbatim (modulo indent) in Program. Mismatch → fix Program, never node.

## Node Kinds

| Kind | Test | Fields |
|---|---|---|
| Terminal — real | Statement = ONE real thing that passes Exists test, or Contract already met by ONE such thing cited in a fact; named `<target>: <identifier>` in `Realization` | Header + Statement + Effect + Contract + Realization + Evidence |
| Leaf — collapsed | User rules node not worth child-by-child review; body still fully written to real lines | Header + Statement + Effect + Contract + Refinement (≤ 12 lines, every statement `-- ⇒ <target>: <identifier>`) + Composition argument + Realization (targets listed) + Evidence |
| Terminal — reuse | Statement = call to existing node with `Design: approved`, Statement + Contract used verbatim | no new file; parent body line `-- ↗ D-NNN`; add parent to that node's `Parents` |
| Composite | else | all fields below, body in pseudocode |

Composite fan-out 2–7. 1 → rename. >7 → intermediate node. Terminal = only place refinement stops: adapt to real, or call approved node.

Collapse rule: "not worth digging" is the user's call, and it collapses review, not refinement. Collapsed leaf = one approval, no child nodes, but Refinement is complete pseudocode down to real constructs — every statement line names its target, control + `{ assertion }` lines as usual, ≤ 12 lines. Needs > 12 lines or a line with no nameable target → it is worth digging: propose children. `Program` substitutes the body like any composite.

Terminal test precedes every body. Contract met by one real thing cited in a fact → terminal; `Adaptation` maps each clause onto that thing, evidence verifies it. Platform guarantees (idempotent start by key, resume from checkpoint, CAS, lock, retry, version pin) never get refined into pseudocode — snapshot / decide / CAS / bind / schedule chains above one `dbos: startWorkflow` re-derive the platform.

Reuse rules: target must be `approved` (draft / stale → not reusable); call matches its Statement signature; parent's composition argument uses its Contract only, never its body; contract doesn't fit → reopen that node via Propagate (all parents stale) or create a new node — never copy body with a tweak.

## Node — `nodes/D-020-<slug>.md`

```markdown
# D-020 — next_step

Kind: node · Index: [../DESIGN.md](../DESIGN.md)
Design: draft (<k> ?) | approved | stale | superseded · Realization: not-started | partial | implemented · Verification: unverified | partial | verified
Parents: [D-000](D-000-<slug>.md)
Depends on: [CTX-F03](../context/facts.md#ctx-f03-<slug>), [D-010](D-010-<slug>.md), [ADR-0003](../../../adr/0003-<slug>.md)
Approved: YYYY-MM-DD by <user>

## Statement

`step ← next_step(run)` — one model turn decided from run history

## Effect

<One or two sentences: net observable behavior.>

## Contract

- Pre: <one line>
- Post: <one line>
- Failure: <one line: errors, cancellation, retries, partial progress, recovery>
- Invariant: <one line>
- Budget: <one line>
- Vocabulary: [<term>](../context/terms.md#<anchor>), [CTX-S01](../context/scenarios.md#ctx-s01-<slug>)

## Refinement

```pseudo
next_step(run):
  msgs ← journal_to_prompt(run)          -- D-021
  { msgs provider-neutral ∧ within run.budget.tokens }
  reply ← call_model(msgs)               -- D-022
  → decide(reply)                        -- D-023
```

## Composition argument

- Data flow: <how each statement's output feeds the next>
- Failures: <which statement fails how; how parent Failure clause holds>
- Cleanup: <released / compensated; or `n/a: <reason>`>
- Invariants: <which statement establishes / preserves each; cite `{ }` lines>
- Progress: <termination / liveness; or `n/a: <reason>`>

## Decisions

- <one line: decision — reason>

## Deferred

- <question> → resolves at [D-023](D-023-<slug>.md)

## Realization

- Target: <target>: <identifier> — terminal: one; collapsed leaf: one per body line
- Adaptation: <Contract clause> → <concrete construct: query text / API call + args / type / constraint / config key>, one per clause — terminal only. Contract verb restated ≠ adaptation
- Code: <paths>

## Evidence

### EV-D020-01 <short name>
Status: passed | failed | partial | stale · Recorded: YYYY-MM-DD · Method: <see ladder>
Obligation: <Contract clause label> · Artifact: <test / command / model / report> · Env: <versions, config, data>
Observed: <result> · Expected: <required> · Limitations: <what this does NOT establish>
```

Composition argument: five fixed bullets. Not applicable → `n/a: <reason>`. Never omit.

Draft state: Statement may read `?verified-result ← finish(run)`; clause may read `- Post: ?verified-result recorded once`. `?` count = interview length; > 6 → Statement says too much, shrink. Sections below Contract absent until approval. `approved` contains zero `?`.

Terminal node: `Refinement` absent; `Realization` names the real thing + adaptation. Composite node naming a language keyword, framework, service, or concrete type = premature representation → move to child.

## Approval Rule

Agent derives + recommends. User approves anything changing product semantics, accepted risk, compatibility, cost commitment, hard-to-reverse architecture.

Approval covers Statement + Contract + Refinement body, not prose. Preserve user's exact negatives, ordering constraints, numeric limits, failure semantics verbatim. Contract with any `?` cannot be approved.

## Refinement Obligation — before `approved`

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

Evidence = why an obligation is currently believed to hold. Lives in the node it verifies; never elsewhere.

- One record = one (obligation, method). Same test covering two clauses → two records, same `Artifact`.
- Heading `### EV-DNNN-NN <name>` = anchor `nodes/D-NNN-<slug>.md#ev-dnnn-nn-<name>`.
- Never record command not run or proof not established.
- Method ladder, cheapest covering risk: types → examples → property-test → integration-test → static-analysis / proof → model-check → benchmark → fault-injection → observation (explicit env + sampling limits). Never promote kind: examples ≠ proof, local proof ≠ env assumptions, benchmark ≠ prod guarantee.
- `verified` iff every Contract clause has a `passed` record, `Limitations` don't exclude claimed conditions, applicable ADR invariants evidenced, no dependency stale. Else `unverified` / `partial` + name missing obligation.
- Stale on change to: contract or vocabulary tested; ancestor or child body; applicable ADR; code / config; dependency versions; anything in `Env`. Stale ≠ false; keep record, add fresh, restore `verified` only when coverage current.

## Reuse as Composition

Approved node = fn w/ contract. Parents rely on Statement + Contract; never reopen internals. Any later node may call it as a reuse terminal (see Node Kinds); each new caller appended to `Parents` + index row, and its body moves to `### Procedures` in `Program` on the second caller.

Reopen only when one changes: context entry it links; parent contract; invariant / budget; applicable ADR; child contract; evidence needed for verification.

Dependency changes → `stale` in header, row, Program tag, affected evidence records. Keep last approved content. Revisit affected frontier only.

## State Separation

Three independent axes in one header:

- `Design` — statement + body accepted?
- `Realization` — real thing exists?
- `Verification` — current evidence covers obligations?

Approved ≠ implemented. Implemented can violate design. Verified goes stale on dependency change.
