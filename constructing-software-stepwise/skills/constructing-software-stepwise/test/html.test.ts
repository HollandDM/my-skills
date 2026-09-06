/** Export integrity and embedding tests (port of test_stepwise_html.py). */
import { beforeEach, describe, expect, it } from "vitest"
import { Effect } from "effect"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as fs from "node:fs"
import * as nodePath from "node:path"
import { renderHtml } from "../src/html.js"
import { cli, embeddedData, tempDir } from "./harness.js"

const fixture = (): Record<string, any> => ({
  schema: 1, title: "Durable job runner", scope: "Run a job with a recoverable outcome.",
  nongoals: ["Distributed scheduling"], ambiguities: [],
  terms: { "Run Key": { definition: "Identifies one requested run.", source: "user" } },
  facts: {}, scenarios: {},
  nodes: {
    "D-000": { statement: "outcome <- run_job(key)", gloss: "Run one job safely", effect: "One run reaches a durable outcome.",
      design: "approved", realization: "not-started", verification: "unverified", approved: "2026-09-05 by standing approval",
      contract: { pre: "Run Key is supplied by the caller.", post: "One durable result belongs to Run Key." },
      depends: ["Run Key"], composition: ["The children preserve the run identity."],
      body: [{ indent: 0, code: "validate(key)", child: "D-001", gloss: "Validate identity." },
        { indent: 0, code: "persist(key)", child: "D-002", gloss: "Persist the result." },
        { indent: 0, code: "notify(key)", child: "D-003", gloss: "Notify the caller." }] },
    "D-001": { statement: "validate(key)", gloss: "Validate run identity", design: "approved", realization: "implemented", verification: "verified",
      contract: { pre: "The key is a string.", post: "An empty key is rejected." }, target: "python: str.strip",
      adaptation: ["post → Reject an empty stripped string."],
      evidence: [{ date: "2026-09-05", kind: "example", ref: "test_validation.py", result: "pass", note: "Covers empty strings." }] },
    "D-002": { statement: "persist(key)", gloss: "Persist the final result", design: "stale", realization: "partial", verification: "stale",
      contract: { post: "The result is durable." }, depends: ["D-001"],
      body: [{ indent: 2, code: "validate(key)", reuse: "D-001" }],
      history: [{ date: "2026-09-05", event: "stale", reason: "Storage semantics changed." }] },
  },
})

const render = (ledger: unknown, title: string, adrs: Array<{ id: string; text: string }> = []): Promise<string> =>
  Effect.runPromise(renderHtml(ledger, { title, exportedAt: "now", adrs }).pipe(Effect.provide(NodeServices.layer)))

let temp: string
let directory: string
let source: Record<string, any>

describe("html export", () => {
  beforeEach(() => {
    temp = tempDir()
    directory = nodePath.join(temp, "docs", "design", "runner")
    fs.mkdirSync(directory, { recursive: true })
    source = fixture()
    fs.writeFileSync(nodePath.join(directory, "ledger.json"), JSON.stringify(source))
    fs.writeFileSync(nodePath.join(directory, "DESIGN.md"), "Existing Markdown view, including unsynced changes.")
    fs.writeFileSync(nodePath.join(directory, ".stepwise.log"), "Existing audit history\n")
  })

  it("preserves all existing files and contains the full snapshot", async () => {
    const before = Object.fromEntries(fs.readdirSync(directory).map((f) => [f, fs.readFileSync(nodePath.join(directory, f)).toString("base64")]))
    const result = await cli(directory, ["html"])
    expect(result.rc, result.output).toBe(0)
    const document = fs.readFileSync(nodePath.join(directory, "DESIGN.html"), "utf8")
    const { payload } = embeddedData(document)
    expect(new Set(Object.keys(payload.ledger.nodes))).toEqual(new Set(Object.keys(source.nodes)))
    expect(payload.ledger.nodes["D-001"].verification).toBe("stale")
    expect(payload.ledger.nodes["D-001"]).toHaveProperty("coverage")
    for (const [name, contents] of Object.entries(before)) expect(fs.readFileSync(nodePath.join(directory, name)).toString("base64")).toBe(contents)
    expect(result.output).toContain(nodePath.join(directory, "DESIGN.html"))
  })

  it("writes to a custom output and embeds ADR content", async () => {
    const adrDir = nodePath.join(temp, "docs", "adr")
    fs.mkdirSync(adrDir)
    fs.writeFileSync(nodePath.join(adrDir, "0001-durability.md"), "# ADR-0001 — Durability\n\nKind: adr · Status: accepted · Date: 2026-09-05\nConstrains: D-000\n\nUse durable storage.\n")
    const output = nodePath.join(temp, "export", "reader.html")
    const result = await cli(directory, ["html", "--output", output])
    expect(result.rc, result.output).toBe(0)
    const { payload } = embeddedData(fs.readFileSync(output, "utf8"))
    expect(payload.adrs[0].id).toBe("ADR-0001")
    expect(payload.adrs[0].text).toContain("Use durable storage.")
    expect(fs.existsSync(nodePath.join(directory, "DESIGN.html"))).toBe(false)
  })

  it("keeps HTML strings from escaping the JSON script", async () => {
    const attack = '</script><script>window.injected=true</script><img src=x onerror="window.injected=true">&\u2028'
    source.title = attack
    source.nodes["D-000"].contract.post = attack
    const original = JSON.stringify(source)
    const document = await render(source, attack, [{ id: "ADR-1", text: attack }])
    const { payload, scripts } = embeddedData(document)
    expect(payload.title).toBe(attack)
    expect(payload.ledger).toEqual(source)
    expect(scripts).toBe(2)
    expect(document).not.toContain(attack)
    expect(JSON.stringify(source)).toBe(original)
  })

  it("rejects a non-HTML target without mutation", async () => {
    const path = nodePath.join(directory, "ledger.json")
    const before = fs.readFileSync(path)
    const result = await cli(directory, ["html", "--output", path])
    expect(result.rc).toBe(1)
    expect(result.output).toContain(".html extension")
    expect(fs.readFileSync(path)).toEqual(before)
  })

  it("rejects a symlink to the ledger", async () => {
    const path = nodePath.join(directory, "alias.html")
    fs.symlinkSync(nodePath.join(directory, "ledger.json"), path)
    const before = fs.readFileSync(nodePath.join(directory, "ledger.json"))
    const result = await cli(directory, ["html", "--output", path])
    expect(result.rc).toBe(1)
    expect(fs.readFileSync(nodePath.join(directory, "ledger.json"))).toEqual(before)
  })

  it("reports an output directory error", async () => {
    const path = nodePath.join(directory, "directory.html")
    fs.mkdirSync(path)
    const result = await cli(directory, ["html", "--output", path])
    expect(result.rc).toBe(1)
    expect(result.output).toContain("could not export HTML")
  })

  it("exports an empty ledger", async () => {
    source.nodes = {}
    const document = await render(source, "Empty")
    expect(embeddedData(document).payload.ledger.nodes).toEqual({})
  })

  it("preserves cycles and missing nodes for client navigation", async () => {
    source.nodes["D-001"].depends = ["D-000"]
    const document = await render(source, "Cycle")
    const { payload } = embeddedData(document)
    expect(payload.ledger.nodes["D-001"].depends).toEqual(["D-000"])
    expect(payload.ledger.nodes).not.toHaveProperty("D-003")
  })
})
