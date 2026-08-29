#!/usr/bin/env python3
"""Self-check: drive a small design end to end through the CLI. Run: python3 test_stepwise.py"""
import io
import json
import shutil
import sys
import tempfile
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import stepwise as sw  # noqa: E402

root = Path(tempfile.mkdtemp()) / "docs"
d = root / "design" / "job-runner"
(root / "adr").mkdir(parents=True)


def run(*args, stdin="", ok=True):
    out, err = io.StringIO(), io.StringIO()
    sys.stdin = io.StringIO(stdin)
    with redirect_stdout(out), redirect_stderr(err):
        rc = sw.main(["stepwise.py", args[0], str(d), *args[1:]])
    text = out.getvalue() + err.getvalue()
    assert (rc == 0) == ok, f"{args} -> rc {rc}\n{text}"
    return text


def ledger():
    return json.loads((d / "ledger.json").read_text())


# root + prose + unknowns
run("new", "D-000", "outcome <- run_job(key, spec)")
before = ledger()
t = run("set", "D-000", '{"gloss":', '"secret"}', ok=False)
assert "one quoted argument" in t
audit = (d / ".stepwise.log").read_text()
assert "<json:gloss>" in audit and "secret" not in audit
invalid_payloads = [
    ('{"gloss": "unterminated}', "invalid JSON set payload"),
    ("[]", "must be an object"),
    ("{}", "payload is empty"),
    ('{"gloss": 3}', "JSON field 'gloss' must be a string"),
    ('{"unknown": "value"}', "unknown JSON field(s) unknown"),
    (json.dumps({"contract": {f"clause{i}": "value" for i in range(7)}}), "7 clauses > 6"),
    ('{"contract": {"not-valid": "value"}}', "must be one lowercase word"),
    ('{"contract": {"pre": 3}}', "contract clause 'pre' must be a string"),
    ('{"walkthrough": ["a", 3]}', "must be an array of strings"),
    ('{"walkthrough": ["a", "b", "c", "d"]}', "4 lines > 3"),
    ('{"realization": "done"}', "realization must be one of"),
    ('{"verification": "done"}', "verification must be one of"),
]
for payload, message in invalid_payloads:
    t = run("set", "D-000", payload, ok=False)
    assert message in t and ledger() == before, (payload, t)
t = run("set", "D-000", json.dumps({"gloss": "must not stick", "depends": ["Missing"]}), ok=False)
assert "is not a term" in t and ledger() == before
run("set", "D-000", json.dumps({
    "gloss": "run one job to a durable outcome",
    "effect": "Job runs once per ?job-key and ends in a durable outcome.",
    "contract": {
        "pre": "?job-key is caller-supplied",
        "post": "outcome recorded once",
    },
}))
run("set", "D-000", json.dumps({"contract": {
    "pre": "?job-key is caller-supplied",
    "post": "outcome recorded once",
    "contract": "This temporary free-label clause proves nested labels do not collide with top-level fields.",
}}))
assert "contract" in ledger()["nodes"]["D-000"]["contract"]
run("set", "D-000", json.dumps({"contract": {
    "pre": "?job-key is caller-supplied",
    "post": "outcome recorded once",
}}))
assert "contract" not in ledger()["nodes"]["D-000"]["contract"]
audit = (d / ".stepwise.log").read_text()
assert "<json:gloss,effect,contract>" in audit and "run one job to a durable outcome" not in audit
assert "draft (1 ?)" in run("frontier")
t = run("approve", "D-000", ok=False)
assert "unresolved ?job-key" in t and "no refinement body" in t
t = run("answer", "D-000", "job-key", "Job Key", ok=False)
assert "entry" in t
run("entry", "term", "Job Key", "Caller-chosen idempotency key naming one Job.", "--avoid", "run id, correlation id", "--source", "user")
t = run("answer", "D-000", "job-key", "Job Key")
assert "no ? left" in t
n = ledger()["nodes"]["D-000"]
assert n["contract"]["pre"] == "Job Key is caller-supplied" and n["depends"] == ["Job Key"], n

