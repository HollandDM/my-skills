/** Focused CLI regressions for approval, evidence, and transactional updates (port of test_stepwise.py). */
import { beforeEach, describe, expect, it } from "vitest"
import * as fs from "node:fs"
import * as nodePath from "node:path"
import { expectCli, readLedger, snapshotFiles, tempDir } from "./harness.js"

let d: string

const batch = (ops: unknown[], ok = true): Promise<string> => expectCli(d, ["batch"], { stdin: JSON.stringify(ops), ok })

const root = (): Promise<string> => batch([
  { verb: "new", id: "D-000", statement: "result <- normalize(value)" },
  { verb: "set", id: "D-000", fields: { gloss: "Normalize a string.", effect: "Trim surrounding whitespace.", contract: { pre: "Input is a string.", post: "Result has no surrounding whitespace." } } },
  { verb: "ready", id: "D-000", approach: "Call str.strip without mutating input.", validation: "Check empty and padded strings." },
  { verb: "approve", id: "D-000", by: "standing approval" },
])

const evidence = (result: string, ...clauses: string[]): Promise<string> => {
  const args = ["evidence", "D-000", "--kind", "test", "--ref", "test_normalize", "--result", result,
    "--scope", "implementation", "--scenario", "normalize padded and empty strings", "--assessment", "The check exercises the named clauses for these inputs."]
  for (const clause of clauses) args.push("--clause", clause)
  return expectCli(d, args)
}

