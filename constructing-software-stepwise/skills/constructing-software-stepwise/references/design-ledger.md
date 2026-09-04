# Design Ledger Format

_Every field below is written in complete, self-explanatory sentences for a reader with no context — see Voice in SKILL.md. Caps bound how much is said, never how clearly._

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
  .stepwise.log        every mutation: command, applied flag, errors, before/after ledger hashes; JSON values redacted to field names
docs/adr/NNNN-<slug>.md   hand-written paragraph; header + status owned by `adr new` / `adr accept`
```

Views exist for humans and PR review. The agent reads them (or `show D-NNN`) and never edits them; `check` fails on a hand-edited view.

## Node record — `ledger.json › nodes › D-NNN`

| Field | Set by | Meaning |
|---|---|---|
| `statement` | `new` (from parent body line, or root statement) | `x <- f(a, b)` · `-> f(a)` · `f(a)`. ID = statement; never renumber |
| `gloss`, `effect` | JSON `set` | one line; 1–2 sentences |
| `contract` | JSON `set` as `{ "contract": { "<lowercase label>": "<clause>" } }` | ≤ 6 clauses, 1–2 explicit lines each — checkable on its own, never a fragment; labels free (`budget`, `determinism`, `boundary`, `cancellation`, `progress`); unknowns `?slug` |
| `depends` | `answer`; JSON `set` array (replace), or granular `set D-NNN depends "Name" …` (append); also derived from any term / `CTX-…` / `ADR-…` / `D-NNN` named in gloss, effect, contract | dependencies for `Used by` and staleness |
| `body` | `body D-NNN` (stdin / `--file`) | pseudocode lines → `{indent, code, child \| reuse \| target \| note}`; refused on an approved node |
| `composition`, `decisions`, `deferred`, `adaptation` | JSON `set` arrays | bullet lists, replaced whole |
| `target` | `terminal D-NNN "<target>: <identifier>"` | the real thing; Exists test enforced |
| `design` | `approve` · `reaffirm` · `reopen` · `stale` · `supersede` · `adr new` (→ draft, `adr_pending`) · `adr accept` | `draft` · `approved` · `stale` · `superseded` (+ `superseded_by`) |
| `approved`, `approved_by`, `approved_at`, `approved_hash`, `proposal_hash` | `approve --actor … --proposal-hash …` | who / when / exact accepted proposal; body hash guards against silent edits |
| `realization`, `verification` | JSON `set` or granular `set D-NNN realization <v>` · clause-scoped `evidence` | `not-started \| partial \| implemented` · `unverified \| partial \| verified \| stale`; direct `set verification verified` is refused |
| `evidence` | `evidence D-NNN --kind K --ref R --result pass\|fail --covers CLAUSE[,CLAUSE] [--resolves EV-N] [--note]` | current approval + contract hash, covered clauses, explicit resolution links |
| `history` | every state verb | `{date, event, reason}` — reopen / stale / supersede / re-approve reasons live here, never in status text |

Parents are derived: every node whose body tags `D-NNN` as `child` or `reuse`. Frontier is derived: child ids tagged in non-draft bodies with no node yet. Nothing structural is typed twice.

### Atomic JSON set

Use one `set <dir> D-NNN '<json object>'` whenever several node fields change. Allowed top-level fields are `gloss`, `effect`, `contract`, `walkthrough`, `composition`, `decisions`, `deferred`, `adaptation`, `depends`, `realization`, and `verification`. Only supplied top-level fields change; the nested `contract` object and every supplied array replace the whole existing field. Invalid JSON, unknown fields, wrong types, contract overflow, or unresolved dependencies leave the ledger unchanged. The granular `set <dir> D-NNN <field> <value...>` form is for one-field corrections and dependency append.

```json
{
  "gloss": "one durable job run",
  "effect": "The job reaches one durable terminal outcome.",
  "contract": {
    "pre": "The caller supplies a ?job-key.",
    "post": "Exactly one outcome is recorded for Job Key."
  }
}
```

Status shown in views: `draft` · `draft (k ?)` · `draft (ADR pending ADR-NNNN)` · `approved` · `stale` · `superseded by D-MMM`. No other words exist.

## Realization Target

"Real" = whatever the statement maps onto **outside the design**: language construct, framework API, platform primitive, managed service, infra resource, config, repo function that exists on disk. Written `<target>: <identifier>` — `scala: AgentRuns.claim`, `dbos: DBOS.startWorkflow`, `postgres: SELECT … ORDER BY seq`, `k8s: CronJob`, `repo: src/billing/Ledger.scala#append`.

Exists test: target resolvable today — docs page, API signature, file path, SQL. Own code not yet written (`service: AgentLedger.read`, `module: Foo`, `application service: …`) is not a target; it is the design. `terminal` refuses it. Such a statement is composite or a collapsed leaf (see Node Kinds), never terminal.

