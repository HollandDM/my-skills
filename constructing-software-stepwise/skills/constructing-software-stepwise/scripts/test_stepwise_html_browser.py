#!/usr/bin/env python3
"""Optional browser integration tests; see references/html-view.md for setup."""
import os
import shutil
import tempfile
import unittest
from pathlib import Path

from stepwise_html import render_html
from test_stepwise_html import fixture


class HtmlBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise unittest.SkipTest("Install Playwright to run browser integration tests")
        cls.playwright = sync_playwright().start()
        executable = os.environ.get("STEPWISE_CHROMIUM") or shutil.which("chromium") or shutil.which("google-chrome")
        try:
            cls.browser = cls.playwright.chromium.launch(executable_path=executable, headless=True)
        except Exception:
            cls.playwright.stop()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.page = self.browser.new_page(viewport={"width": 1600, "height": 1000})
        self.addCleanup(self.page.close)
        self.errors = []
        self.requests = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("request", lambda request: self.requests.append(request.url))

    def open(self, data=None):
        path = Path(self.temp.name) / "reader.html"
        path.write_text(render_html(data if data is not None else fixture(), title="Durable job runner", exported_at="2026-09-05", adrs=[]))
        self.page.goto(path.as_uri())
        self.page.wait_for_function("document.querySelector('#reader h2') !== null")

    def map_view(self):
        self.page.get_by_role("tab", name="Design map", exact=True).click()

    def read_view(self):
        self.page.get_by_role("tab", name="Read design", exact=True).click()

    def selected(self, node):
        self.page.wait_for_function("id => document.querySelector('#reader .node-heading .mono')?.textContent === id", arg=node)

    def tearDown(self):
        self.assertEqual(self.errors, [])
        self.assertFalse([url for url in self.requests if not url.startswith("file:")], self.requests)

    def test_navigation_through_tree_code_chart_and_history(self):
        self.open()
        self.selected("D-000")
        self.page.locator('#tree a[href="#D-001"]').first.click()
        self.selected("D-001")
        self.map_view()
        self.page.locator('#graph g[data-node-id="D-002"]').click()
        self.selected("D-002")
        self.page.get_by_role("button", name="Read selected node").click()
        self.assertIn("Stale", self.page.locator("#reader .notice").first.inner_text())
        self.page.get_by_role("tab", name="Pseudocode", exact=True).click()
        self.page.locator('#reader .code-ref[href="#D-001"]').click()
        self.selected("D-002")
        self.assertEqual(self.page.locator('[data-procedure="D-001"]').evaluate('e => e === document.activeElement'), True)
        self.page.locator('#tree a[href="#D-001"]').first.click()
        self.selected("D-001")
        self.page.go_back()
        self.selected("D-002")
        self.page.get_by_role("tab", name="Evidence & history").click()
        self.assertIn("Storage semantics changed.", self.page.locator("#detail-content").inner_text())
        self.page.get_by_role("tab", name="Context", exact=True).click()
        self.assertIn("Identifies one requested run.", self.page.locator("#detail-content").inner_text())

    def test_search_collapse_and_frontier(self):
        self.open()
        self.page.get_by_role("button", name="Collapse all", exact=True).click()
        self.assertEqual(self.page.locator("#tree .tree-row").count(), 1)
        self.page.get_by_role("button", name="Expand all", exact=True).click()
        self.assertGreaterEqual(self.page.locator("#tree .tree-row").count(), 4)
        self.page.locator("#search").fill("empty key")
        self.assertEqual(self.page.locator("#node-count").inner_text(), "1 matches")
        self.assertEqual(self.page.locator('#tree a[href="#D-003"]').count(), 0)
        self.page.locator("#search").fill("no-such-operation")
        self.assertIn("No matching nodes", self.page.locator("#tree").inner_text())
        self.page.get_by_role("button", name="Clear search").click()
        self.page.locator('#tree a[href="#D-003"]').click()
        self.selected("D-003")
        self.assertIn("No contract has been recorded yet", self.page.locator("#reader").inner_text())
        self.assertEqual(self.page.locator("#reader .badge").first.inner_text(), "frontier")

    def test_zoom_keyboard_tabs_and_mobile(self):
        self.open()
        self.map_view()
        self.assertGreater(self.page.locator("#graph-viewport").bounding_box()["width"], 1200)
        self.assertFalse(self.page.locator("#reader").is_visible())
        before = self.page.locator("#zoom-label").inner_text()
        self.page.get_by_role("button", name="Zoom in", exact=True).click()
        self.assertNotEqual(before, self.page.locator("#zoom-label").inner_text())
        self.page.get_by_role("button", name="Fit", exact=True).click()
        self.page.get_by_role("button", name="Focus selected").click()
        self.read_view()
        self.page.get_by_role("tab", name="Contract").focus()
        self.page.keyboard.press("ArrowRight")
        self.assertEqual(self.page.get_by_role("tab", name="Pseudocode", exact=True).get_attribute("aria-selected"), "true")
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.map_view()
        self.assertTrue(self.page.locator("#graph-viewport").is_visible())
        self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        self.read_view()
        self.page.get_by_role("button", name="Outline", exact=True).click()
        self.assertFalse(self.page.locator("#outline").is_visible())
        self.page.get_by_role("button", name="Outline", exact=True).click()
        self.assertTrue(self.page.locator("#outline").is_visible())

    def test_untrusted_content_renders_as_text_without_execution(self):
        data = fixture()
        attack = '</script><img src=x onerror="window.injected=true"><script>window.injected=true</script>'
        data["nodes"]["D-000"]["contract"]["post"] = attack
        self.open(data)
        self.assertIn(attack, self.page.locator("#detail-content").inner_text())
        self.assertEqual(self.page.locator("#reader img").count(), 0)
        self.assertIsNone(self.page.evaluate("window.injected"))

    def test_cycle_shared_reference_and_direct_link(self):
        data = fixture()
        data["nodes"]["D-001"]["depends"] = ["D-000", "D-001"]
        self.open(data)
        self.assertEqual(self.page.locator("#graph .graph-node").count(), 4)
        self.page.get_by_role("button", name="Expand all", exact=True).click()
        self.assertLess(self.page.locator("#tree .tree-row").count(), 12)
        self.page.goto(self.page.url.split("#")[0] + "#D-001")
        self.selected("D-001")
        self.page.reload()
        self.selected("D-001")
        self.map_view()
        self.page.locator('#graph g[data-node-id="D-000"]').focus()
        self.page.keyboard.press("Enter")
        self.selected("D-000")

    def test_draft_and_historical_states_remain_distinct(self):
        data = fixture()
        data["nodes"]["D-000"]["design"] = "draft"
        data["nodes"]["D-001"]["design"] = "retired"
        data["nodes"]["D-002"]["design"] = "superseded"
        data["nodes"]["D-002"]["superseded_by"] = "D-001"
        self.open(data)
        self.map_view()
        for node, status in [("D-000", "draft"), ("D-001", "retired"), ("D-002", "superseded"), ("D-003", "unresolved")]:
            self.page.locator(f'#graph g[data-node-id="{node}"]').click()
            self.selected(node)
            self.assertEqual(self.page.locator("#reader .badge").first.inner_text(), status)
        self.page.locator('#graph g[data-node-id="D-002"]').click()
        self.selected("D-002")
        self.read_view()
        self.page.locator("#reader section").filter(has=self.page.get_by_role("heading", name="Replacement", exact=True)).get_by_role("link", name="D-001").click()
        self.selected("D-001")

    def test_review_filters_baseline_and_changed_fields(self):
        self.open()
        self.page.locator("#review-filter").select_option("stale")
        self.assertEqual(self.page.locator("#node-count").inner_text(), "1 matches")
        self.page.locator("#review-filter").select_option("agent")
        self.assertEqual(self.page.locator("#node-count").inner_text(), "1 matches")
        self.page.locator("#review-filter").select_option("all")
        self.page.get_by_role("button", name="Mark all reviewed").click()
        self.page.locator("#review-filter").select_option("changed")
        self.assertEqual(self.page.locator("#node-count").inner_text(), "0 matches")
        self.page.get_by_role("tab", name="Changes", exact=True).click()
        self.assertIn("No changes since your last review", self.page.locator("#detail-content").inner_text())
        changed = fixture()
        changed["nodes"]["D-000"]["contract"]["post"] = "One result is persisted before notification."
        self.open(changed)
        self.page.locator("#review-filter").select_option("changed")
        self.assertEqual(self.page.locator("#node-count").inner_text(), "1 matches")
        self.page.get_by_role("tab", name="Changes", exact=True).click()
        self.assertIn("contract.post", self.page.locator("#detail-content").inner_text())
        self.page.locator("#detail-content summary").filter(has_text="contract.post").click()
        self.assertIn("One result is persisted before notification.", self.page.locator("#detail-content").inner_text())
        with self.page.expect_download() as download:
            self.page.get_by_role("button", name="Save review file").click()
        self.assertEqual(download.value.suggested_filename, "stepwise-review.json")

    def test_explicit_state_and_sequence_charts(self):
        data = fixture()
        data["nodes"]["D-000"]["behavior"] = {
            "states": [{"id":"queued","label":"Queued","initial":True},{"id":"done","label":"Completed","terminal":True}],
            "transitions": [{"from":"queued","to":"done","event":"finish","guard":"durable"}],
            "participants": [{"id":"caller","label":"Caller"},{"id":"worker","label":"Worker","node":"D-001"}],
            "messages": [{"from":"caller","to":"worker","label":"Validate","node":"D-001"}, {"from":"worker","to":"caller","label":"Result","kind":"return"}]}
        self.open(data)
        self.map_view()
        self.page.locator("#chart-mode").select_option("states")
        self.assertIn("2 states", self.page.locator("#edge-count").inner_text())
        self.assertIn("finish [durable]", self.page.locator("#graph").text_content())
        self.page.locator("#chart-mode").select_option("sequence")
        self.assertIn("2 messages", self.page.locator("#edge-count").inner_text())
        self.page.locator('#graph text').filter(has_text="1. Validate").click()
        self.selected("D-001")
        self.assertIn("No interaction sequence recorded", self.page.locator("#graph").text_content())
        self.page.locator("#chart-mode").select_option("design")
        self.assertEqual(self.page.locator("#graph .graph-node").count(), 4)

    def test_observed_code_versions_and_drift_are_separate_from_intent(self):
        data = fixture()
        root = data["nodes"]["D-000"]
        root.update(origin="existing-code", design="draft", contract={}, body=[], approved="", effect="", source_state="stale",
                    bindings={"S01":{"path":"src/normalize.py","symbol":"normalize","baseline_sha256":"a"*64}},
                    current_implementation_version="b"*64, implementation_version="b"*64, implementation_revision=2,
                    conformance={"status":"unassessed","reason":"No intended contract is recorded."},
                    observed_children=["D-001"],
                    observation={"effect":"The inspected implementation strips whitespace.","revision":1,"date":"2026-09-05","by":"agent inspection",
                        "implementation_version":"a"*64,"claims":[{"text":"normalize calls str.strip.","basis":"observed","sources":["S01"]}],
                        "unknowns":["Non-string inputs are undocumented."],"body":[],
                        "behavior":{"states":[{"id":"start","label":"Input","initial":True},{"id":"done","label":"Result","terminal":True}],"transitions":[{"from":"start","to":"done","event":"strip"}]}},
                    source_report={"reason":"Bound sources changed.","implementation_version":"b"*64,"bindings":{}})
        self.open(data)
        self.assertEqual(self.page.get_by_role("tab",name="Observed code",exact=True).get_attribute("aria-selected"),"true")
        self.assertIn("a"*64,self.page.locator("#detail-content").inner_text())
        self.assertIn("b"*64,self.page.locator("#detail-content").inner_text())
        self.assertIn("No intended contract",self.page.locator("#detail-content").inner_text())
        self.page.locator("#review-filter").select_option("sources")
        self.assertEqual(self.page.locator("#node-count").inner_text(),"1 matches")
        self.page.get_by_role("tab",name="Contract").click()
        self.assertIn("No intended contract is recorded",self.page.locator("#detail-content").inner_text())
        self.map_view()
        self.assertEqual(self.page.locator("#chart-basis").input_value(),"observed")
        self.page.locator("#chart-mode").select_option("states")
        self.assertIn("strip",self.page.locator("#graph").text_content())
        self.assertIn("Source inspection: stale",self.page.locator(".chart-note").inner_text())
        self.page.locator("#chart-basis").select_option("intended")
        self.assertIn("No state model recorded",self.page.locator("#graph").text_content())

    def test_empty_design(self):
        data = fixture()
        data["nodes"] = {}
        self.open(data)
        self.assertEqual(self.page.locator("#reader h2").inner_text(), "Your design starts here")
        self.assertIn("No design nodes yet", self.page.locator("#graph").text_content())

    def test_reachable_procedures_are_separate_deduplicated_and_cycle_safe(self):
        data = fixture()
        data['nodes']['D-000']['body'] = [
            {'indent':0, 'code':'first <- validate(key)', 'child':'D-001'},
            {'indent':0, 'code':'second <- validate(key)', 'reuse':'D-001'}]
        child = data['nodes']['D-001']
        child.pop('target', None)
        child['body'] = [{'indent':0, 'code':'persist(key)', 'child':'D-002'}]
        self.open(data)
        self.assertEqual(self.page.locator('.algorithm-card').count(), 0)
        self.page.get_by_role('tab', name='Pseudocode', exact=True).click()
        self.assertEqual(self.page.locator('.algorithm-card').count(), 3)
        self.assertEqual(self.page.locator('.algorithm-card .algorithm-card').count(), 0)
        self.assertEqual(self.page.locator('.algorithm-title').filter(has_text='Algorithm D-001').count(), 1)
        self.assertEqual(self.page.locator('.algorithm-title').filter(has_text='Algorithm D-002').count(), 1)
        self.assertIn('first ← validate(key)', self.page.locator('[data-procedure="D-000"]').inner_text())
        self.assertIn('second ← validate(key)', self.page.locator('[data-procedure="D-000"]').inner_text())
        self.page.locator('[data-procedure="D-000"] .code-ref').first.click()
        self.selected('D-000')
        self.assertTrue(self.page.locator('[data-procedure="D-001"]').evaluate('e => e === document.activeElement'))
        self.page.get_by_label('Pseudocode source', exact=True).select_option('observed')
        self.assertEqual(self.page.locator('.algorithm-card').count(), 1)
        self.assertEqual(self.page.locator('.code-line').count(), 0)
        self.assertIn('No observed pseudocode', self.page.locator('#detail-content').inner_text())


if __name__ == "__main__":
    unittest.main()
