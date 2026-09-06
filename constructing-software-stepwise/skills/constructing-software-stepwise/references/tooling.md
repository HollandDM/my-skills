# CLI operations

Run `node <skill>/dist/stepwise.mjs <verb> <dir> ...`. `<dir>` is the design directory. Node.js 22 or newer is sufficient; `dist/stepwise.mjs` is a self-contained bundle and needs no `npm install`.

## Transactional updates

Commands mutate in memory, validate the final ledger, then commit the canonical data, generated views, ADR changes, and audit record together. Rejected operations and invalid final states do not change those files. Related changes that temporarily invalidate each other belong in one `batch`.

The CLI serializes readers and writers through `.stepwise.lock`. Validated writes use `.stepwise-transaction.json` as a recovery journal: after process interruption or an I/O failure, the next command completes the prepared commit before loading the ledger. Generated files are replaced individually under that lock; external programs reading them directly do not get a filesystem-wide atomic snapshot. Do not manually delete a pending journal.

```json
[
  {"verb":"new","id":"D-000","statement":"result <- normalize(value)"},
  {"verb":"set","id":"D-000","fields":{
    "gloss":"Normalize one string.",
    "effect":"Remove surrounding whitespace.",
    "contract":{"pre":"The caller supplies a string.","post":"The result has no surrounding whitespace."}
  }},
  {"verb":"ready","id":"D-000","approach":"Implement with str.strip without mutating input.","validation":"Check empty, whitespace-only, and already-normalized inputs."},
  {"verb":"approve","id":"D-000","by":"standing approval"}
]
```

Save the operations to a file, then run `batch <dir> --file changes.json`, or pass JSON on stdin. A batch applies operations sequentially in memory and renders once after final validation. Parents must expose child IDs before `new` creates them; reuse targets must be approved before reuse. Existing IDs and references resolve against the evolving batch state.

Shorthand operations also support `adopt` (`statement`, optional `parent`) and `observe` (`payload`, `at`); bindings and reconciliation use the generic `verb`/`args` form. Other shorthand operations support `new`, `set`, `body` (`text`), `terminal` (`target`), `ready` (`approach`, `validation`), `approve` (`by`), and `reopen`/`stale`/`retire` (`reason`). Any mutation can use `{"verb":"entry","args":["term","Run Key","Caller-supplied identity.","--source","user"]}` or an argument array such as `["answer","D-000","run-key","Run Key"]`. Arguments never run through a shell. Nested batches and read-only operations are rejected.

## Commands

For reconstruction, source bindings, implementation versions, and inspection payloads, read [existing-work.md](existing-work.md). The adoption and observation commands participate in normal atomic batches.

| Verb | Use |
|---|---|
| `adopt <dir> D-NNN ["statement"] [--parent D-NNN]` | Build or link an observational hierarchy without parent approval. |
| `bind <dir> D-NNN PATH [--repo ROOT] [--binding S01] [--symbol NAME] [--lines START:END]` | Bind a whole-file source fingerprint; locators are navigation hints. |
| `unbind <dir> D-NNN S01 --reason TEXT` | Remove a binding while preserving its history. |
| `observe <dir> D-NNN JSON --at TOKEN` or `--file FILE` | Record inspected claims and optional comparisons against an exact source scope. |
| `observation <dir> D-NNN` | Export the current observation as a valid editable `observe` payload, including pseudocode. |
| `scan <dir> [--repo ROOT] [--json]` | Read versions, notifications, and current/bound/observed coverage over every active node in a source-backed model. |
| `reconcile <dir> [--output DIR] [--repo ROOT]` | Initialize a fresh ledger for a source-first rebuild. Continue with inspection and adopt/bind/observe; the old ledger remains intact. Cannot run inside a batch. |
| `new <dir> D-NNN ["statement"]` | Create a root or frontier node. |
| `set <dir> D-NNN '{...}'` | Replace supplied fields atomically, including `statement` on a draft. Reopen matching parent callsites in the batch so the guarded rename can update them; see [design-ledger.md](design-ledger.md). |
| `body <dir> D-NNN --text "..."` or `--file FILE` | Set a paper-style procedure on a draft node; see [pseudocode.md](pseudocode.md). Stdin is also supported outside a batch. |
| `terminal <dir> D-NNN "target: identifier"` | Map a draft leaf to a named construct, including unwritten application code. |
| `ready <dir> D-NNN --approach TEXT --validation TEXT` | Record a bounded implementation leaf. |
| `approve <dir> D-NNN [--by WHO]` | Accept a draft's complete design revision; auto-approval uses `standing approval`. |
| `proposal <dir> D-NNN` | Hash the exact proposal for `approve --actor WHO --proposal-hash HASH`. |
| `reaffirm <dir> D-NNN --by WHO` | Re-accept an unchanged stale node; `--actor` is also supported. |
| `repair <dir>` | List pending design repairs in dependency order; group related changes in a batch. |
| `reopen` / `stale` / `retire <dir> D-NNN "reason"` | Revise, invalidate, or drop a node. |
| `supersede <dir> D-OLD D-NEW "reason"` | Record a replacement. |
| `evidence <dir> D-NNN --kind K --ref R --result pass\|fail --clause LABEL --scope implementation\|composition\|correspondence --assessment TEXT [--scenario TEXT]` | Record an assessed check and derive coverage. Test/e2e kinds require the exercised scenario. `--covers pre,post` and `--resolves EV-N` are supported. |
| `withdraw-evidence <dir> D-NNN EV-N --reason TEXT [--by WHO]` | Retract evidence without calling the implementation failed; the audit record remains and its coverage is removed. |
| `entry <dir> term\|fact\|scenario "Name" "definition" [--source TEXT ...]` | Record shared meaning; see [context-ledger.md](context-ledger.md). |
| `answer <dir> D-NNN slug "Name"` | Resolve a draft unknown using an existing entry. |
| `change <dir> REF --definition TEXT --reason TEXT [--minor]` | Update context and invalidate affected designs. |
| `ambiguity <dir> "claim" "conflict" D-NNN` | Assign an unresolved decision to its owning node. |
| `meta <dir> scope\|title TEXT` / `meta <dir> nongoals TEXT ...` | Set design boundaries. |
| `adr <dir> new\|accept\|supersede\|constrains ...` | Maintain consequential decisions; see [adr-ledger.md](adr-ledger.md). |
| `status <dir> [--all]` / `frontier <dir>` / `show <dir> D-NNN` | Inspect state and next work. |
| `check <dir>` / `sync <dir> [--repo ROOT]` | Validate, or incrementally persist source versions and refresh derived statuses/Markdown while preserving node identities. Reinspect changed nodes with observe. |
| `html <dir> [--output FILE]` | Export the reader and review charts; see [html-view.md](html-view.md). |

Use `--help` on the command for flags. An error should be resolved in the design or operation payload, not silenced by invented calls or claims. Evidence sufficiency, actual target guarantees, and architectural correctness remain reasoning obligations.