# body + autotag + frontier
body = """run_job(key, spec):
  job <- establish_job(key, spec)                 -- D-010: create or load the job row
  { job durable }
  loop until done(job):
    job <- advance(job)                           -- D-020: move the job one durable step
  -> finish(job)
"""
t = run("body", "D-000", stdin=body, ok=False)
assert "D-010" in t and "D-020" in t and "untagged call '-> finish(job)'" in t
t = run("approve", "D-000", ok=False)
assert "untagged call '-> finish(job)'" in t and "composition missing" in t and "walkthrough missing" in t
run("body", "D-000", stdin=body.replace("-> finish(job)", "-> finish(job)                                  -- D-030: record the outcome"))
t = run("set", "D-000", "walkthrough", "a", "b", "c", "d", ok=False)
assert "4 lines > 3" in t
run("set", "D-000", json.dumps({
    "walkthrough": ["Establishes the job row, advances it until done, then records the outcome."],
    "composition": ["Data flow: key -> job -> outcome", "Failures: each child owns its retry"],
    "decisions": ["one job per key"],
}))
t = run("approve", "D-000")
assert "approved D-000" in t and "next: `new <dir> D-010`" in t
before = ledger()
t = run("set", "D-000", json.dumps({"contract": {"post": "a changed outcome"}}), ok=False)
assert "is approved" in t and "`reopen D-000" in t and ledger() == before
t = run("set", "D-000", "post", "a changed outcome", ok=False)
assert "is approved" in t and ledger() == before
fr = run("frontier")
assert "D-010  frontier  establish_job(key, spec) -> job  (child of D-000)" in fr and "D-030" in fr
assert "D-000  frontier" not in fr

# terminal leaf with exists test
run("new", "D-010")
run("set", "D-010", "gloss", "create or load the job row")
run("set", "D-010", "effect", "Job row exists exactly once per Job Key.")
run("set", "D-010", "pre", "key valid")
run("set", "D-010", "post", "row exists")
t = run("terminal", "D-010", "application service: JobStore.create", ok=False)
assert "design-owned" in t
run("terminal", "D-010", "postgres: INSERT ... ON CONFLICT (key) DO NOTHING")
run("set", "D-010", "adaptation", "establish -> INSERT ON CONFLICT", "Post: the unique index makes the second insert a no-op")
run("approve", "D-010")
design = (d / "DESIGN.md").read_text()
assert "D-010 ⇒ postgres: INSERT ... ON CONFLICT (key) DO NOTHING" in design, design
assert "D-020 (frontier)" in design and "D-030 (frontier)" in design
assert "-- D-000" in design.splitlines()[[i for i, l in enumerate(design.splitlines()) if l.startswith("run_job(")][0]]

# reuse + procedures
run("new", "D-020")
for f, v in (("gloss", "one step"), ("effect", "Job advances one durable step."), ("pre", "job active"), ("post", "job advanced")):
    run("set", "D-020", f, v)
run("body", "D-020", stdin="advance(job):\n  step <- pick_step(job)   -- D-021: choose the next step\n  job <- establish_job(job.key, job.spec)   -- ↗ D-010\n")
run("set", "D-020", "walkthrough", "Picks the next step, then re-establishes the job row.")
run("set", "D-020", "composition", "pick then re-establish")
run("approve", "D-020")
design = (d / "DESIGN.md").read_text()
assert design.count("D-010 ⇒ postgres") == 2 and "↗" not in design, design  # terminal reused: target shown at both call sites, no procedure block

# reopen / body-changed guard / re-approve
run("body", "D-020", stdin="x", ok=False)
run("reopen", "D-020", "user wants a pause step")
assert "## Superseded refinement" in (d / "nodes" / "D-020.md").read_text() and "↗ D-010" in (d / "nodes" / "D-020.md").read_text()
run("body", "D-020", stdin="advance(job):\n  step <- pick_step(job)   -- D-021: choose the next step\n  wait_for(step)   -- D-022: block until the step settles\n")
t = run("approve", "D-020")
assert "approved D-020" in t
n = ledger()["nodes"]["D-020"]
assert [h["event"] for h in n["history"]] == ["reopened", "re-approved"], n["history"]

# context change -> stale dependents
t = run("change", "Job Key", "--definition", "Caller-chosen key naming one Job across retries.", "--reason", "clarified retries", ok=False)
assert "dependents to re-check: D-000" in t and "Job Key changed" in t
t = run("check", ok=False)
assert "Job Key changed" in t
assert ledger()["nodes"]["D-010"]["depends"] == ["Job Key"]  # derived from the effect text
run("stale", "D-000", "Job Key redefined", ok=False)
run("stale", "D-010", "Job Key redefined")
v10 = (d / "nodes" / "D-010.md").read_text()
assert "Stale: " in v10 and "Job Key redefined" in v10 and "invalidated by Job Key (" in v10, v10
before = ledger()
t = run("set", "D-010", '{"contract":{"post":"changed while stale"}}', ok=False)
assert "is stale" in t and "`reopen D-010" in t and ledger() == before
run("check", ok=True)
t = run("approve", "D-000", ok=False)
assert "is stale" in t and "From stale: reopen, retire, supersede" in t, t
run("reopen", "D-000", "Job Key definition sharpened")
run("approve", "D-000")
run("reopen", "D-010", "Job Key definition sharpened")
run("approve", "D-010")
st = run("status")
assert "D-000  approved" in st and "refine its children" in st, st

