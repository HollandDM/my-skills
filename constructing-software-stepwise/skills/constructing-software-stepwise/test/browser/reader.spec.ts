/** Browser integration tests for the single-file design reader. */
import { expect, test, type Page } from "@playwright/test"
import { fixture, writePage, type Ledger } from "./helpers.ts"

interface Harness {
  page: Page
  errors: string[]
  requests: string[]
  open: (data?: Ledger) => Promise<void>
  selected: (node: string) => Promise<void>
  mapView: () => Promise<void>
  readView: () => Promise<void>
}

const harness = test.extend<{ h: Harness }>({
  h: async ({ page }, use) => {
    const errors: string[] = []
    const requests: string[] = []
    page.on("pageerror", (error) => errors.push(String(error)))
    page.on("request", (request) => requests.push(request.url()))
    const h: Harness = {
      page,
      errors,
      requests,
      open: async (data) => {
        await page.goto(writePage(data ?? fixture()))
        await page.waitForFunction("document.querySelector('#reader h2') !== null")
      },
      selected: async (node) => {
        await page.waitForFunction((id) => document.querySelector("#reader .node-heading .mono")?.textContent === id, node)
      },
      mapView: async () => page.getByRole("tab", { name: "Design map", exact: true }).click(),
      readView: async () => page.getByRole("tab", { name: "Read design", exact: true }).click(),
    }
    await use(h)
    expect(errors).toEqual([])
    expect(requests.filter((url) => !url.startsWith("file:"))).toEqual([])
  },
})

harness("navigation through tree, code, chart, and history", async ({ h }) => {
  const { page } = h
  await h.open()
  await h.selected("D-000")
  expect(await page.title()).toBe("Durable job runner · Stepwise")
  await page.locator('#tree a[href="#D-001"]').first().click()
  await h.selected("D-001")
  await h.mapView()
  await page.locator('#graph g[data-node-id="D-002"]').click()
  await h.selected("D-002")
  await page.getByRole("button", { name: "Read selected node" }).click()
  expect(await page.locator("#reader .notice").first().innerText()).toContain("Stale")
  await page.getByRole("tab", { name: "Pseudocode", exact: true }).click()
  await page.locator('#reader .code-ref[href="#D-001"]').click()
  await h.selected("D-002")
  expect(await page.locator('[data-procedure="D-001"]').evaluate((e) => e === document.activeElement)).toBe(true)
  await page.locator('#tree a[href="#D-001"]').first().click()
  await h.selected("D-001")
  await page.goBack()
  await h.selected("D-002")
  await page.getByRole("tab", { name: "Evidence & history" }).click()
  expect(await page.locator("#detail-content").innerText()).toContain("Storage semantics changed.")
  await page.getByRole("tab", { name: "Context", exact: true }).click()
  expect(await page.locator("#detail-content").innerText()).toContain("Identifies one requested run.")
})

harness("search, collapse, and frontier", async ({ h }) => {
  const { page } = h
  await h.open()
  await page.getByRole("button", { name: "Collapse all", exact: true }).click()
  expect(await page.locator("#tree .tree-row").count()).toBe(1)
  await page.getByRole("button", { name: "Expand all", exact: true }).click()
  expect(await page.locator("#tree .tree-row").count()).toBeGreaterThanOrEqual(4)
  await page.locator("#search").fill("empty key")
  expect(await page.locator("#node-count").innerText()).toBe("1 matches")
  expect(await page.locator('#tree a[href="#D-003"]').count()).toBe(0)
  await page.locator("#search").fill("no-such-operation")
  expect(await page.locator("#tree").innerText()).toContain("No matching nodes")
  await page.getByRole("button", { name: "Clear search" }).click()
  await page.locator('#tree a[href="#D-003"]').click()
  await h.selected("D-003")
  expect(await page.locator("#reader").innerText()).toContain("No contract has been recorded yet")
  expect(await page.locator("#reader .badge").first().innerText()).toBe("frontier")
})

