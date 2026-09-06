import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { pyJsonDumps } from "../src/pyjson.js"
import { isAlnum, isAlpha, isDigit, isIdentifier, isLower, isUpper, repr, splitWs, strip, title } from "../src/pystr.js"

const cases = JSON.parse(readFileSync(new URL("./fixtures/python-parity.json", import.meta.url), "utf8"))

describe("CPython json.dumps parity", () => {
  it("matches sort_keys + ensure_ascii", () => {
    for (const c of cases.json) expect(pyJsonDumps(c.value, { sortKeys: true })).toBe(c.sorted_ascii)
  })
  it("matches sort_keys + raw unicode", () => {
    for (const c of cases.json) expect(pyJsonDumps(c.value, { sortKeys: true, ensureAscii: false })).toBe(c.sorted_raw)
  })
  it("matches indent=1 raw and indent=2 ascii", () => {
    for (const c of cases.json) {
      expect(pyJsonDumps(c.value, { indent: 1, ensureAscii: false })).toBe(c.indent1)
      expect(pyJsonDumps(c.value, { indent: 2 })).toBe(c.indent2)
    }
  })
})

describe("CPython str parity", () => {
  it("matches predicates and transforms", () => {
    for (const c of cases.str) {
      expect(title(c.s), `title ${JSON.stringify(c.s)}`).toBe(c.title)
      expect(isAlpha(c.s), `isalpha ${JSON.stringify(c.s)}`).toBe(c.isalpha)
      expect(isAlnum(c.s), `isalnum ${JSON.stringify(c.s)}`).toBe(c.isalnum)
      expect(isDigit(c.s), `isdigit ${JSON.stringify(c.s)}`).toBe(c.isdigit)
      expect(isIdentifier(c.s), `isidentifier ${JSON.stringify(c.s)}`).toBe(c.isidentifier)
      expect(isLower(c.s), `islower ${JSON.stringify(c.s)}`).toBe(c.islower)
      expect(isUpper(c.s), `isupper ${JSON.stringify(c.s)}`).toBe(c.isupper)
      expect(splitWs(c.s), `split ${JSON.stringify(c.s)}`).toEqual(c.split)
      expect(strip(c.s), `strip ${JSON.stringify(c.s)}`).toBe(c.strip)
      expect(repr(c.s), `repr ${JSON.stringify(c.s)}`).toBe(c.repr)
    }
  })
})