# facts, scenarios, ambiguity, meta, adr
t = run("entry", "fact", "Postgres unique index", "A unique index rejects a second row with the same key.", "--source", "pg docs")
assert "CTX-F01" in t
run("set", "D-020", "depends", "CTX-F01")
assert ledger()["nodes"]["D-020"]["depends"] == ["CTX-F01"]
run("set", "D-020", "depends", "Nope", ok=False)
t = run("set", "D-020", "depends", "Job Key", ok=False)  # Job Key changed after D-020's approval -> lint
assert "Job Key changed" in t
run("reopen", "D-020", "depends on Job Key now")
run("approve", "D-020")
t = run("entry", "scenario", "Retry after crash", "", "--given", "a job committed step 1", "--when", "the worker restarts", "--then", "step 1 is not repeated", "--settles", "Job Key boundary")
assert "CTX-S01" in t
run("change", "CTX-F01", "--rename", "Postgres unique index rejects duplicates", "--reason", "heading was ambiguous", "--minor")
assert "Postgres unique index rejects duplicates" in (d / "CONTEXT.md").read_text()
run("meta", "scope", "One job from request to durable outcome.")
run("meta", "nongoals", "scheduling", "multi-tenant quotas")
run("ambiguity", "job identity", "key vs row id", "D-030")
t = run("adr", "new", "Postgres as the only durable store", "--constrains", "D-010,D-030")
assert "ADR-0001" in t
t = run("approve", "D-010", ok=False)
assert "ADR-0001 pending" in t
run("adr", "accept", "ADR-0001")
assert "Status: accepted" in next((root / "adr").glob("0001-*.md")).read_text()
run("approve", "D-010")
run("adr", "new", "Ledger rows are append-only", "--constrains", "D-021")
run("adr", "supersede", "ADR-0001", "ADR-0002")
run("adr", "constrains", "ADR-0002", "--constrains", "D-021,D-000")
assert "Constrains: D-021, D-000" in next((root / "adr").glob("0002-*.md")).read_text()
a1 = next((root / "adr").glob("0001-*.md")).read_text()
a2 = next((root / "adr").glob("0002-*.md")).read_text()
assert "Status: superseded" in a1 and "Superseded by: ADR-0002" in a1, a1
assert "Supersedes: ADR-0001" in a2, a2
run("adr", "accept", "ADR-0002")
ctx = (d / "CONTEXT.md").read_text()
assert "| job identity | key vs row id | D-030 |" in ctx and "- scheduling" in ctx and "CTX-F01" in ctx and "Given a job committed step 1" in ctx

# evidence
run("evidence", "D-010", "--kind", "test", "--ref", "spec/job.test.ts:12", "--result", "pass")
assert "D-010 ✓ postgres" in (d / "DESIGN.md").read_text()

# collapsed leaf: realization derived from body tags
run("new", "D-021")
for f, v in (("gloss", "choose the next step"), ("effect", "Next step is chosen from the job spec."), ("pre", "job active"), ("post", "step chosen")):
    run("set", "D-021", f, v)
wrapped = """pick_step(job):
  rows <- SELECT step FROM job_steps
          WHERE key = job.key
          ORDER BY seq ASC                -- ⇒ postgres: SELECT ... ORDER BY -- read the declared steps in order
  -> rows[job.done]                       -- ⇒ typescript: index access -- take the one after the last done step
"""
run("body", "D-021", stdin=wrapped)
import stepwise as _sw
_b = json.loads((d / "ledger.json").read_text())["nodes"]["D-021"]["body"]
assert len(_b) == 2 and "ORDER BY seq ASC" in _b[0]["code"], _b
run("body", "D-021", stdin="pick_step(job):\n  steps <- job.spec.steps   -- ⇒ typescript: property access -- read the declared step list\n  -> steps[job.done]        -- ⇒ typescript: index access -- take the one after the last done step\n")
run("set", "D-021", "walkthrough", "Indexes the step list of the spec by how many steps are done.")
run("set", "D-021", "composition", "pure lookup")
run("approve", "D-021")
assert "Collapsed leaf. Targets: `typescript`" in (d / "nodes" / "D-021.md").read_text()
v21 = (d / "nodes" / "D-021.md").read_text()
assert "- typescript: property access — read the declared step list" in v21, v21
v0 = (d / "nodes" / "D-000.md").read_text()
assert "What it does:" in v0 and "- D-010 — create or load the job row" in v0, v0

