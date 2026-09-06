/** Remote workflow regressions (port of test_stepwise_regressions.py). */
import { describe, expect, it } from "vitest"
import * as fs from "node:fs"
import * as nodePath from "node:path"
import { compactErrors } from "../src/check.js"
import { proposalHash } from "../src/core.js"
import { cli, expectCli, readLedger, snapshotFiles, tempDir } from "./harness.js"

const configureNode = async (design: string, nodeId: string, body?: string): Promise<void> => {
  const payload = JSON.stringify({ gloss: `run ${nodeId}`, effect: `${nodeId} returns one result.`, contract: { pre: "The input is valid.", post: "The result is returned." } })
  await expectCli(design, ["set", nodeId, payload])
  if (body === undefined) {
    await expectCli(design, ["terminal", nodeId, "ts: Array.from"])
    await expectCli(design, ["set", nodeId, "adaptation", "Pre: validated input", "Post: Array.from returns the result"])
  } else {
    await expectCli(design, ["body", nodeId], { stdin: body })
    await expectCli(design, ["set", nodeId, JSON.stringify({ walkthrough: [`${nodeId} delegates to one child.`], composition: ["Data flow: the child result becomes the node result."] })])
  }
  const node = readLedger(design).nodes[nodeId]
  await expectCli(design, ["approve", nodeId, "--actor", "user:test", "--proposal-hash", proposalHash(node)])
}

