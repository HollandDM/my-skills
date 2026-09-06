/** Notation regressions: preserve blocks, procedure boundaries, and approved data (port of test_stepwise_pseudocode.py). */
import { describe, expect, it } from "vitest"
import { Effect, Layer } from "effect"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as fs from "node:fs"
import * as nodePath from "node:path"
import { callNames, fnOf, frontierStatement, parseBody, stmtKind } from "../src/core.js"
import { fingerprint } from "../src/state.js"
import { displayCode, signature } from "../src/pseudocode.js"
import { renderHtml } from "../src/html.js"
import { expectCli, readLedger, tempDir } from "./harness.js"

describe("pseudocode", () => {
  it("parses paper blocks and uppercase calls", () => {
    const items = parseBody(`procedure TransformAll(X)
  Y ← []
  for each x in X do
    if x ≠ ∅ then
      y ← Transform(x) ▷ D-001: Transform one item.
      Y ← Y ⧺ [y]
    else
      continue
    end if
  end for
  return Y
end procedure`, "TransformAll")
    expect(items).toHaveLength(10)
    expect(items[3].indent).toBe(4)
    expect(items[3].child).toBe("D-001")
    expect(fnOf("y ← Transform(x)")).toBe("Transform")
    expect(fnOf(frontierStatement(items[3].code))).toBe("Transform")
    expect(callNames("return Transform(x)")).toEqual(["Transform"])
    expect(callNames("return (x, y)")).toEqual([])
    expect(callNames('text ← "Transform(x)"')).toEqual([])
    expect(stmtKind("IF x ∈ X THEN")).toBe("control")
    expect(stmtKind("assert x ∈ X")).toBe("assert")
    expect(parseBody("repeat\n  x ← x + 1\nuntil x ≥ 3", "Count")[1].indent).toBe(2)
  })

  it("keeps literals and legacy notation", () => {
    const text = 'Echo("a <- b -- c ▷ d")'
    expect(signature(text)).toBe(text)
    expect(signature("(a, b) ← Pair(x)")).toBe("Pair(x)")
    expect(displayCode("-> " + text)).toBe("return " + text)
    const items = parseBody('Echo(x):\n  y <- Echo("-- literal") -- ⇒ python: print -- Echo a literal.\n  -> y', "Echo")
    expect(items[0].code).toBe('y <- Echo("-- literal")')
    expect(items[0].target).toBe("python: print")
    expect(displayCode(items[0].code)).toBe('y ← Echo("-- literal")')
  })

  it("rejects misplaced contracts and other procedures", () => {
    for (const text of ["Require: x is positive\nreturn x", "procedure Other(x)\nreturn x\nend procedure", "procedure Run(x)\nprocedure Nested(x)\nreturn x\nend procedure"]) {
      expect(() => parseBody(text, "Run")).toThrow()
    }
  })

  it("names procedures end to end and exports read-only", async () => {
    const d = nodePath.join(tempDir(), "docs", "design", "paper")
    const ops = [
      { verb: "new", id: "D-000", statement: "Y ← TransformAll(X)" },
      { verb: "set", id: "D-000", fields: { gloss: "Transform a sequence", effect: "Map every input.", contract: { pre: "X is a finite sequence.", post: "Y is its transformed sequence." }, walkthrough: ["Apply Transform in input order."], composition: ["After each iteration, Y is the transformed prefix."] } },
      { verb: "body", id: "D-000", text: "procedure TransformAll(X)\n  Y ← []\n  for each x in X do\n    y ← Transform(x) ▷ D-001: Transform an input.\n    Y ← Y ⧺ [y]\n  end for\n  return Y\nend procedure" },
      { verb: "approve", id: "D-000", by: "test" },
      { verb: "new", id: "D-001" },
      { verb: "set", id: "D-001", fields: { gloss: "Transform an input", effect: "Return the same value.", contract: { pre: "x is supplied.", post: "The result equals x." }, walkthrough: ["Return x unchanged."], composition: ["Identity establishes the postcondition."] } },
      { verb: "body", id: "D-001", text: "return x" },
      { verb: "approve", id: "D-001", by: "test" },
    ]
    await expectCli(d, ["batch"], { stdin: JSON.stringify(ops) })
    const before = fs.readFileSync(nodePath.join(d, "ledger.json"))
    const data = readLedger(d)
    const view = fs.readFileSync(nodePath.join(d, "DESIGN.md"), "utf8")
    expect(view).toContain("Require: X is a finite sequence.")
    expect(view.split("procedure TransformAll(X)").length - 1).toBe(1)
    expect(view.split("procedure Transform(x)").length - 1).toBe(1)
    expect(view.split("### Procedures")[0]).not.toContain("return x")
    const document = await Effect.runPromise(renderHtml(data, { title: "Paper", exportedAt: "test", adrs: [] }).pipe(Effect.provide(NodeServices.layer)))
    expect(document).toContain("algorithm-card")
    expect(fs.readFileSync(nodePath.join(d, "ledger.json"))).toEqual(before)
    expect(data.nodes["D-000"].approved_content_hash).toBe(fingerprint(data.nodes["D-000"]))
    void Layer
  })
})