# a body rewrite drops a child -> the orphan is retired, never called back to life
run("new", "D-022")
run("set", "D-022", "gloss", "wait for the step to settle")
run("reopen", "D-020", "wait_for folded into pick_step")
t = run("body", "D-020", stdin="advance(job):\n  step <- pick_step(job)   -- ↗ D-021\n", ok=False)
assert "lost every caller" in t and "D-022" in t, t
run("set", "D-020", "depends", "D-022")  # a durable entry point started, not called, is nobody's orphan
assert "lost every caller" not in run("check")
run("set", "D-020", "depends", "-", ok=False)  # orphan error is back
run("retire", "D-021", "still called", ok=False)
run("retire", "D-022", "wait_for folded into pick_step")
before = ledger()
t = run("set", "D-022", "gloss", "rewrite retired history", ok=False)
assert "is retired" in t and ledger() == before
t = run("set", "D-022", '{"composition":["rewrite retired history"]}', ok=False)
assert "is retired" in t and "`reopen D-022" in t and ledger() == before
run("approve", "D-020")
run("check")
assert "retired" in (d / "nodes" / "D-022.md").read_text()

# a changed contract travels the graph; a body-only revision does not
run("reopen", "D-021", "reword the body", ok=False)  # D-020 reuses it: red until re-approved
run("body", "D-021", ok=False, stdin="pick_step(job):\n  done <- job.stepsDone   -- ⇒ typescript: property access -- read the counter\n  -> job.spec.steps[done]  -- ⇒ typescript: index -- take the step at that position\n")
run("approve", "D-021")
assert json.loads((d / "ledger.json").read_text())["nodes"]["D-020"]["design"] == "approved"
run("reopen", "D-021", "the step index now starts at one", ok=False)
run("set", "D-021", "contract", "Post: returns the step at stepsDone + 1.", ok=False)
t = run("approve", "D-021", ok=False)  # red until every stalled caller is re-approved
assert "contract changed, now stale: D-000, D-020" in t, t  # travels past the direct caller
assert "D-021 (contract changed" in (d / "nodes" / "D-020.md").read_text()
run("reopen", "D-020", "follow the new step index", ok=False)
run("approve", "D-020", ok=False)
run("reopen", "D-000", "its child moved with the step index", ok=False)
run("approve", "D-000")

# supersede + views drift + log
run("new", "D-030")
t = run("supersede", "D-030", "D-021", "folded into advance", ok=False)
assert "constrains D-030 which is superseded by D-021" in t  # ADR must be re-pointed by hand
assert "now stale: D-000" in t, t  # the caller rests on a dead contract
assert "invalidated by D-030 (superseded" in (d / "nodes" / "D-000.md").read_text()
assert "superseded by D-021" in (d / "DESIGN.md").read_text()
before = ledger()
t = run("set", "D-030", '{"depends":["D-021"]}', ok=False)
assert "historical content cannot be edited" in t and ledger() == before
t = run("check", ok=False)
assert "D-000: calls D-030 which is superseded by D-021" in t
run("reopen", "D-000", "record the outcome through D-021", ok=False)
run("body", "D-000", ok=False, stdin=body.replace("-> finish(job)", "-> finish(job)                                  -- ↗ D-021"))
run("approve", "D-000", ok=False)  # ADR-0001 still constrains the superseded D-030
adr = next((root / "adr").glob("0001-*.md"))
adr.write_text(adr.read_text().replace("D-010, D-030", "D-010, D-021"))
run("sync")
p = d / "nodes" / "D-000.md"
p.write_text(p.read_text() + "hand edit\n")
assert "generated view edited" in run("check", ok=False)
run("sync")
assert "hand edit" not in p.read_text()
assert (d / ".stepwise.log").read_text().count("\n") > 20
shutil.rmtree(root.parent)
print("ok")
