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
run("set", "D-000", "gloss", "run one job to a durable outcome")
run("set", "D-000", "effect", "Job runs once per ?job-key and ends in a durable outcome.")
run("set", "D-000", "pre", "?job-key is caller-supplied")
run("set", "D-000", "post", "outcome recorded once")
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
  job <- establish_job(key, spec)                 -- D-010
  { job durable }
  loop until done(job):
    job <- advance(job)                           -- D-020
  -> finish(job)
"""
t = run("body", "D-000", stdin=body, ok=False)
assert "D-010" in t and "D-020" in t and "untagged call '-> finish(job)'" in t
t = run("approve", "D-000", ok=False)
assert "untagged call '-> finish(job)'" in t and "composition missing" in t
run("body", "D-000", stdin=body.replace("-> finish(job)", "-> finish(job)                                  -- D-030"))
run("set", "D-000", "composition", "Data flow: key -> job -> outcome", "Failures: each child owns its retry")
run("set", "D-000", "decisions", "one job per key")
t = run("approve", "D-000")
assert "approved D-000" in t and "next: `new <dir> D-010`" in t
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
run("set", "D-010", "adaptation", "establish -> INSERT ON CONFLICT")
run("approve", "D-010")
design = (d / "DESIGN.md").read_text()
assert "D-010 ⇒ postgres: INSERT ... ON CONFLICT (key) DO NOTHING" in design, design
assert "D-020 (frontier)" in design and "D-030 (frontier)" in design
assert "-- D-000" in design.splitlines()[[i for i, l in enumerate(design.splitlines()) if l.startswith("run_job(")][0]]

# reuse + procedures
run("new", "D-020")
for f, v in (("gloss", "one step"), ("effect", "Job advances one durable step."), ("pre", "job active"), ("post", "job advanced")):
    run("set", "D-020", f, v)
run("body", "D-020", stdin="advance(job):\n  step <- pick_step(job)   -- D-021\n  job <- establish_job(job.key, job.spec)   -- ↗ D-010\n")
run("set", "D-020", "composition", "pick then re-establish")
run("approve", "D-020")
design = (d / "DESIGN.md").read_text()
assert design.count("D-010 ⇒ postgres") == 2 and "↗" not in design, design  # terminal reused: target shown at both call sites, no procedure block

# reopen / body-changed guard / re-approve
run("body", "D-020", stdin="x", ok=False)
run("reopen", "D-020", "user wants a pause step")
assert "## Superseded refinement" in (d / "nodes" / "D-020.md").read_text() and "↗ D-010" in (d / "nodes" / "D-020.md").read_text()
run("body", "D-020", stdin="advance(job):\n  step <- pick_step(job)   -- D-021\n  wait_for(step)   -- D-022\n")
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
run("check", ok=True)
run("approve", "D-000")
run("approve", "D-010")

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
run("body", "D-021", stdin="pick_step(job):\n  steps <- job.spec.steps   -- ⇒ typescript: property access\n  -> steps[job.done]        -- ⇒ typescript: index access\n")
run("set", "D-021", "composition", "pure lookup")
run("approve", "D-021")
assert "Collapsed leaf. Targets: `typescript`" in (d / "nodes" / "D-021.md").read_text()

# supersede + views drift + log
run("new", "D-030")
t = run("supersede", "D-030", "D-021", "folded into advance", ok=False)
assert "constrains D-030 which is superseded by D-021" in t  # ADR must be re-pointed by hand
assert "superseded by D-021" in (d / "DESIGN.md").read_text()
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
