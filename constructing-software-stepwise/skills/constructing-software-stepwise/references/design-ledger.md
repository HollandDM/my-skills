# Design Ledger Format

Write entries in self-contained sentences. Refer to shared definitions by name or ID.

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
  .stepwise.log        attempted write/state calls after ledger load; read-only orientation/check calls omitted; JSON sets record field names, not duplicated payload text
docs/adr/NNNN-<slug>.md   hand-written paragraph; header + status owned by `adr new` / `adr accept`
```

Views exist for humans and PR review. The agent reads them (or `show D-NNN`) and never edits them; `check` fails on a hand-edited view.

## Node record — `ledger.json › nodes › D-NNN`

| Field | Set by | Meaning |
|---|---|---|
| `statement` | `new` (from parent body line, or root statement) | `x <- f(a, b)` · `-> f(a)` · `f(a)`. ID = statement; never renumber |
| `gloss`, `effect` | JSON `set` | one line; 1–2 sentences |
| `contract` | JSON `set` as `{ "contract": { "<lowercase label>": "<clause>" } }` | ≤ 6 clauses, each self-contained and checkable; labels free (`budget`, `determinism`, `boundary`, `cancellation`, `progress`); unknowns `?slug` |
| `depends` | `answer`; JSON `set` array (replace), or granular `set D-NNN depends "Name" …` (append); also derived from any term / `CTX-…` / `ADR-…` / `D-NNN` named in gloss, effect, contract | dependencies for `Used by` and staleness |
| `body` | `body D-NNN` (stdin / `--file`) | pseudocode lines → `{indent, code, child \| reuse \| target \| note}`; refused on an approved node |
| `composition`, `decisions`, `deferred`, `adaptation` | JSON `set` arrays | bullet lists, replaced whole |
| `target` | `terminal D-NNN "<target>: <identifier>"` | the real thing; format checked, existence must be grounded |
| `design` | `approve` · `reopen` · `stale` · `supersede` · `adr new` (→ draft, `adr_pending`) · `adr accept` | `draft` · `approved` · `stale` · `superseded` (+ `superseded_by`) |
| `approved`, `approved_at`, `approved_hash` | `approve` | who / when; body hash guards against silent edits |
| `realization`, `verification` | JSON `set` · `evidence` | `not-started \| partial \| implemented` · `unverified \| partial \| verified \| stale` |
| `evidence` | `evidence D-NNN --kind K --ref R --result pass\|fail [--note]` | one record per (obligation, method) |
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

Exists test: target resolvable today — docs page, API signature, file path, SQL. Own code not yet written (`service: AgentLedger.read`, `module: Foo`, `application service: …`) is not a target; it is the design. The CLI rejects some design-owned prefixes, but does not resolve APIs or files; the agent must establish actual existence. Such a statement is composite or a collapsed leaf (see Node Kinds), never terminal.

Adaptation = one line per Contract clause, `<clause> → <concrete construct>`: query text, API call with arguments, type / constraint, config key. Contract verb restated ("query one snapshot in order") ≠ adaptation. No construct nameable → not terminal.

An ADR's `Constrains:` list makes it a dependency of each node it names: the link appears under `Depends on` with no verb.

State is a machine, not a label: `new → draft → approved`, and out of `approved` only `reopen` (back to draft), `stale`, `supersede`, `retire`. A stale node returns through `reopen` + `approve`, never straight to `approved`. The tool refuses any move outside the table and prints the legal ones; `status <dir>` prints every node's state with the single move that advances it.

`stale` and `superseded` are not synonyms. `stale`: the node is still the design, but a term, fact, ADR or ancestor changed under it — the node view carries `Stale: <date> — <reason> · invalidated by <entry> (<date>)`, listing every dependency whose entry changed after this node's approval. `superseded by D-NNN`: a different node does the work now, and the replacement must exist. `retired`: dropped with no replacement.

Staleness travels the link graph rather than being spotted by eye. The edges are: a body's `-- D-NNN` calls and `-- ↗ D-NNN` reuses, and every id in `depends` (node ids in a node's prose are derived into `depends` exactly like terms, CTX ids and ADR ids). What a dependent rests on is the upstream node's **contract** — its statement and clauses — so re-`approve` cascades only when that hash changed, transitively marking each approved dependent `stale` with `invalidated by D-NNN (contract changed <date>)`; a body-only revision cascades nothing. `supersede` and `retire` always cascade, since the contract the dependents named is gone. `check` then refuses an approved node depending on a stale / superseded / retired node, and a body still calling a superseded child.

A root is a node nothing calls **and** nothing depends on; a durable entry point another node starts rather than calls (`Depends on: D-060` from a terminal that hands it to the platform) is neither a root nor an orphan. A body rewrite that drops a child leaves that child with no caller and no dependent — lint says so. `retire D-NNN "reason"` records that the design dropped it; the node keeps its history and stops appearing on the frontier. Adding the call back to quiet the message writes a refinement nobody approved.

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
- Prefer abstract data (`set`, `seq`, `map`, `record{…}`) in composite bodies. Record established platform constraints in contracts or facts when they affect correctness; concrete realization belongs in terminal targets or collapsed-leaf tags.

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
| Leaf — collapsed | User requests collapse, or agent chooses it under auto-approval; body fully mapped to real constructs | `body` with every statement `-- ⇒ <target>: <identifier> -- <one line>` (≤ 12 lines, no `-- D-NNN`), JSON `set` with `walkthrough` + `composition`, `approve` |
| Terminal — reuse | Statement = call to existing `approved` node, Statement + Contract used verbatim | no new node; parent body line `-- ↗ D-NNN` |
| Composite | else | `body` (child statements within the twelve-statement limit), one JSON `set` with proposal metadata, `approve` |

Choose child boundaries around distinct responsibilities and obligations. Avoid intermediate nodes that only rename an operation. A collapsed leaf has no child tags and maps every operation to a real construct within the twelve-statement limit. In interviewed mode, propose the collapse for user approval; in auto-approval mode, choose it when the remaining behavior is fully grounded.

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

Composition arguments explain the relevant data flow, failure handling, cleanup, invariants, and progress. Include enough detail to assess the obligation; a fixed bullet count or prose length is not required. `approve` requires composition for composites.

Contracts have at most six clauses. Keep each clause self-contained. Draft gloss, effect, and contract may carry `?slug`; approval requires all unknowns and applicable decisions to be resolved. Numerous unknowns suggest that the node's responsibility needs narrowing.

## Approval and pacing

Use the selected mode in [interaction.md](interaction.md) or [auto-approval.md](auto-approval.md). Approval covers the statement, contract, and body or target. Preserve the user's negative constraints, ordering, numeric limits, and failure semantics.

Persist `body` or `terminal`, grouped metadata via JSON `set`, then `approve`. Auto-approval uses `--by "standing approval"` per node even when reasoning and reporting cover several nodes together. Revisions use `reopen` before editing, followed by re-approval; history retains the reason.

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
- CLI limitation: any `--result pass` sets `verification: verified` and changes `not-started` realization to `implemented`; a later failing record does not clear verification automatically. Name the covered clause and limits in `--note`. After recording evidence, explicitly set verification to `partial`, `unverified`, or `stale` when current passing evidence does not cover every clause, and restore the actual realization state if needed. Do not report completion based on the automatic status alone.
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
