/** Source-version and reconstruction regressions using a disposable git repo (port of test_stepwise_existing.py). */
import { beforeEach, describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import * as fs from "node:fs"
import * as nodePath from "node:path"
import { expectCli, gitInit, readLedger, snapshotFiles, tempDir } from "./harness.js"

let repo: string
let d: string

const data = (): Record<string, any> => readLedger(d)
const scan = async (): Promise<any> => JSON.parse(await expectCli(d, ["scan", "--json"]))

const adopt = (): Promise<string> => expectCli(d, ["batch"], { stdin: JSON.stringify([
  { verb: "adopt", id: "D-000", statement: "result <- run(value)" },
  { verb: "adopt", id: "D-001", statement: "result <- normalize(value)", parent: "D-000" },
  { verb: "bind", args: ["D-000", "run.py", "--repo", repo, "--symbol", "run"] },
  { verb: "bind", args: ["D-001", "normalize.py", "--symbol", "normalize"] },
]) })

const observe = async (nid = "D-001", comparisons?: Record<string, unknown>): Promise<void> => {
  const token = (await scan()).nodes[nid].inspection_token
  const payload: Record<string, unknown> = { effect: "Return a normalized string.", claims: [{ text: "Whitespace is stripped.", basis: "observed", sources: ["S01"] }], unknowns: [] }
  if (comparisons !== undefined) payload.comparisons = comparisons
  await expectCli(d, ["observe", nid, JSON.stringify(payload), "--at", token])
}

describe("existing code", () => {
  beforeEach(() => {
    repo = nodePath.join(tempDir(), "repo")
    fs.mkdirSync(repo)
    d = nodePath.join(repo, "docs", "design", "normalization")
    fs.writeFileSync(nodePath.join(repo, "normalize.py"), "def normalize(value):\n    return value.strip()\n")
    fs.writeFileSync(nodePath.join(repo, "run.py"), "from normalize import normalize\ndef run(value):\n    return normalize(value)\n")
    gitInit(repo, ["normalize.py", "run.py"])
  })

  it("adoption never promotes an observed behavior to a contract", async () => {
    await adopt()
    await observe()
    await observe("D-000")
    const n = data().nodes["D-001"]
    expect(n.contract).toEqual({})
    expect(n.design).toBe("draft")
    expect(n.realization).toBe("not-started")
    expect(n.verification).toBe("unverified")
    expect((await scan()).pending).toEqual([])
    expect((await scan()).nodes["D-001"].conformance.status).toBe("unassessed")
    await expectCli(d, ["check"])
  })

  it("dirty edits signal nodes and parents without rewriting observations", async () => {
    await adopt()
    await observe()
    await observe("D-000")
    const before = data()
    const old = await scan()
    fs.writeFileSync(nodePath.join(repo, "normalize.py"), "def normalize(value):\n    return value.upper()\n")
    const current = await scan()
    expect(current.commit).toBe(old.commit)
    expect(current.nodes["D-001"].implementation_version).not.toBe(old.nodes["D-001"].implementation_version)
    expect(new Set(current.pending)).toEqual(new Set(["D-000", "D-001"]))
    expect(data()).toEqual(before)
    await expectCli(d, ["sync"])
    const n = data().nodes["D-001"]
    expect(n.observation).toEqual(before.nodes["D-001"].observation)
    expect(n.implementation_revision).toBe(2)
    expect(n.source_state).toBe("stale")
    expect((await scan()).nodes["D-000"].changed_bindings).toEqual([])
    expect((await scan()).notifications).toHaveLength(2)
  })

  it("observation token rejects changes since inspection", async () => {
    await adopt()
    const token = (await scan()).nodes["D-001"].inspection_token
    const before = data()
    fs.writeFileSync(nodePath.join(repo, "normalize.py"), "def normalize(value):\n    return value.upper()\n")
    const payload = { effect: "Trim whitespace.", claims: [{ text: "Uses strip.", basis: "observed", sources: ["S01"] }] }
    await expectCli(d, ["observe", "D-001", JSON.stringify(payload), "--at", token], { ok: false })
    expect(data()).toEqual(before)
    await observe()
    expect((await scan()).nodes["D-001"].state).toBe("current")
  })

  it("observation round trip preserves omitted pseudocode only when sources match", async () => {
    await adopt()
    const token = (await scan()).nodes["D-001"].inspection_token
    const payload = { effect: "Trim whitespace.", claims: [{ text: "Uses strip.", basis: "observed", sources: ["S01"] }], unknowns: [], pseudocode: "return value.strip() -- ⇒ python: str.strip -- Trim whitespace." }
    await expectCli(d, ["observe", "D-001", JSON.stringify(payload), "--at", token])
    const body = data().nodes["D-001"].observation.body
    const exported = JSON.parse(await expectCli(d, ["observation", "D-001"]))
    expect(exported.pseudocode).toContain("str.strip")
    const update: Record<string, unknown> = { effect: "Return a trimmed value.", claims: payload.claims }
    await expectCli(d, ["observe", "D-001", JSON.stringify(update), "--at", token])
    expect(data().nodes["D-001"].observation.body).toEqual(body)
    const before = data()
    fs.writeFileSync(nodePath.join(repo, "normalize.py"), "def normalize(value):\n    return value.upper()\n")
    const fresh = (await scan()).nodes["D-001"].inspection_token
    await expectCli(d, ["observe", "D-001", JSON.stringify(update), "--at", fresh], { ok: false })
    expect(data()).toEqual(before)
    update.pseudocode = "return value.upper() -- ⇒ python: str.upper -- Uppercase the value."
    await expectCli(d, ["observe", "D-001", JSON.stringify(update), "--at", fresh])
    expect(data().nodes["D-001"].observation.body[0].code).toContain("upper")
    update.pseudocode = ""
    await expectCli(d, ["observe", "D-001", JSON.stringify(update), "--at", fresh])
    expect(data().nodes["D-001"].observation.body).toEqual([])
  })

  it("conformance is separate and code changes invalidate evidence", async () => {
    await adopt()
    await expectCli(d, ["set", "D-001", JSON.stringify({ gloss: "Normalize a string.", effect: "Trim whitespace.", contract: { post: "Whitespace is stripped." } })])
    await expectCli(d, ["terminal", "D-001", "python: str.strip"])
    await expectCli(d, ["approve", "D-001", "--by", "user"])
    await expectCli(d, ["evidence", "D-001", "--kind", "test", "--ref", "fixture", "--result", "pass", "--clause", "post",
      "--scope", "implementation", "--scenario", "padded input", "--assessment", "The implementation strips whitespace for the fixture input."])
    const before = data().nodes["D-001"]
    await observe("D-001", { post: { status: "matches", reason: "The inspected implementation calls str.strip." } })
    const after = data().nodes["D-001"]
    expect(after.approved_content_hash).toBe(before.approved_content_hash)
    expect(after.approved).toBe(before.approved)
    expect(after.verification).toBe("verified")
    expect((await scan()).nodes["D-001"].conformance.status).toBe("matches")
    fs.writeFileSync(nodePath.join(repo, "normalize.py"), "def normalize(value):\n    return value.upper()\n")
    await expectCli(d, ["sync"])
    const changed = data().nodes["D-001"]
    expect(changed.verification).toBe("stale")
    expect(changed.design).toBe("approved")
    expect(changed.conformance.status).toBe("unknown")
    await observe("D-001", { post: { status: "differs", reason: "The implementation uppercases without stripping whitespace." } })
    expect((await scan()).differences).toEqual(["D-001"])
    expect(data().nodes["D-001"].contract).toEqual(before.contract)
  })

  it("missing files and rebinding do not clear drift", async () => {
    await adopt()
    await observe()
    fs.renameSync(nodePath.join(repo, "normalize.py"), nodePath.join(repo, "labels.py"))
    expect((await scan()).nodes["D-001"].state).toBe("missing")
    await expectCli(d, ["bind", "D-001", "labels.py", "--binding", "S01", "--symbol", "normalize"])
    expect((await scan()).nodes["D-001"].state).toBe("stale")
    await observe()
    expect((await scan()).nodes["D-001"].state).toBe("current")
    await expectCli(d, ["bind", "D-001", "../outside.py"], { ok: false })
    await expectCli(d, ["unbind", "D-001", "S01", "--reason", "This implementation was removed."])
    expect((await scan()).nodes["D-001"].state).toBe("unbound")
  })

  it("whole-file hashes ignore locator hints but include unrelated code", async () => {
    await adopt()
    await observe()
    const before = (await scan()).nodes["D-001"]
    expect(before.implementation_version).toBe(createHash("sha256").update(fs.readFileSync(nodePath.join(repo, "normalize.py"))).digest("hex"))
    await expectCli(d, ["bind", "D-001", "normalize.py", "--binding", "S01", "--symbol", "normalize", "--lines", "2:2"])
    const hints = (await scan()).nodes["D-001"]
    expect(hints.implementation_version).toBe(before.implementation_version)
    expect(hints.inspection_token).toBe(before.inspection_token)
    expect(hints.state).toBe("current")
    fs.appendFileSync(nodePath.join(repo, "normalize.py"), "\ndef unrelated():\n    return 42\n")
    const changed = (await scan()).nodes["D-001"]
    expect(changed.implementation_version).not.toBe(before.implementation_version)
    expect(changed.state).toBe("stale")
  })

  it("scan counts every active node in a source-backed model", async () => {
    await adopt()
    await observe()
    await observe("D-000")
    await expectCli(d, ["unbind", "D-001", "S01", "--reason", "Binding needs reconstruction."])
    const report = await scan()
    expect(report.coverage.active).toBe(2)
    expect(report.coverage.bound).toBe(1)
    expect(report.coverage.unbound).toEqual(["D-001"])
    expect(report.coverage.complete).toBe(false)
    expect(report.pending).toContain("D-001")
    await expectCli(d, ["bind", "D-001", "normalize.py", "--binding", "S01", "--symbol", "normalize"])
    await observe()
    const complete = (await scan()).coverage
    expect(complete.current).toBe(complete.active)
    expect(complete.complete).toBe(true)
  })

  it("observed hierarchy and claims are validated transactionally", async () => {
    await adopt()
    const before = data()
    await expectCli(d, ["adopt", "D-000", "--parent", "D-001"], { ok: false })
    expect(data()).toEqual(before)
    const token = (await scan()).nodes["D-001"].inspection_token
    const payload = { effect: "Normalize.", claims: [{ text: "A guess", basis: "certain", sources: ["S01"] }] }
    await expectCli(d, ["batch"], { stdin: JSON.stringify([{ verb: "observe", id: "D-001", payload, at: token }]), ok: false })
    expect(data()).toEqual(before)
  })

  it("reconcile starts an independent model and never overwrites", async () => {
    await adopt()
    await observe()
    const before = snapshotFiles(d)
    const destination = nodePath.join(nodePath.dirname(d), "rebuilt")
    await expectCli(d, ["reconcile", "--output", destination])
    const fresh = readLedger(destination)
    expect(fresh.nodes).toEqual({})
    expect(fresh.terms).toEqual({})
    expect(fs.realpathSync(nodePath.resolve(destination, fresh.source_root))).toBe(fs.realpathSync(repo))
    expect(fs.realpathSync(nodePath.resolve(destination, fresh.reconstruction.previous_ledger))).toBe(fs.realpathSync(nodePath.join(d, "ledger.json")))
    expect(snapshotFiles(d)).toEqual(before)
    await expectCli(d, ["reconcile", "--output", destination], { ok: false })
    await expectCli(d, ["reconcile", "--output", d], { ok: false })
    const bad = nodePath.join(nodePath.dirname(d), "bad")
    await expectCli(d, ["batch"], { stdin: JSON.stringify([["reconcile", "--output", bad]]), ok: false })
    expect(fs.existsSync(bad)).toBe(false)
  })
})
