# CLI operations

Read when creating or updating a ledger. Commands are sequential writes to one shared ledger; there is no multi-node transaction or concurrency protection. A failed write may already have persisted changes: inspect state before retrying.

## Tooling — `scripts/stepwise.py` (python 3, stdlib, no regex, any agent)

`<dir>` = `docs/design/<topic>`. Script lives in this skill's `scripts/`; `python3 <skill>/scripts/stepwise.py <verb> <dir> …`. Every write verb renders the views and lints; exit 1 + `error …` lines mean fix with more verbs, never with an editor. `.stepwise.log` records attempted write/state commands after the ledger is loaded; read-only `frontier`, `show`, `status`, `check`, and `html` calls are omitted.

| Phase | Verb | Effect |
|---|---|---|
| browse | `html <dir> [--output FILE]` | export a standalone HTML snapshot; default `DESIGN.html`; see [html-view.md](html-view.md) |
| orient | `frontier <dir>` · `status <dir>` · `show <dir> D-NNN` | what to pick; every node's state + its one legal next move; one node view |
| draft | `new <dir> D-NNN ["stmt"]` | node from frontier line (root: pass statement) |
| draft | `set <dir> D-NNN '{"gloss":"…","effect":"…","contract":{"pre":"…","post":"…"}}'` | atomically replaces supplied node fields; contract ≤ 6 clauses with free lowercase labels (`budget`, `determinism`, `boundary` …); `?slug` allowed |
| interview | `entry <dir> term\|fact\|scenario "Name" "definition" [--source --avoid --not --example \| --given --when --then --excludes --settles]` | context entry; ids allocated |
| interview | `answer <dir> D-NNN slug "Name"` · `set <dir> D-NNN depends "Name" …` | `?slug` → name in every clause; depends += name. `set depends` for a dependency with no `?` (e.g. a fact born later) |
| interview | `ambiguity <dir> "claim" "conflict" D-NNN` · `meta <dir> scope\|title "…"` · `meta <dir> nongoals "a" "b"` | deferred question; scope; non-goals |
| propose→persist | `body <dir> D-NNN` (stdin heredoc or `--file`) | pseudocode body; tags `-- D-NNN` / `-- ↗ D-NNN` / `-- ⇒ target`; single-match calls auto-tagged |
| propose→persist | `set <dir> D-NNN '{"walkthrough":["…"],"composition":["…"],"decisions":["…"]}'` | one atomic metadata write; walkthrough ≤ 3 lines and each supplied array replaces that whole field |
| propose→persist | `terminal <dir> D-NNN "<target>: <identifier>"` · `set <dir> D-NNN '{"adaptation":["clause → construct"]}'` | leaf; target syntax checked, actual existence requires grounding |
| persist | `approve <dir> D-NNN [--by "standing approval"]` | `--by` records who approved (default `user`); refuses on `?`, empty prose, no body/target, missing walkthrough, a tagged body line that says nothing about what it does, missing composition, untagged call, pending ADR; drops ambiguity rows resolving at this node; prints next frontier id |
| change | `reopen <dir> D-NNN "reason"` · `stale <dir> D-NNN "reason"` · `retire <dir> D-NNN "reason"` · `supersede <dir> D-OLD D-NEW "reason"` | status + history; `stale` also records which entries changed after approval; `reopen` files the body it replaces under `## Superseded refinement` |
| change | `change <dir> <name\|CTX-id> [--definition …] [--rename "New heading"] [--status stale] --reason "…" [--minor]` | entry changed; approved dependents fail lint until `stale` / re-`approve` |
| decision | `adr <dir> new "Title" --constrains D-NNN[,D-MMM]` · `adr <dir> accept ADR-NNNN` | stub (nodes → `draft (ADR pending)`); accept unblocks |
| implement | `set <dir> D-NNN '{"realization":"implemented"}'` · `evidence <dir> D-NNN --kind K --ref R --result pass\|fail` | pass automatically sets `verified`; see evidence limitations in [design-ledger.md](design-ledger.md#evidence-rules) |
| audit | `status <dir> [--all]` · `sync <dir>` · `check <dir>` | re-render after an ADR paragraph edit; lint only |

Inspect errors to distinguish inconsistent design from a tool limitation. Resolve it in the design: `retire` a node the refinement dropped, `stale` / `reopen` what a changed entry invalidated, `supersede` what a replacement took over, restore a call you removed by mistake. Never invent a body line, a call, a clause, or a node to silence a message — a green `check` bought that way records a design nobody chose, and the next reader cannot tell. If no supported verb can express the design, report the tool limitation rather than inventing content.

JSON `set` is the default whenever more than one node field changes. Allowed keys: `gloss`, `effect`, `contract`, `walkthrough`, `composition`, `decisions`, `deferred`, `adaptation`, `depends`, `realization`, `verification`. Only supplied top-level fields change; `contract` and every supplied array replace their whole current value. Invalid JSON, unknown keys, wrong value types, or unresolved dependencies write nothing. The granular `set <dir> D-NNN <field> <value...>` form remains for one-field corrections and appending a dependency without restating its existing list.

Lint covers: one root; status vocabulary; caps; untagged calls; reuse of non-approved node; target format and disallowed design-owned prefixes; approved with `?` / no body / no walkthrough / unglossed body line / no composition / body changed / pending ADR; dependency names that do not exist; entry changed after approval; ADR constrains stale or missing node; ambiguity at approved node; hand-edited view. Target existence, contract correctness, composition, and evidence coverage remain reasoning obligations; lint does not establish them.