harness("zoom, keyboard tabs, and mobile", async ({ h }) => {
  const { page } = h
  await h.open()
  await h.mapView()
  expect((await page.locator("#graph-viewport").boundingBox())!.width).toBeGreaterThan(1200)
  expect(await page.locator("#reader").isVisible()).toBe(false)
  const before = await page.locator("#zoom-label").innerText()
  await page.getByRole("button", { name: "Zoom in", exact: true }).click()
  expect(await page.locator("#zoom-label").innerText()).not.toBe(before)
  await page.getByRole("button", { name: "Fit", exact: true }).click()
  await page.getByRole("button", { name: "Focus selected" }).click()
  await h.readView()
  await page.getByRole("tab", { name: "Contract" }).focus()
  await page.keyboard.press("ArrowRight")
  expect(await page.getByRole("tab", { name: "Pseudocode", exact: true }).getAttribute("aria-selected")).toBe("true")
  await page.setViewportSize({ width: 390, height: 844 })
  await h.mapView()
  expect(await page.locator("#graph-viewport").isVisible()).toBe(true)
  expect(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")).toBe(true)
  await h.readView()
  await page.getByRole("button", { name: "Outline", exact: true }).click()
  expect(await page.locator("#outline").isVisible()).toBe(false)
  await page.getByRole("button", { name: "Outline", exact: true }).click()
  expect(await page.locator("#outline").isVisible()).toBe(true)
})

harness("untrusted content renders as text without execution", async ({ h }) => {
  const { page } = h
  const data = fixture()
  const attack = '</script><img src=x onerror="window.injected=true"><script>window.injected=true</script>'
  data.nodes["D-000"].contract.post = attack
  await h.open(data)
  expect(await page.locator("#detail-content").innerText()).toContain(attack)
  expect(await page.locator("#reader img").count()).toBe(0)
  expect(await page.evaluate("window.injected")).toBeUndefined()
})

harness("cycle, shared reference, and direct link", async ({ h }) => {
  const { page } = h
  const data = fixture()
  data.nodes["D-001"].depends = ["D-000", "D-001"]
  await h.open(data)
  expect(await page.locator("#graph .graph-node").count()).toBe(4)
  await page.getByRole("button", { name: "Expand all", exact: true }).click()
  expect(await page.locator("#tree .tree-row").count()).toBeLessThan(12)
  await page.goto(page.url().split("#")[0] + "#D-001")
  await h.selected("D-001")
  await page.reload()
  await h.selected("D-001")
  await h.mapView()
  await page.locator('#graph g[data-node-id="D-000"]').focus()
  await page.keyboard.press("Enter")
  await h.selected("D-000")
})

harness("draft and historical states remain distinct", async ({ h }) => {
  const { page } = h
  const data = fixture()
  data.nodes["D-000"].design = "draft"
  data.nodes["D-001"].design = "retired"
  data.nodes["D-002"].design = "superseded"
  data.nodes["D-002"].superseded_by = "D-001"
  await h.open(data)
  await h.mapView()
  for (const [node, status] of [["D-000", "draft"], ["D-001", "retired"], ["D-002", "superseded"], ["D-003", "unresolved"]]) {
    await page.locator(`#graph g[data-node-id="${node}"]`).click()
    await h.selected(node)
    expect(await page.locator("#reader .badge").first().innerText()).toBe(status)
  }
  await page.locator('#graph g[data-node-id="D-002"]').click()
  await h.selected("D-002")
  await h.readView()
  await page
    .locator("#reader section")
    .filter({ has: page.getByRole("heading", { name: "Replacement", exact: true }) })
    .getByRole("link", { name: "D-001" })
    .click()
  await h.selected("D-001")
})

harness("review filters, baseline, and changed fields", async ({ h }) => {
  const { page } = h
  await h.open()
  await page.locator("#review-filter").selectOption("stale")
  expect(await page.locator("#node-count").innerText()).toBe("1 matches")
  await page.locator("#review-filter").selectOption("agent")
  expect(await page.locator("#node-count").innerText()).toBe("1 matches")
  await page.locator("#review-filter").selectOption("all")
  await page.getByRole("button", { name: "Mark all reviewed" }).click()
  await page.locator("#review-filter").selectOption("changed")
  expect(await page.locator("#node-count").innerText()).toBe("0 matches")
  await page.getByRole("tab", { name: "Changes", exact: true }).click()
  expect(await page.locator("#detail-content").innerText()).toContain("No changes since your last review")
  const changed = fixture()
  changed.nodes["D-000"].contract.post = "One result is persisted before notification."
  await h.open(changed)
  await page.locator("#review-filter").selectOption("changed")
  expect(await page.locator("#node-count").innerText()).toBe("1 matches")
  await page.getByRole("tab", { name: "Changes", exact: true }).click()
  expect(await page.locator("#detail-content").innerText()).toContain("contract.post")
  await page.locator("#detail-content summary").filter({ hasText: "contract.post" }).click()
  expect(await page.locator("#detail-content").innerText()).toContain("One result is persisted before notification.")
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Save review file" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("stepwise-review.json")
})

harness("evidence scope and withdrawal are visible", async ({ h }) => {
  const { page } = h
  const data = fixture()
  data.source_coverage = { active: 4, bound: 3, observed: 3, current: 2, unbound: ["D-003"], complete: false }
  data.nodes["D-000"].evidence = [
    {
      date: "2026-09-06", kind: "e2e", ref: "run-12", result: "pass", clauses: ["post"],
      scope: "implementation", scenario: "LOW effort run", assessment: "The run did not exercise review.",
      withdrawn: { date: "2026-09-06", by: "agent correction", reason: "The claimed review path did not run." },
    },
  ]
  await h.open(data)
  expect(await page.locator("#summary .stat").filter({ hasText: "source current" }).locator("strong").innerText()).toBe("2")
  await page.getByRole("tab", { name: "Evidence & history" }).click()
  const text = await page.locator("#detail-content").innerText()
  expect(text).toContain("e2e · withdrawn")
  expect(text).toContain("Scenario: LOW effort run")
  expect(text).toContain("The claimed review path did not run.")
})

harness("explicit state and sequence charts", async ({ h }) => {
  const { page } = h
  const data = fixture()
  data.nodes["D-000"].behavior = {
    states: [{ id: "queued", label: "Queued", initial: true }, { id: "done", label: "Completed", terminal: true }],
    transitions: [{ from: "queued", to: "done", event: "finish", guard: "durable" }],
    participants: [{ id: "caller", label: "Caller" }, { id: "worker", label: "Worker", node: "D-001" }],
    messages: [{ from: "caller", to: "worker", label: "Validate", node: "D-001" }, { from: "worker", to: "caller", label: "Result", kind: "return" }],
  }
  await h.open(data)
  await h.mapView()
  await page.locator("#chart-mode").selectOption("states")
  expect(await page.locator("#edge-count").innerText()).toContain("2 states")
  expect(await page.locator("#graph").textContent()).toContain("finish [durable]")
  await page.locator("#chart-mode").selectOption("sequence")
  expect(await page.locator("#edge-count").innerText()).toContain("2 messages")
  await page.locator("#graph text").filter({ hasText: "1. Validate" }).click()
  await h.selected("D-001")
  expect(await page.locator("#graph").textContent()).toContain("No interaction sequence recorded")
  await page.locator("#chart-mode").selectOption("design")
  expect(await page.locator("#graph .graph-node").count()).toBe(4)
})

harness("observed code versions and drift are separate from intent", async ({ h }) => {
  const { page } = h
  const data = fixture()
  const a = "a".repeat(64)
  const b = "b".repeat(64)
  Object.assign(data.nodes["D-000"], {
    origin: "existing-code", design: "draft", contract: {}, body: [], approved: "", effect: "", source_state: "stale",
    bindings: { S01: { path: "src/normalize.py", symbol: "normalize", baseline_sha256: a } },
    current_implementation_version: b, implementation_version: b, implementation_revision: 2,
    conformance: { status: "unassessed", reason: "No intended contract is recorded." },
    observed_children: ["D-001"],
    observation: {
      effect: "The inspected implementation strips whitespace.", revision: 1, date: "2026-09-05", by: "agent inspection",
      implementation_version: a, claims: [{ text: "normalize calls str.strip.", basis: "observed", sources: ["S01"] }],
      unknowns: ["Non-string inputs are undocumented."], body: [],
      behavior: {
        states: [{ id: "start", label: "Input", initial: true }, { id: "done", label: "Result", terminal: true }],
        transitions: [{ from: "start", to: "done", event: "strip" }],
      },
    },
    source_report: { reason: "Bound sources changed.", implementation_version: b, bindings: {} },
  })
  await h.open(data)
  expect(await page.getByRole("tab", { name: "Observed code", exact: true }).getAttribute("aria-selected")).toBe("true")
  const detail = await page.locator("#detail-content").innerText()
  expect(detail).toContain(a)
  expect(detail).toContain(b)
  expect(detail).toContain("No intended contract")
  await page.locator("#review-filter").selectOption("sources")
  expect(await page.locator("#node-count").innerText()).toBe("1 matches")
  await page.getByRole("tab", { name: "Contract" }).click()
  expect(await page.locator("#detail-content").innerText()).toContain("No intended contract is recorded")
  await h.mapView()
  expect(await page.locator("#chart-basis").inputValue()).toBe("observed")
  await page.locator("#chart-mode").selectOption("states")
  expect(await page.locator("#graph").textContent()).toContain("strip")
  expect(await page.locator(".chart-note").innerText()).toContain("Source inspection: stale")
  await page.locator("#chart-basis").selectOption("intended")
  expect(await page.locator("#graph").textContent()).toContain("No state model recorded")
})

harness("empty design", async ({ h }) => {
  const { page } = h
  const data = fixture()
  data.nodes = {}
  await h.open(data)
  expect(await page.locator("#reader h2").innerText()).toBe("Your design starts here")
  expect(await page.locator("#graph").textContent()).toContain("No design nodes yet")
})

harness("reachable procedures are separate, deduplicated, and cycle safe", async ({ h }) => {
  const { page } = h
  const data = fixture()
  data.nodes["D-000"].body = [
    { indent: 0, code: "first <- validate(key)", child: "D-001" },
    { indent: 0, code: "second <- validate(key)", reuse: "D-001" },
  ]
  const child = data.nodes["D-001"]
  delete child.target
  child.body = [{ indent: 0, code: "persist(key)", child: "D-002" }]
  await h.open(data)
  expect(await page.locator(".algorithm-card").count()).toBe(0)
  await page.getByRole("tab", { name: "Pseudocode", exact: true }).click()
  expect(await page.locator(".algorithm-card").count()).toBe(3)
  expect(await page.locator(".algorithm-card .algorithm-card").count()).toBe(0)
  expect(await page.locator(".algorithm-title").filter({ hasText: "Algorithm D-001" }).count()).toBe(1)
  expect(await page.locator(".algorithm-title").filter({ hasText: "Algorithm D-002" }).count()).toBe(1)
  const root = await page.locator('[data-procedure="D-000"]').innerText()
  expect(root).toContain("first ← validate(key)")
  expect(root).toContain("second ← validate(key)")
  await page.locator('[data-procedure="D-000"] .code-ref').first().click()
  await h.selected("D-000")
  expect(await page.locator('[data-procedure="D-001"]').evaluate((e) => e === document.activeElement)).toBe(true)
  await page.getByLabel("Pseudocode source", { exact: true }).selectOption("observed")
  expect(await page.locator(".algorithm-card").count()).toBe(1)
  expect(await page.locator(".code-line").count()).toBe(0)
  expect(await page.locator("#detail-content").innerText()).toContain("No observed pseudocode")
})
