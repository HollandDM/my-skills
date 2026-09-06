/** argparse-compatible parsing: dash-prefixed values, choices, required flags, batch translation. */
import { describe, expect, it } from "vitest"
import { parseArgs } from "../src/args.js"
import { operations } from "../src/batch.js"

describe("argument parsing", () => {
  it("keeps dash-prefixed values that contain spaces as values", () => {
    expect(parseArgs(["body", "d", "D-000", "--text", "-> value"]).args.text).toBe("-> value")
    expect(parseArgs(["reopen", "d", "D-000", "- leading dash reason"]).args.reason).toBe("- leading dash reason")
    expect(parseArgs(["set", "d", "D-000", "depends", "-"]).args.value).toEqual(["-"])
    expect(parseArgs(["body", "d", "D-000", "--text=-> value"]).args.text).toBe("-> value")
  })

  it("collects repeated and variadic values", () => {
    const a = parseArgs(["evidence", "d", "D-000", "--kind", "test", "--ref", "r", "--result", "pass", "--clause", "pre", "--clause", "post", "--covers", "a,b"])
    expect(a.args.clause).toEqual(["pre", "post"])
    expect(a.args.covers).toEqual(["a,b"])
    expect(a.args.scope).toBe("unspecified")
    expect(parseArgs(["set", "d", "D-000", "walkthrough", "a", "b", "c"]).args.value).toEqual(["a", "b", "c"])
    expect(parseArgs(["set", "d", "D-000", '{"gloss":"x"}']).args.value).toEqual([])
    expect(parseArgs(["meta", "d", "nongoals", "a", "b"]).args.value).toEqual(["a", "b"])
  })

  it("applies defaults, optionals and store_true flags", () => {
    const amb = parseArgs(["ambiguity", "d", "claim", "--drop"])
    expect(amb.args.drop).toBe(true)
    expect(amb.args.conflict).toBeNull()
    expect(parseArgs(["approve", "d", "D-000"]).args.by).toBe("user")
    expect(parseArgs(["approve", "d", "D-000", "--proposal-hash", "abc"]).args.proposal_hash).toBe("abc")
    expect(parseArgs(["scan", "d"]).args.json).toBe(false)
    expect(parseArgs(["scan", "d", "--json"]).args.json).toBe(true)
    expect(parseArgs(["new", "d", "D-000"]).args.statement).toBeNull()
  })

  it("reports argparse-style errors", () => {
    expect(() => parseArgs(["evidence", "d", "D-000", "--result", "maybe"])).toThrow(/invalid choice: 'maybe'/u)
    expect(() => parseArgs(["meta", "d", "nongoals"])).toThrow(/the following arguments are required: value/u)
    expect(() => parseArgs(["unbind", "d", "D-000", "S01"])).toThrow(/the following arguments are required: --reason/u)
    expect(() => parseArgs(["body", "d", "D-000", "--bogus", "x"])).toThrow(/unrecognized arguments/u)
    expect(() => parseArgs(["reopen", "d", "D-000", "why", "-x"])).toThrow(/unrecognized arguments: -x/u)
    expect(() => parseArgs(["nope", "d"])).toThrow(/invalid choice: 'nope'/u)
    expect(() => parseArgs(["entry", "d", "thing", "H", "D"])).toThrow(/invalid choice: 'thing'/u)
  })
})

describe("batch translation", () => {
  it("shapes shorthand operations like the Python CLI", () => {
    expect(operations([{ verb: "new", id: "D-000", statement: "r <- f(x)" }])).toEqual([["new", "D-000", "r <- f(x)"]])
    expect(operations([{ verb: "set", id: "D-000", fields: { gloss: "g" } }])).toEqual([["set", "D-000", '{"gloss":"g"}']])
    expect(operations([{ verb: "body", id: "D-000", text: "-> x" }])).toEqual([["body", "D-000", "--text", "-> x"]])
    expect(operations([{ verb: "approve", id: "D-000" }])).toEqual([["approve", "D-000"]])
    expect(operations([{ verb: "observe", id: "D-000", payload: { effect: "e" }, at: "t" }])).toEqual([["observe", "D-000", '{"effect":"e"}', "--at", "t"]])
    expect(operations([{ verb: "adopt", id: "D-001", statement: "r <- g(x)", parent: "D-000" }])).toEqual([["adopt", "D-001", "r <- g(x)", "--parent", "D-000"]])
    expect(operations([{ verb: "evidence", args: ["D-000", "--kind", "test", 3] }])).toEqual([["evidence", "D-000", "--kind", "test", "3"]])
    expect(operations([["reopen", "D-000", "why"]])).toEqual([["reopen", "D-000", "why"]])
  })

  it("rejects malformed operations", () => {
    expect(() => operations([])).toThrow(/nonempty array/u)
    expect(() => operations([{ id: "D-000" }])).toThrow(/needs a verb/u)
    expect(() => operations([{ verb: "set", id: "D-000" }])).toThrow(/fields is required/u)
    expect(() => operations([{ verb: "reopen", id: "D-000", reason: "x", extra: 1 }])).toThrow(/correct its fields/u)
    expect(() => operations([{ verb: "check", id: "D-000" }])).toThrow(/verb\/args/u)
    expect(() => operations([{ verb: "new", statement: "x" }])).toThrow(/id is required/u)
  })
})
