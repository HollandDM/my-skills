#!/usr/bin/env python3
"""Regression checks for failures observed in the bbox-acquisition run."""

import io
import json
import sys
import tempfile
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import stepwise as sw  # noqa: E402

assert sw.compact_errors([
    "0001-a.md: constrains D-000 which is stale",
    "0002-b.md: constrains D-000 which is stale",
]) == ["2 ADRs are blocked by D-000; run `repair` for dependency order"]


def invoke(design: Path, *args: str, stdin: str = "") -> tuple[int, str]:
    out, err = io.StringIO(), io.StringIO()
    sys.stdin = io.StringIO(stdin)
    with redirect_stdout(out), redirect_stderr(err):
        rc = sw.main(["stepwise.py", args[0], str(design), *args[1:]])
    return rc, out.getvalue() + err.getvalue()


root = Path(tempfile.mkdtemp()) / "docs"
design = root / "design" / "repairable"

rejected = root / "design" / "rejected"
rc, text = invoke(rejected, "new", "D-000", "not a callable statement")
assert rc == 1 and "has no call" in text, text
assert not (rejected / "ledger.json").exists()

assert invoke(design, "new", "D-000", "result <- run_job(key)")[0] == 0
assert invoke(design, "set", "D-000", "gloss", "run one job")[0] == 0
assert invoke(design, "set", "D-000", "effect", "The job reaches one result.")[0] == 0
assert invoke(design, "set", "D-000", "pre", "The key is valid.")[0] == 0
assert invoke(design, "set", "D-000", "post", "The result is returned.")[0] == 0

rc, text = invoke(design, "body", "D-000", stdin="run_job(key):\n  -> finish(key)\n")
assert rc == 0, text
assert "APPLIED-WITH-ERRORS" in text, text
assert json.loads((design / "ledger.json").read_text())["nodes"]["D-000"]["body"]

last_log = (design / ".stepwise.log").read_text().splitlines()[-1]
assert all(part in last_log for part in ("result=applied", "applied=true", "before=", "after=", "body=", "errors=", "untagged call")), last_log


verified = root / "design" / "verified"
for args in (
    ("new", "D-000", "result <- store(key)"),
    ("set", "D-000", "gloss", "store one result"),
    ("set", "D-000", "effect", "The result is stored in durable state."),
    ("set", "D-000", "pre", "The key is valid."),
    ("set", "D-000", "post", "The result is stored once."),
    ("terminal", "D-000", "postgres: INSERT ON CONFLICT"),
    ("set", "D-000", "adaptation", "Pre: validated key", "Post: unique index"),
):
    assert invoke(verified, *args)[0] == 0

rc, text = invoke(verified, "approve", "D-000")
assert rc == 1 and "approval actor missing" in text and "proposal hash missing" in text, text
assert json.loads((verified / "ledger.json").read_text())["nodes"]["D-000"]["design"] == "draft"
rejected_log = (verified / ".stepwise.log").read_text().splitlines()[-1]
assert "applied=false" in rejected_log and "approval actor missing" in rejected_log, rejected_log

rc, text = invoke(verified, "proposal", "D-000")
assert rc == 0, text
proposal = text.strip().split()[-1]
rc, text = invoke(verified, "approve", "D-000", "--actor", "user:owner", "--proposal-hash", "wrong")
assert rc == 1 and proposal in text, text
assert invoke(verified, "approve", "D-000", "--actor", "user:owner", "--proposal-hash", proposal)[0] == 0

rc, text = invoke(verified, "set", "D-000", "adaptation", "Pre: validated key", "Post: unique constraint")
assert rc == 1 and "before changing approved proposal content" in text, text
assert json.loads((verified / "ledger.json").read_text())["nodes"]["D-000"]["design"] == "approved"
assert invoke(verified, "reopen", "D-000", "tighten the post adaptation")[0] == 0
assert invoke(verified, "set", "D-000", "adaptation", "Pre: validated key", "Post: unique constraint")[0] == 0
rc, text = invoke(verified, "approve", "D-000", "--actor", "user:owner", "--proposal-hash", proposal)
assert rc == 1 and "does not match current proposal" in text, text
rc, text = invoke(verified, "proposal", "D-000")
proposal = text.strip().split()[-1]
assert invoke(verified, "approve", "D-000", "--actor", "user:owner", "--proposal-hash", proposal)[0] == 0

