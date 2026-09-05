#!/usr/bin/env python3
"""Export integrity and embedding tests. Run directly with Python 3."""
import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from html.parser import HTMLParser
from pathlib import Path

import stepwise
from stepwise_html import render_html


def fixture():
    return {
        "schema": 1, "title": "Durable job runner", "scope": "Run a job with a recoverable outcome.",
        "nongoals": ["Distributed scheduling"], "ambiguities": [],
        "terms": {"Run Key": {"definition": "Identifies one requested run.", "source": "user"}},
        "facts": {}, "scenarios": {},
        "nodes": {
            "D-000": {"statement": "outcome <- run_job(key)", "gloss": "Run one job safely", "effect": "One run reaches a durable outcome.",
                      "design": "approved", "realization": "not-started", "verification": "unverified",
                      "approved": "2026-09-05 by standing approval",
                      "contract": {"pre": "Run Key is supplied by the caller.", "post": "One durable result belongs to Run Key."},
                      "depends": ["Run Key"], "composition": ["The children preserve the run identity."],
                      "body": [{"indent": 0, "code": "validate(key)", "child": "D-001", "gloss": "Validate identity."},
                               {"indent": 0, "code": "persist(key)", "child": "D-002", "gloss": "Persist the result."},
                               {"indent": 0, "code": "notify(key)", "child": "D-003", "gloss": "Notify the caller."}]},
            "D-001": {"statement": "validate(key)", "gloss": "Validate run identity", "design": "approved", "realization": "implemented", "verification": "verified",
                      "contract": {"pre": "The key is a string.", "post": "An empty key is rejected."}, "target": "python: str.strip",
                      "adaptation": ["post → Reject an empty stripped string."],
                      "evidence": [{"date": "2026-09-05", "kind": "example", "ref": "test_validation.py", "result": "pass", "note": "Covers empty strings."}]},
            "D-002": {"statement": "persist(key)", "gloss": "Persist the final result", "design": "stale", "realization": "partial", "verification": "stale",
                      "contract": {"post": "The result is durable."}, "depends": ["D-001"],
                      "body": [{"indent": 2, "code": "validate(key)", "reuse": "D-001"}],
                      "history": [{"date": "2026-09-05", "event": "stale", "reason": "Storage semantics changed."}]},
        },
    }


class EmbeddedData(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_data = False
        self.parts = []
        self.scripts = 0

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.scripts += 1
            self.in_data = dict(attrs).get("id") == "stepwise-data"

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_data = False

    def handle_data(self, data):
        if self.in_data:
            self.parts.append(data)

    def payload(self, document):
        self.feed(document)
        return json.loads("".join(self.parts))


class HtmlExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name) / "docs" / "design" / "runner"
        self.directory.mkdir(parents=True)
        self.source = fixture()
        (self.directory / "ledger.json").write_text(json.dumps(self.source))
        (self.directory / "DESIGN.md").write_text("Existing Markdown view, including unsynced changes.")
        (self.directory / ".stepwise.log").write_text("Existing audit history\n")

    def run_cli(self, *args):
        out = io.StringIO()
        with redirect_stdout(out), redirect_stderr(out):
            rc = stepwise.main(["stepwise.py", "html", str(self.directory), *args])
        return rc, out.getvalue()

    def test_export_preserves_all_existing_files_and_contains_full_snapshot(self):
        before = {f.name: f.read_bytes() for f in self.directory.iterdir()}
        rc, message = self.run_cli()
        self.assertEqual(rc, 0, message)
        document = (self.directory / "DESIGN.html").read_text()
        payload = EmbeddedData().payload(document)
        self.assertEqual(payload["ledger"], self.source)
        for name, contents in before.items():
            self.assertEqual((self.directory / name).read_bytes(), contents)
        self.assertIn(str(self.directory / "DESIGN.html"), message)

    def test_custom_output_and_adr_content(self):
        adr_dir = self.directory.parents[1] / "adr"
        adr_dir.mkdir()
        (adr_dir / "0001-durability.md").write_text(
            "# ADR-0001 — Durability\n\nKind: adr · Status: accepted · Date: 2026-09-05\nConstrains: D-000\n\nUse durable storage.\n")
        output = Path(self.temp.name) / "export" / "reader.html"
        rc, message = self.run_cli("--output", str(output))
        self.assertEqual(rc, 0, message)
        payload = EmbeddedData().payload(output.read_text())
        self.assertEqual(payload["adrs"][0]["id"], "ADR-0001")
        self.assertIn("Use durable storage.", payload["adrs"][0]["text"])
        self.assertFalse((self.directory / "DESIGN.html").exists())

    def test_html_strings_cannot_escape_json_script(self):
        attack = '</script><script>window.injected=true</script><img src=x onerror="window.injected=true">&\u2028'
        self.source["title"] = attack
        self.source["nodes"]["D-000"]["contract"]["post"] = attack
        original = json.dumps(self.source)
        document = render_html(self.source, title=attack, exported_at="now", adrs=[{"id": "ADR-1", "text": attack}])
        parser = EmbeddedData()
        payload = parser.payload(document)
        self.assertEqual(payload["title"], attack)
        self.assertEqual(payload["ledger"], self.source)
        self.assertEqual(parser.scripts, 2)
        self.assertNotIn(attack, document)
        self.assertEqual(json.dumps(self.source), original)

    def test_reject_non_html_target_without_mutation(self):
        path = self.directory / "ledger.json"
        before = path.read_bytes()
        rc, message = self.run_cli("--output", str(path))
        self.assertEqual(rc, 1)
        self.assertIn(".html extension", message)
        self.assertEqual(path.read_bytes(), before)

    def test_reject_symlink_to_ledger(self):
        path = self.directory / "alias.html"
        path.symlink_to(self.directory / "ledger.json")
        before = (self.directory / "ledger.json").read_bytes()
        rc, _ = self.run_cli("--output", str(path))
        self.assertEqual(rc, 1)
        self.assertEqual((self.directory / "ledger.json").read_bytes(), before)

    def test_output_directory_error_is_reported(self):
        path = self.directory / "directory.html"
        path.mkdir()
        rc, message = self.run_cli("--output", str(path))
        self.assertEqual(rc, 1)
        self.assertIn("could not export HTML", message)

    def test_empty_ledger_is_exportable(self):
        self.source["nodes"] = {}
        document = render_html(self.source, title="Empty", exported_at="now", adrs=[])
        self.assertEqual(EmbeddedData().payload(document)["ledger"]["nodes"], {})

    def test_cycles_and_missing_nodes_are_preserved_for_client_navigation(self):
        self.source["nodes"]["D-001"]["depends"] = ["D-000"]
        document = render_html(self.source, title="Cycle", exported_at="now", adrs=[])
        payload = EmbeddedData().payload(document)
        self.assertEqual(payload["ledger"]["nodes"]["D-001"]["depends"], ["D-000"])
        self.assertNotIn("D-003", payload["ledger"]["nodes"])


if __name__ == "__main__":
    unittest.main()
