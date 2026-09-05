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
        self.page.locator('#graph g[data-node-id="D-002"]').click()
        self.selected("D-002")
        self.assertIn("Stale", self.page.locator("#reader .notice").first.inner_text())
        self.page.locator('#reader .code-ref[href="#D-001"]').click()
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
        before = self.page.locator("#zoom-label").inner_text()
        self.page.get_by_role("button", name="Zoom in", exact=True).click()
        self.assertNotEqual(before, self.page.locator("#zoom-label").inner_text())
        self.page.get_by_role("button", name="Fit", exact=True).click()
        self.page.get_by_role("button", name="Focus selected").click()
        self.page.get_by_role("tab", name="Contract & code").focus()
        self.page.keyboard.press("ArrowRight")
        self.assertEqual(self.page.get_by_role("tab", name="Context", exact=True).get_attribute("aria-selected"), "true")
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.assertTrue(self.page.locator("#graph-viewport").is_visible())
        self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
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
        for node, status in [("D-000", "draft"), ("D-001", "retired"), ("D-002", "superseded"), ("D-003", "unresolved")]:
            self.page.locator(f'#graph g[data-node-id="{node}"]').click()
            self.selected(node)
            self.assertEqual(self.page.locator("#reader .badge").first.inner_text(), status)
        self.page.locator('#graph g[data-node-id="D-002"]').click()
        self.selected("D-002")
        self.page.locator("#reader section").filter(has=self.page.get_by_role("heading", name="Replacement", exact=True)).get_by_role("link", name="D-001").click()
        self.selected("D-001")

    def test_empty_design(self):
        data = fixture()
        data["nodes"] = {}
        self.open(data)
        self.assertEqual(self.page.locator("#reader h2").inner_text(), "Your design starts here")
        self.assertIn("No design nodes yet", self.page.locator("#graph").text_content())


if __name__ == "__main__":
    unittest.main()