rc, text = invoke(verified, "evidence", "D-000", "--kind", "test", "--ref", "StoreSpec", "--result", "pass")
assert rc == 1 and "--covers" in text, text
assert invoke(verified, "evidence", "D-000", "--kind", "test", "--ref", "StoreSpec#pre", "--result", "pass", "--covers", "pre")[0] == 0
node = json.loads((verified / "ledger.json").read_text())["nodes"]["D-000"]
assert node["verification"] == "partial" and node["realization"] == "not-started", node

assert invoke(verified, "set", "D-000", "realization", "implemented")[0] == 0
assert invoke(verified, "evidence", "D-000", "--kind", "review", "--ref", "review-1", "--result", "fail", "--covers", "post")[0] == 0
assert json.loads((verified / "ledger.json").read_text())["nodes"]["D-000"]["verification"] == "stale"
assert invoke(verified, "evidence", "D-000", "--kind", "test", "--ref", "StoreSpec#post", "--result", "pass", "--covers", "post")[0] == 0
assert json.loads((verified / "ledger.json").read_text())["nodes"]["D-000"]["verification"] == "stale"
assert invoke(verified, "evidence", "D-000", "--kind", "review", "--ref", "review-2", "--result", "pass", "--covers", "post", "--resolves", "EV-2")[0] == 0
node = json.loads((verified / "ledger.json").read_text())["nodes"]["D-000"]
assert node["verification"] == "verified", node

rc, text = invoke(verified, "set", "D-000", "verification", "verified")
assert rc == 1 and "cannot be set directly" in text, text
node_view = (verified / "nodes" / "D-000.md").read_text()
assert "Covers: post" in node_view and "Resolves: EV-2" in node_view, node_view
rc, text = invoke(verified, "check")
assert rc == 0 and "complete stateful design has no scenarios" in text, text


def configure_node(design: Path, node_id: str, body: str | None = None) -> None:
    payload = json.dumps({
        "gloss": f"run {node_id}",
        "effect": f"{node_id} returns one result.",
        "contract": {
            "pre": "The input is valid.",
            "post": "The result is returned."
        }
    })
    assert invoke(design, "set", node_id, payload)[0] == 0
    if body is None:
        assert invoke(design, "terminal", node_id, "ts: Array.from")[0] == 0
        assert invoke(design, "set", node_id, "adaptation", "Pre: validated input", "Post: Array.from returns the result")[0] == 0
    else:
        assert invoke(design, "body", node_id, stdin=body)[0] == 0
        assert invoke(design, "set", node_id, json.dumps({
            "walkthrough": [f"{node_id} delegates to one child."],
            "composition": ["Data flow: the child result becomes the node result."]
        }))[0] == 0
    node = json.loads((design / "ledger.json").read_text())["nodes"][node_id]
    assert invoke(
        design,
        "approve",
        node_id,
        "--actor",
        "user:test",
        "--proposal-hash",
        sw.proposal_hash(node)
    )[0] == 0


# Superseded node bodies are historical records. Their children may also be
# superseded without forcing an impossible edit to the already-closed parent.
historical = root / "design" / "historical-supersession"
assert invoke(historical, "new", "D-000", "result <- run_root()")[0] == 0
configure_node(historical, "D-000", "result <- run_old() -- D-010: run the old branch")
assert invoke(historical, "new", "D-010")[0] == 0
configure_node(
    historical,
    "D-010",
    "value <- run_old_child() -- D-020: run the old child\n"
    "unused <- run_unbuilt_child() -- D-050: leave one historical child unbuilt"
)
assert invoke(historical, "new", "D-020")[0] == 0
configure_node(historical, "D-020")

assert invoke(historical, "reopen", "D-000", "replace the old branch")[0] == 0
assert invoke(historical, "body", "D-000", stdin="result <- run_new() -- D-030: run the replacement branch")[0] == 0
root_node = json.loads((historical / "ledger.json").read_text())["nodes"]["D-000"]
assert invoke(
    historical,
    "approve",
    "D-000",
    "--actor",
    "user:test",
    "--proposal-hash",
    sw.proposal_hash(root_node)
)[0] == 0
assert invoke(historical, "new", "D-030")[0] == 0
configure_node(historical, "D-030", "value <- run_new_child() -- D-040: run the replacement child")
assert invoke(historical, "new", "D-040")[0] == 0
configure_node(historical, "D-040")

assert invoke(historical, "supersede", "D-010", "D-030", "replace old branch")[0] == 0
assert invoke(historical, "supersede", "D-020", "D-040", "replace old child")[0] == 0
rc, text = invoke(historical, "check")
assert rc == 0, text
rc, text = invoke(historical, "frontier")
assert rc == 0 and "D-050" not in text, text

print("ok")