Adaptation = one line per Contract clause, `<clause> → <concrete construct>`: query text, API call with arguments, type / constraint, config key. Contract verb restated ("query one snapshot in order") ≠ adaptation. No construct nameable → not terminal.

An ADR's `Constrains:` list makes it a dependency of each node it names: the link appears under `Depends on` with no verb.

State is a machine, not a label: `new → draft → approved`, and out of `approved` only `reopen` (back to draft), `stale`, `supersede`, `retire`. A stale node returns through `reopen` + `approve`, never straight to `approved`. The tool refuses any move outside the table and prints the legal ones; `status <dir>` prints every node's state with the single move that advances it.

`stale` and `superseded` are not synonyms. `stale`: the node is still the design, but a term, fact, ADR or ancestor changed under it — the node view carries `Stale: <date> — <reason> · invalidated by <entry> (<date>)`, listing every dependency whose entry changed after this node's approval. `superseded by D-NNN`: a different node does the work now, and the replacement must exist. `retired`: dropped with no replacement.

Staleness travels the link graph rather than being spotted by eye. The edges are: a body's `-- D-NNN` calls and `-- ↗ D-NNN` reuses, and every id in `depends` (node ids in a node's prose are derived into `depends` exactly like terms, CTX ids and ADR ids). What a dependent rests on is the upstream node's **contract** — its statement and clauses — so re-`approve` cascades only when that hash changed, transitively marking each approved dependent `stale` with `invalidated by D-NNN (contract changed <date>)`; a body-only revision cascades nothing. `supersede` and `retire` always cascade, since the contract the dependents named is gone. `check` then refuses an approved node depending on a stale / superseded / retired node, and a body still calling a superseded child.

A root is a node nothing calls **and** nothing depends on; a durable entry point another node starts rather than calls (`Depends on: D-060` from a terminal that hands it to the platform) is neither a root nor an orphan. A body rewrite that drops a child leaves that child with no caller and no dependent — lint says so. `retire D-NNN "reason"` records that the design dropped it; the node keeps its history and stops appearing on the frontier. Adding the call back to quiet the message writes a refinement nobody approved.

`reaffirm <dir> D-NNN --actor <name>` returns a stale node whose own content never moved — the ordinary end of a cascade, where the caller still holds against the dependency's new contract. It takes no reason: the provenance is already in `stale_by`, and the node view records `reaffirmed <date> by <actor>` plus a history line naming what it was reaffirmed against. It files no `## Superseded refinement`, keeps `approved_hash`, `contract_hash` and `proposal_hash`, refreshes `approved_at` so the node stands against the dependency as it is today, and leaves `verification` where the cascade put it — evidence covers clauses against a contract that moved, so it is re-run, not re-labelled. It refuses any node whose proposal, body or contract hash differs from what was approved, and any node approved before proposal hashes existed; both go through `reopen` + `approve`.

`reopen` snapshots the body, composition, decisions and deferred it invalidates into the node view's `## Superseded refinement` section, so the replaced refinement stays readable while the node is redrafted.

Adaptation lines name the clause they map: `<clause> → <concrete construct>` or `<Clause>: <concrete construct>`. A wrapped pseudocode line (multi-line SQL, a long expression) is joined onto the statement above it, so its tag goes on the last line.

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
| Terminal — real | Statement = ONE real thing that passes Exists test, or Contract already met by ONE such thing cited in a fact | `terminal`, JSON `set` with `adaptation`, `approve`; later `evidence` |
| Leaf — collapsed | User rules node not worth child-by-child review; body still fully written to real lines | `body` with every statement `-- ⇒ <target>: <identifier> -- <one line>` (≤ 12 lines, no `-- D-NNN`), JSON `set` with `walkthrough` + `composition`, `approve` |
| Terminal — reuse | Statement = call to existing `approved` node, Statement + Contract used verbatim | no new node; parent body line `-- ↗ D-NNN` |
| Composite | else | `body` (2–7 child statements), one JSON `set` with proposal metadata, `approve` |

Composite fan-out 2–7. 1 → rename. >7 → intermediate node. Terminal = only place refinement stops: adapt to real, or call approved node.

Collapse rule: "not worth digging" is the user's call — the **Make terminal** answer to a Proposal, and it collapses review, not refinement. Collapsed leaf = one approval, no child nodes, but the body is complete pseudocode down to real constructs — every statement line names its target, control + `{ assertion }` lines as usual, ≤ 12 lines. Needs > 12 lines or a line with no nameable target → it is worth digging: propose children.

Terminal test precedes every body. Contract met by one real thing cited in a fact → terminal; `adaptation` maps each clause onto that thing, evidence verifies it. Platform guarantees (idempotent start by key, resume from checkpoint, CAS, lock, retry, version pin) never get refined into pseudocode — snapshot / decide / CAS / bind / schedule chains above one `dbos: startWorkflow` re-derive the platform.

