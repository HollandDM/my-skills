# Golden fixtures

These directories are frozen outputs of the **Python** Stepwise CLI (`scripts/stepwise.py` at repository commit
`d271c9d`, the last commit before the TypeScript rewrite). They cannot be regenerated with the current CLI; they exist so
`fixtures.test.ts` and `pyparity.test.ts` can prove the TypeScript port reproduces Python behavior byte for byte.

- `forward/` — a forward-design ledger (`design/`, nodes D-000..D-004, one ADR, `DESIGN.html`, `export/custom.html`).
  Produced by running a scripted sequence of `new`/`set`/`body`/`approve`/`evidence`/`reopen`/`retire`/`adr`/`html` verbs.
- `existing/` — an existing-code workflow: `repo/` with `normalize.py`, `run.py`, a git-backed ledger under
  `repo/docs/design/normalization`, and the `rebuild/` output of `reconcile`. `git-fixture.json` records the fixed git
  environment (dates, author), the commit hash the Python run inspected, and the original `normalize.py` contents so the
  test can recreate the identical commit before loading the ledger.
- `python-parity.json` — CPython reference outputs for `json.dumps`, `str.title`/`isalpha`/`isidentifier`/…, `repr`,
  `os.path.relpath`, `splitlines` and friends, consumed by `pyparity.test.ts`. Dict keys that look like integers were
  excluded because JavaScript objects reorder them.

If Python-compat helpers (`src/pyjson.ts`, `src/pystr.ts`) or rendering ever change on purpose, check out `d271c9d`,
rerun the Python CLI over the same command sequence, and replace these files together with the hashes they contain.