describe("regressions", () => {
  it("compacts ADR errors", () => {
    expect(compactErrors(["0001-a.md: constrains D-000 which is stale", "0002-b.md: constrains D-000 which is stale"]))
      .toEqual(["2 ADRs are blocked by D-000; run `repair` for dependency order"])
  })

  it("rejects a root without a call and never creates the ledger", async () => {
    const rejected = nodePath.join(tempDir(), "docs", "design", "rejected")
    const result = await cli(rejected, ["new", "D-000", "not a callable statement"])
    expect(result.rc).toBe(1)
    expect(result.output).toContain("has no call")
    expect(fs.existsSync(nodePath.join(rejected, "ledger.json"))).toBe(false)
  })

  it("rejects an untagged call without touching files", async () => {
    const design = nodePath.join(tempDir(), "docs", "design", "repairable")
    await expectCli(design, ["new", "D-000", "result <- run_job(key)"])
    await expectCli(design, ["set", "D-000", "gloss", "run one job"])
    await expectCli(design, ["set", "D-000", "effect", "The job reaches one result."])
    await expectCli(design, ["set", "D-000", "pre", "The key is valid."])
    await expectCli(design, ["set", "D-000", "post", "The result is returned."])
    const before = snapshotFiles(design)
    const result = await cli(design, ["body", "D-000"], "run_job(key):\n  -> finish(key)\n")
    expect(result.rc).toBe(1)
    expect(result.output).toContain("untagged call")
    expect(snapshotFiles(design)).toEqual(before)
  })

  it("runs the proposal, evidence, reaffirm and own-code flow", async () => {
    const root = tempDir()
    const verified = nodePath.join(root, "docs", "design", "verified")
    for (const args of [
      ["new", "D-000", "result <- store(key)"],
      ["set", "D-000", "gloss", "store one result"],
      ["set", "D-000", "effect", "The result is stored in durable state."],
      ["set", "D-000", "pre", "The key is valid."],
      ["set", "D-000", "post", "The result is stored once."],
      ["terminal", "D-000", "postgres: INSERT ON CONFLICT"],
      ["set", "D-000", "adaptation", "Pre: validated key", "Post: unique index"],
    ]) await expectCli(verified, args)

    let result = await cli(verified, ["approve", "D-000", "--actor", "user:owner"])
    expect(result.rc).toBe(1)
    expect(result.output).toContain("proposal hash missing")
    expect(readLedger(verified).nodes["D-000"].design).toBe("draft")

    result = await cli(verified, ["proposal", "D-000"])
    expect(result.rc).toBe(0)
    let proposal = result.output.trim().split(/\s+/u).pop()!
    result = await cli(verified, ["approve", "D-000", "--actor", "user:owner", "--proposal-hash", "wrong"])
    expect(result.rc).toBe(1)
    expect(result.output).toContain(proposal)
    await expectCli(verified, ["approve", "D-000", "--actor", "user:owner", "--proposal-hash", proposal])

    result = await cli(verified, ["set", "D-000", "adaptation", "Pre: validated key", "Post: unique constraint"])
    expect(result.rc).toBe(1)
    expect(result.output).toContain("reopen")
    expect(readLedger(verified).nodes["D-000"].design).toBe("approved")
    await expectCli(verified, ["reopen", "D-000", "tighten the post adaptation"])
    await expectCli(verified, ["set", "D-000", "adaptation", "Pre: validated key", "Post: unique constraint"])
    result = await cli(verified, ["approve", "D-000", "--actor", "user:owner", "--proposal-hash", proposal])
    expect(result.rc).toBe(1)
    expect(result.output).toContain("does not match current proposal")
    result = await cli(verified, ["proposal", "D-000"])
    proposal = result.output.trim().split(/\s+/u).pop()!
    await expectCli(verified, ["approve", "D-000", "--actor", "user:owner", "--proposal-hash", proposal])

    result = await cli(verified, ["evidence", "D-000", "--kind", "test", "--ref", "StoreSpec", "--result", "pass", "--scope", "implementation", "--scenario", "valid key", "--assessment", "Exercises storage behavior."])
    expect(result.rc).toBe(1)
    expect(result.output).toContain("--covers")
    await expectCli(verified, ["evidence", "D-000", "--kind", "test", "--ref", "StoreSpec#pre", "--result", "pass", "--covers", "pre", "--scope", "implementation", "--scenario", "valid key", "--assessment", "Exercises precondition acceptance."])
    let node = readLedger(verified).nodes["D-000"]
    expect([node.verification, node.realization]).toEqual(["partial", "not-started"])

    await expectCli(verified, ["set", "D-000", "realization", "implemented"])
    await expectCli(verified, ["evidence", "D-000", "--kind", "review", "--ref", "review-1", "--result", "fail", "--covers", "post", "--scope", "correspondence", "--assessment", "Review found the implementation does not establish post."])
    expect(readLedger(verified).nodes["D-000"].verification).toBe("failed")
    await expectCli(verified, ["evidence", "D-000", "--kind", "test", "--ref", "StoreSpec#post", "--result", "pass", "--covers", "post", "--scope", "implementation", "--scenario", "successful store", "--assessment", "A different check passes post without resolving review-1."])
    expect(readLedger(verified).nodes["D-000"].verification).toBe("failed")
    await expectCli(verified, ["evidence", "D-000", "--kind", "review", "--ref", "review-2", "--result", "pass", "--covers", "post", "--resolves", "EV-2", "--scope", "correspondence", "--assessment", "Follow-up review confirms the postcondition and resolves EV-2."])
    expect(readLedger(verified).nodes["D-000"].verification).toBe("verified")

    result = await cli(verified, ["set", "D-000", "verification", "unverified"])
    expect(result.rc).toBe(1)
    expect(result.output).toContain("derived")
    const view = fs.readFileSync(nodePath.join(verified, "nodes", "D-000.md"), "utf8")
    expect(view).toContain("Covers: post")
    expect(view).toContain("Resolves: EV-2")
    result = await cli(verified, ["check"])
    expect(result.rc).toBe(0)
    expect(result.output).toContain("complete stateful design has no scenarios")

    // Superseded node bodies are historical records.
    const historical = nodePath.join(root, "docs", "design", "historical-supersession")
    await expectCli(historical, ["new", "D-000", "result <- run_root()"])
    await configureNode(historical, "D-000", "result <- run_old() -- D-010: run the old branch")
    await expectCli(historical, ["new", "D-010"])
    await configureNode(historical, "D-010", "value <- run_old_child() -- D-020: run the old child\nunused <- run_unbuilt_child() -- D-050: leave one historical child unbuilt")
    await expectCli(historical, ["new", "D-020"])
    await configureNode(historical, "D-020")
    await expectCli(historical, ["reopen", "D-000", "replace the old branch"])
    await expectCli(historical, ["batch"], { stdin: JSON.stringify([
      ["body", "D-000", "--text", "result <- run_new() -- D-030: run the replacement branch"],
      ["approve", "D-000", "--by", "user:test"],
      ["supersede", "D-010", "D-030", "replace old branch"],
    ]) })
    const rootNode = readLedger(historical).nodes["D-000"]
    await expectCli(historical, ["approve", "D-000", "--actor", "user:test", "--proposal-hash", proposalHash(rootNode)])
    await expectCli(historical, ["new", "D-030"])
    await configureNode(historical, "D-030", "value <- run_new_child() -- D-040: run the replacement child")
    await expectCli(historical, ["new", "D-040"])
    await configureNode(historical, "D-040")
    await expectCli(historical, ["supersede", "D-020", "D-040", "replace old child"])
    await expectCli(historical, ["check"])
    result = await cli(historical, ["frontier"])
    expect(result.rc).toBe(0)
    expect(result.output).not.toContain("D-050")

    // Reaffirmation preserves the old refinement record and invalidates evidence.
    await expectCli(verified, ["entry", "term", "Storage Key", "A caller identity."])
    await expectCli(verified, ["batch"], { stdin: JSON.stringify([
      ["reopen", "D-000", "Record key dependency"],
      ["set", "D-000", JSON.stringify({ depends: ["Storage Key"] })],
      ["approve", "D-000", "--by", "user:test"],
    ]) })
    await expectCli(verified, ["evidence", "D-000", "--kind", "test", "--ref", "KeySpec", "--result", "pass", "--covers", "pre,post", "--scope", "implementation", "--scenario", "key lifecycle", "--assessment", "Exercises both obligations for a durable key."])
    await expectCli(verified, ["change", "Storage Key", "--definition", "An identity across retries.", "--reason", "Clarified lifetime"])
    result = await cli(verified, ["repair"])
    expect(result.rc).toBe(0)
    expect(result.output).toContain("reaffirm")
    const before = readLedger(verified).nodes["D-000"]
    await expectCli(verified, ["reaffirm", "D-000", "--actor", "user:test"])
    node = readLedger(verified).nodes["D-000"]
    expect([node.design, node.verification]).toEqual(["approved", "stale"])
    expect(node.revision).toBe(before.revision + 1)
    expect(node.superseded).toEqual(before.superseded)
    expect(node.revisions).toEqual(before.revisions)

    // Own code can be named before implementation, without claiming it exists.
    await expectCli(verified, ["reopen", "D-000", "Use application storage adapter"])
    await expectCli(verified, ["terminal", "D-000", "service: StorageAdapter.store"])
    await expectCli(verified, ["set", "D-000", "realization", "not-started"])
    await expectCli(verified, ["approve", "D-000", "--by", "standing approval"])
    expect(readLedger(verified).nodes["D-000"].realization).toBe("not-started")
  })
})