Reuse rules: target must be `approved` (draft / stale → lint error); call matches its statement signature; parent's composition argument uses its Contract only, never its body; contract doesn't fit → `reopen` that node (all parents go stale via lint) or a new node — never copy a body with a tweak.

## Node view — `nodes/D-020.md` (generated)

```markdown
# D-020 — next_step

Kind: node · Index: [../DESIGN.md](../DESIGN.md)
Design: approved · Realization: not-started · Verification: unverified
Parents: [D-000](D-000.md)
Depends on: [CTX-F03](../CONTEXT.md#ctx-f03-…), [Run Key](../CONTEXT.md#run-key), [ADR-0003](../../../adr/0003-….md)
Approved: 2026-08-28 by user:owner
Proposal: 34ad82b9305d0f4c

## Statement
`step <- next_step(run)` — one model turn decided from run history
## Effect
…
## Contract
- Pre: …
- Post: …
- Failure: …
- Invariant: …
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

Walkthrough: the JSON `set` field `walkthrough` is an array of at most 3 plain lines saying what the function does, rendered above the pseudocode. Every tagged pseudocode line carries one line of explanation, so a reader knows what each line does before its node exists; an existing child's or reused node's own gloss takes over once it does. `approve` refuses a body missing either.

Composition argument: five bullets — data flow, failures, cleanup, invariants, progress (≤ 2 lines each). Not applicable → `n/a: <reason>`. Never omit. `approve` refuses a composite without composition.

Clause style: 1–2 explicit lines, self-contained. Say which thing, under which condition, and what holds afterwards — `Post: exactly one row per Job Key survives, whatever the caller retried`, not `Post: row exists`. Six clear clauses do not fit → the node says too much, split it. Never trade clarity for length.

Draft state: gloss / effect / clause may carry `?slug`; `?` count = interview length; > 6 → statement says too much, shrink. `approve` refuses any `?`.

## Approval Rule

Agent derives + recommends. User approves anything changing product semantics, accepted risk, compatibility, cost commitment, hard-to-reverse architecture.

Approval covers every staged node field: Statement, gloss, effect, Contract, body/target, walkthrough, composition, decisions, deferred items, and adaptation. Preserve user's exact negatives, ordering constraints, numeric limits, and failure semantics verbatim. `proposal D-NNN` hashes that exact content. Show the hash in the Proposal block. After the user's yes, run `approve D-NNN --actor "<identity>" --proposal-hash <accepted hash>`. Any intervening edit changes the hash and forces a new Proposal.

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

- Every record names covered Contract clauses with `--covers`. One artifact may cover several clauses, but each named clause is an explicit claim.
- Never record a command not run or a proof not established.
- Method ladder, cheapest covering risk: types → examples → property-test → integration-test → static-analysis / proof → model-check → benchmark → fault-injection → observation (explicit env + sampling limits). Never promote kind: examples ≠ proof, local proof ≠ env assumptions, benchmark ≠ prod guarantee.
- Record implementation separately with `set D-NNN realization implemented`; evidence never infers code existence.
- A pass produces `verified` only when evidence tied to the current approval covers every current clause and no current failed EV remains unresolved. Partial coverage produces `partial`.
- A fail produces stale verification. A later passing record closes it only with `--resolves EV-N`, and that record must cover the same obligation. Failed records remain visible.
- Reapproval starts a new evidence epoch through `approved_at`; earlier records remain history but cannot verify the new approval. Direct `set verification verified` is refused.
- Legacy ledgers remain readable. `check` emits one warning for old unscoped verified records; new evidence uses the current model.

## Reuse as Composition

Approved node = fn w/ contract. Parents rely on Statement + Contract; never reopen internals. Any later node may call it as a reuse terminal (`-- ↗ D-NNN`); parents derive, the body moves to `### Procedures` on the second caller.

Reopen only when one changes: context entry it depends on; parent contract; invariant / budget; applicable ADR; child contract; evidence needed for verification.

## State Separation

Three independent axes:

- `design` — statement + body accepted?
- `realization` — real thing exists?
- `verification` — current evidence covers obligations?

Approved ≠ implemented. Implemented can violate design. Verified means current clause coverage, not “some test passed,” and goes stale on failed evidence or dependency change.

## Mutation Results and Repair

Mutation commands save requested repair steps even when the whole ledger cannot yet be green. `APPLIED-WITH-ERRORS` exits 0 and logs `applied=true`, error text, body hash when present, and before/after ledger hashes. Continue with `repair`, which orders draft/stale nodes dependency-first and collapses ADR blockers by node. Finish with strict `check`; only `check` returns 1 for remaining ledger-wide errors.

Exit 1 means command rejection and no ledger/view change. The audit line records `applied=false` and the rejection reason. Do not use exit 1 as a signal that an attempted repair partly succeeded.