describe("ledger", () => {
  beforeEach(() => {
    d = nodePath.join(tempDir(), "docs", "design", "example")
  })

  it("evidence covers current clauses and never implements", async () => {
    await root()
    await evidence("pass", "pre")
    expect(readLedger(d).nodes["D-000"].verification).toBe("partial")
    await evidence("pass", "post")
    let n = readLedger(d).nodes["D-000"]
    expect([n.verification, n.realization]).toEqual(["verified", "not-started"])
    await evidence("fail", "post")
    expect(readLedger(d).nodes["D-000"].verification).toBe("failed")
    await expectCli(d, ["evidence", "D-000", "--kind", "other-test", "--ref", "other", "--result", "pass", "--clause", "post",
      "--scope", "implementation", "--scenario", "other normalization path", "--assessment", "A different check passes the postcondition but does not resolve the first failure."])
    expect(readLedger(d).nodes["D-000"].verification).toBe("failed")
    await evidence("pass", "post")
    expect(readLedger(d).nodes["D-000"].verification).toBe("verified")
    await expectCli(d, ["reopen", "D-000", "Use a different normalization rule."])
    await expectCli(d, ["approve", "D-000"])
    n = readLedger(d).nodes["D-000"]
    expect(n.verification).toBe("stale")
    expect(n.revisions).toHaveLength(1)
  })

  it("evidence needs assessment and can be withdrawn", async () => {
    await root()
    const before = readLedger(d)
    await expectCli(d, ["evidence", "D-000", "--kind", "test", "--ref", "fixture", "--result", "pass", "--clause", "post"], { ok: false })
    expect(readLedger(d)).toEqual(before)
    await expectCli(d, ["evidence", "D-000", "--kind", "test", "--ref", "fixture", "--result", "pass", "--clause", "post",
      "--scope", "implementation", "--scenario", "padded input", "--assessment", "Exercises post for padded input."])
    expect(readLedger(d).nodes["D-000"].verification).toBe("partial")
    await expectCli(d, ["withdraw-evidence", "D-000", "EV-1", "--reason", "The fixture did not execute this implementation.", "--by", "agent correction"])
    const n = readLedger(d).nodes["D-000"]
    expect(n.verification).toBe("stale")
    expect(n.evidence[0].withdrawn.by).toBe("agent correction")
    const view = fs.readFileSync(nodePath.join(d, "nodes", "D-000.md"), "utf8")
    expect(view).toContain("EV-1 test — withdrawn")
    expect(view).toContain("Scope: implementation")
    expect(view).toContain("Scenario: padded input")
    await expectCli(d, ["evidence", "D-000", "--kind", "review", "--ref", "bad", "--result", "pass", "--clause", "post",
      "--scope", "correspondence", "--assessment", "This was later retracted.", "--note", "Withdrawn: wrong path"], { ok: false })
  })

  it("statement revision requires the parent call site in the same batch", async () => {
    await batch([
      { verb: "new", id: "D-000", statement: "result <- run(value)" },
      { verb: "set", id: "D-000", fields: { gloss: "Run.", effect: "Return a value.", contract: { post: "A value is returned." }, walkthrough: ["Delegate."], composition: ["The child establishes post."] } },
      { verb: "body", id: "D-000", text: "result <- normalize(value) -- D-001: Normalize." },
      { verb: "approve", id: "D-000" },
      { verb: "new", id: "D-001" },
      { verb: "set", id: "D-001", fields: { gloss: "Normalize.", effect: "Normalize a value.", contract: { post: "The value is normalized." } } },
      { verb: "ready", id: "D-001", approach: "Canonicalize the value.", validation: "Check canonical output." },
      { verb: "approve", id: "D-001" },
    ])
    const before = readLedger(d)
    const refused = await batch([
      { verb: "reopen", id: "D-001", reason: "Rename operation" },
      { verb: "set", id: "D-001", fields: { statement: "result <- canonicalize(value)" } },
      { verb: "approve", id: "D-001" },
    ], false)
    expect(refused).toContain("reopen parent D-000")
    expect(readLedger(d)).toEqual(before)
    await batch([
      { verb: "reopen", id: "D-000", reason: "Rename child call" },
      { verb: "reopen", id: "D-001", reason: "Rename operation" },
      { verb: "set", id: "D-001", fields: { statement: "result <- canonicalize(value)" } },
      { verb: "approve", id: "D-001" },
      { verb: "approve", id: "D-000" },
    ])
    expect(readLedger(d).nodes["D-001"].statement).toContain("canonicalize(value)")
    expect(readLedger(d).nodes["D-000"].body[0].code).toContain("canonicalize(value)")
  })

  it("approved content is frozen", async () => {
    await root()
    await evidence("pass", "pre", "post")
    const before = readLedger(d)
    for (const args of [["terminal", "D-000", "python: str.upper"], ["set", "D-000", '{"decisions":["Changed silently"]}'], ["body", "D-000", "--text", "-> value"]]) {
      const text = await expectCli(d, args, { ok: false })
      expect(text).toContain("reopen")
      expect(readLedger(d)).toEqual(before)
    }
    await expectCli(d, ["set", "D-000", "verification", "unverified"], { ok: false })
    await expectCli(d, ["check"])
  })

  it("batch rolls back an invalid final graph and individual errors", async () => {
    await root()
    const before = snapshotFiles(d)
    await batch([
      { verb: "reopen", id: "D-000", reason: "Replace the implementation" },
      { verb: "set", id: "D-000", fields: { effect: "This must not persist." } },
      { verb: "new", id: "D-099", statement: "orphan()" },
    ], false)
    expect(snapshotFiles(d)).toEqual(before)
    await batch([{ verb: "reopen", id: "D-000", reason: "Change" }, { verb: "set", id: "D-000", fields: { unknown_field: 3 } }], false)
    expect(snapshotFiles(d)).toEqual(before)
  })

  it("has no arbitrary size caps", async () => {
    await expectCli(d, ["new", "D-000", "result <- normalize(value)"])
    const contract = Object.fromEntries(["pre", "post", "failure", "budget", "ordering", "cleanup", "safety", "progress"].map((k) => [k, "An explicit obligation."]))
    await expectCli(d, ["set", "D-000", JSON.stringify({ gloss: "Normalize.", effect: "Normalize values.", contract, walkthrough: Array(4).fill("A sentence.") })])
    await expectCli(d, ["ready", "D-000", "--approach", "Bounded string processing.", "--validation", "Check every obligation."])
    await expectCli(d, ["approve", "D-000"])
    expect(Object.keys(readLedger(d).nodes["D-000"].contract)).toHaveLength(8)
  })

  it("context changes invalidate dependents atomically", async () => {
    await expectCli(d, ["entry", "term", "Run Key", "A caller-supplied identity.", "--source", "user"])
    await root()
    await batch([{ verb: "reopen", id: "D-000", reason: "Record identity" }, { verb: "set", id: "D-000", fields: { depends: ["Run Key"] } }, { verb: "approve", id: "D-000" }])
    await evidence("pass", "pre", "post")
    await expectCli(d, ["change", "Run Key", "--definition", "A durable identity across retries.", "--reason", "Clarified scope"])
    const n = readLedger(d).nodes["D-000"]
    expect([n.design, n.verification]).toEqual(["stale", "stale"])
    await expectCli(d, ["check"])
  })

  it("legacy evidence is preserved without false verification", async () => {
    await root()
    const data = readLedger(d)
    const n = data.nodes["D-000"]
    delete n.approved_content_hash
    delete n.revision
    n.verification = "verified"
    n.evidence = [{ date: "2026-01-01", kind: "test", ref: "legacy", result: "pass" }]
    fs.writeFileSync(nodePath.join(d, "ledger.json"), JSON.stringify(data))
    await expectCli(d, ["sync"])
    expect(readLedger(d).nodes["D-000"].verification).toBe("stale")
    expect(readLedger(d).nodes["D-000"].evidence).toHaveLength(1)
  })

  it("a batch commits once, with one audit line and every view", async () => {
    await root()
    const audit = fs.readFileSync(nodePath.join(d, ".stepwise.log"), "utf8").trimEnd().split("\n")
    expect(audit).toHaveLength(1)
    expect(audit[0]).toContain("exit=0 batch operations=new D-000; set D-000 <json:gloss,effect,contract>; ready D-000; approve D-000 |")
    expect(fs.existsSync(nodePath.join(d, "DESIGN.md"))).toBe(true)
    expect(fs.existsSync(nodePath.join(d, "CONTEXT.md"))).toBe(true)
    expect(fs.existsSync(nodePath.join(d, "nodes", "D-000.md"))).toBe(true)
    expect(fs.existsSync(nodePath.join(d, ".stepwise-transaction.json"))).toBe(false)
  })

  it("ADR updates are staged with the batch", async () => {
    await root()
    const adrDir = nodePath.join(nodePath.dirname(nodePath.dirname(d)), "adr")
    await batch([{ verb: "adr", args: ["new", "Durability", "--constrains", "D-000"] }, { verb: "set", id: "D-000", fields: { not_a_field: "wrong" } }], false)
    expect(fs.existsSync(adrDir)).toBe(false)
    await expectCli(d, ["adr", "new", "Durability", "--constrains", "D-000"])
    expect(readLedger(d).nodes["D-000"].design).toBe("draft")
    const adr = nodePath.join(adrDir, fs.readdirSync(adrDir).find((f) => f.endsWith(".md"))!)
    fs.writeFileSync(adr, fs.readFileSync(adr, "utf8").replace("<1–3 sentences: what's the context, what did we decide, and why.>", "Use durable storage to retain outcomes."))
    await expectCli(d, ["adr", "accept", "ADR-0001"])
    await expectCli(d, ["approve", "D-000"])
    expect(readLedger(d).nodes["D-000"].design).toBe("approved")
    const text = await expectCli(d, ["check"])
    expect(text).not.toContain("placeholder")
  })
})
