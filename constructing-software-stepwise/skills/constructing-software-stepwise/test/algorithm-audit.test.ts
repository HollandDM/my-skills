import { describe, expect, it } from "vitest"
import { auditAlgorithms } from "../src/algorithm-audit.js"
import { parseBody } from "../src/core.js"
import type { NodeRecord } from "../src/types.js"

const node = (statement: string, fields: Partial<NodeRecord> = {}): NodeRecord => ({
  statement, gloss: "", effect: "", contract: {}, depends: [], design: "draft", realization: "not-started", verification: "unverified", approved: "", ...fields,
})
const observation = (pseudocode: string) => ({ effect: "Process one input.", claims: [{ text: "Source inspection.", basis: "observed", sources: ["S01"] }], body: parseBody(pseudocode, "Run") })

describe("algorithm traceability", () => {
  it("accepts connected intended and observed procedures, primitives and recursion", () => {
    const nodes = {
      "D-000": node("Run(input)", { body: parseBody("result ← Normalize(input) ▷ D-001: Normalize the input.\nreturn result", "Run"),
        observation: observation("result ← Normalize(input) ▷ D-001: Normalize the input.\nreturn result"), observed_children: ["D-001"] }),
      "D-001": node("Normalize(input)", { target: "python: str.strip", observation: observation('if input is nested then\n  return Normalize(input.value) ▷ D-001: Normalize the nested value.\nend if\nreturn input.strip() ▷ ⇒ python: str.strip -- Trim the string.') }),
    }
    expect(auditAlgorithms(nodes)).toEqual({ complete: true, procedures: 4, issues: [] })
  })

  it("finds hidden work in predicates and statements in both sources without guessing ambiguous links", () => {
    const body = parseBody('if Ready(input) then\n  value ← Normalize(input)\nend if\ntext ← "Ignore(input)"', "Run")
    const nodes = {
      "D-000": node("Run(input)", { body, observation: { ...observation(""), body } }),
      "D-001": node("Normalize(value)", { target: "python: str.strip" }),
      "D-002": node("Normalize(other)", { target: "python: str.upper" }),
    }
    const before = JSON.stringify(nodes)
    const issues = auditAlgorithms(nodes).issues
    expect(issues.map((issue) => [issue.basis, issue.line, issue.candidates])).toEqual([
      ["intended", 2, []], ["intended", 3, ["D-001", "D-002"]],
      ["observed", 2, []], ["observed", 3, ["D-001", "D-002"]],
    ])
    expect(JSON.stringify(nodes)).toBe(before)
  })

  it("does not turn dispatch relationships into fake synchronous calls", () => {
    const nodes = {
      "D-000": node("Run(input)", { observation: { ...observation("enqueue input for worker ▷ ⇒ queue: publish -- Dispatch work."),
        behavior: { participants: [{ id: "worker", label: "Worker", node: "D-001" }] } }, observed_children: ["D-001", "D-002"] }),
      "D-001": node("Worker(input)", { observation: observation("return input") }),
      "D-002": node("Other(input)", { observation: observation("return input") }),
    }
    expect(auditAlgorithms(nodes).issues).toMatchObject([{ node: "D-000", kind: "unexplained-relationship" }])
    expect(auditAlgorithms(nodes).issues[0].message).toContain("D-002")
  })

  it("reports absent algorithms and destinations, leaving historical bodies alone", () => {
    const nodes = {
      "D-000": node("Run(input)", { observation: observation("Missing(input) ▷ D-099: Inspect another procedure.") }),
      "D-001": node("Worker(input)", { observation: observation("") }),
      "D-002": node("Historical(input)", { design: "retired", observation: observation("") }),
      "D-003": node("Primitive(input)", { target: "python: str.strip" }),
      "D-004": node("Planned(input)", { implementation_plan: { approach: "Return input.", validation: "Check identity." } }),
    }
    expect(auditAlgorithms(nodes).issues.map((issue) => issue.kind)).toEqual(["missing-procedure", "missing-body"])
    expect(auditAlgorithms({}).complete).toBe(false)
  })

  it("does not call empty draft destinations or historical procedures complete", () => {
    const nodes = {
      "D-000": node("Run(input)", { body: parseBody("Draft(input) ▷ D-001: Follow an unfinished procedure.\nOld(input) ▷ D-002: Follow an outdated procedure.", "Run") }),
      "D-001": node("Draft(input)"),
      "D-002": node("Old(input)", { design: "retired" }),
    }
    expect(auditAlgorithms(nodes).issues.map((issue) => issue.kind)).toEqual(["historical-procedure", "missing-body"])
  })
})
