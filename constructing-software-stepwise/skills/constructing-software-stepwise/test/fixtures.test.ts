/**
 * Golden parity against ledgers the Python CLI wrote (test/fixtures/*): loading, linting, rendering, hashing and
 * HTML embedding must reproduce the Python output byte for byte, so existing ledgers keep their approvals.
 */
import { describe, expect, it } from "vitest"
import { Effect, Layer } from "effect"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as fs from "node:fs"
import * as nodePath from "node:path"
import { Ledger } from "../src/ledger.js"
import { renderAll } from "../src/render.js"
import { fingerprint } from "../src/state.js"
import { gitNone } from "../src/services.js"
import { cli, embeddedData, expectCli, gitInit, readJson, readLedger, snapshotFiles, tempDir } from "./harness.js"

const FIXTURES = nodePath.join(nodePath.dirname(new URL(import.meta.url).pathname), "fixtures")

const copyFixture = (name: string): string => {
  const target = nodePath.join(tempDir(), name)
  fs.cpSync(nodePath.join(FIXTURES, name), target, { recursive: true })
  return target
}

const strip = (payload: string): string => payload.trim().replace(/"exported_at": "[^"]*"/u, "").replace(/"review_key": "[^"]*"/u, "")

const loadLedger = (dir: string): Promise<Ledger> => Effect.runPromise(Ledger.load(dir).pipe(Effect.provide(Layer.mergeAll(NodeServices.layer, gitNone))))

describe("golden fixtures (forward design)", () => {
  it("renders every Python-written view byte for byte", async () => {
    const root = copyFixture("forward")
    const d = nodePath.join(root, "design")
    const led = await loadLedger(d)
    for (const [path, text] of renderAll(led)) expect(text, nodePath.relative(d, path)).toBe(fs.readFileSync(path, "utf8"))
  })

  it("keeps every approval: fingerprints match and check reports no errors", async () => {
    const root = copyFixture("forward")
    const d = nodePath.join(root, "design")
    const data = readLedger(d)
    for (const [nid, n] of Object.entries<any>(data.nodes)) if (n.design === "approved") expect(n.approved_content_hash, nid).toBe(fingerprint(n))
    const result = await cli(d, ["check"])
    expect(result.rc, result.output).toBe(0)
    expect(result.output).toContain("warn  0001-row-locks-for-job-claims.md: paragraph still a placeholder")
    expect(result.output).toContain("ok  design: 5 nodes, 0 frontier, 0 errors, 1 warnings")
  })

  it("sync rewrites ledger.json to identical bytes", async () => {
    const root = copyFixture("forward")
    const d = nodePath.join(root, "design")
    const before = snapshotFiles(d)
    await expectCli(d, ["sync"])
    const after = snapshotFiles(d)
    delete before[".stepwise.log"]
    delete after[".stepwise.log"]
    expect(after).toEqual(before)
  })

  it("exports the same HTML payload as Python, modulo export time and review key", async () => {
    const root = copyFixture("forward")
    const d = nodePath.join(root, "design")
    const output = nodePath.join(root, "ts.html")
    await expectCli(d, ["html", "--output", output])
    const python = embeddedData(fs.readFileSync(nodePath.join(d, "DESIGN.html"), "utf8"))
    const ts = embeddedData(fs.readFileSync(output, "utf8"))
    const rawPython = /<script id="stepwise-data" type="application\/json">([\s\S]*?)<\/script>/u.exec(fs.readFileSync(nodePath.join(d, "DESIGN.html"), "utf8"))![1]
    const rawTs = /<script id="stepwise-data" type="application\/json">([\s\S]*?)<\/script>/u.exec(fs.readFileSync(output, "utf8"))![1]
    expect(strip(rawTs)).toBe(strip(rawPython))
    expect(ts.payload.pseudocode).toEqual(python.payload.pseudocode)
  })

  it("reports status, frontier, repair and show without errors", async () => {
    const root = copyFixture("forward")
    const d = nodePath.join(root, "design")
    const status = await expectCli(d, ["status", "--all"])
    expect(status).toContain("D-004  retired")
    const show = await expectCli(d, ["show", "D-002"])
    expect(show).toBe(fs.readFileSync(nodePath.join(d, "nodes", "D-002.md"), "utf8"))
    const repair = await expectCli(d, ["repair"])
    expect(repair).toContain("repair plan")
    const frontier = await expectCli(d, ["frontier"])
    expect(frontier).toContain("frontier empty")
  })
})

describe("golden fixtures (existing code)", () => {
  const prepare = (): { repo: string; d: string; expectedCommit: string } => {
    const root = copyFixture("existing")
    const repo = nodePath.join(root, "repo")
    const meta = readJson<{ files: string[]; message: string; commit: string; original_normalize: string }>(nodePath.join(root, "git-fixture.json"))
    // The fixture stores the post-sync source; recreate the commit from the original file the Python run inspected.
    const current = fs.readFileSync(nodePath.join(repo, "normalize.py"), "utf8")
    fs.writeFileSync(nodePath.join(repo, "normalize.py"), meta.original_normalize)
    const commit = gitInit(repo, meta.files, meta.message)
    expect(commit).toBe(meta.commit)
    fs.writeFileSync(nodePath.join(repo, "normalize.py"), current)
    return { repo, d: nodePath.join(repo, "docs", "design", "normalization"), expectedCommit: meta.commit }
  }

  it("recreates the same commit and renders identical views", async () => {
    const { d, expectedCommit } = prepare()
    expect(readLedger(d).nodes["D-001"].implementation_commit).toBe(expectedCommit)
    const led = await loadLedger(d)
    for (const [path, text] of renderAll(led)) expect(text, nodePath.relative(d, path)).toBe(fs.readFileSync(path, "utf8"))
    const result = await cli(d, ["check"])
    expect(result.rc, result.output).toBe(0)
  })

  it("scans to the Python source report and exports the same HTML payload", async () => {
    const { d } = prepare()
    const scan = JSON.parse(await expectCli(d, ["scan", "--json"]))
    const python = embeddedData(fs.readFileSync(nodePath.join(d, "DESIGN.html"), "utf8")).payload
    expect(scan.nodes["D-001"].inspection_token).toBe(python.ledger.nodes["D-001"].source_report.inspection_token)
    expect(scan.nodes["D-001"].state).toBe("stale")
    const output = nodePath.join(nodePath.dirname(d), "ts.html")
    await expectCli(d, ["html", "--output", output])
    const rawPython = /<script id="stepwise-data" type="application\/json">([\s\S]*?)<\/script>/u.exec(fs.readFileSync(nodePath.join(d, "DESIGN.html"), "utf8"))![1]
    const rawTs = /<script id="stepwise-data" type="application\/json">([\s\S]*?)<\/script>/u.exec(fs.readFileSync(output, "utf8"))![1]
    expect(strip(rawTs)).toBe(strip(rawPython))
  })

  it("sync is idempotent and the rebuild ledger checks clean", async () => {
    const { d, repo } = prepare()
    const before = snapshotFiles(d)
    await expectCli(d, ["sync"])
    const after = snapshotFiles(d)
    delete before[".stepwise.log"]
    delete after[".stepwise.log"]
    expect(after).toEqual(before)
    const rebuild = nodePath.join(nodePath.dirname(repo), "rebuild")
    const result = await cli(rebuild, ["check"])
    expect(result.rc, result.output).toBe(0)
  })
})
