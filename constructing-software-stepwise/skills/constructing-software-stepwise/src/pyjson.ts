/** Byte-exact port of CPython json.dumps for the value shapes a ledger holds. */
import { pyCompare } from "./pystr.js"

export interface DumpsOptions {
  sortKeys?: boolean
  ensureAscii?: boolean
  indent?: number
}

const hex4 = (n: number): string => "\\u" + n.toString(16).padStart(4, "0")

const encodeString = (s: string, ensureAscii: boolean): string => {
  let out = '"'
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    const ch = s[i]
    if (ch === '"') out += '\\"'
    else if (ch === "\\") out += "\\\\"
    else if (ch === "\n") out += "\\n"
    else if (ch === "\r") out += "\\r"
    else if (ch === "\t") out += "\\t"
    else if (ch === "\b") out += "\\b"
    else if (ch === "\f") out += "\\f"
    else if (code < 0x20) out += hex4(code)
    else if (ensureAscii && code > 0x7e) out += hex4(code) // surrogate halves are emitted one by one, like CPython
    else out += ch
  }
  return out + '"'
}

const encodeNumber = (n: number): string => {
  if (Number.isInteger(n)) return String(n)
  if (!Number.isFinite(n)) return Number.isNaN(n) ? "NaN" : n > 0 ? "Infinity" : "-Infinity"
  return String(n)
}

export const pyJsonDumps = (value: unknown, options: DumpsOptions = {}): string => {
  const sortKeys = options.sortKeys ?? false
  const ensureAscii = options.ensureAscii ?? true
  const indent = options.indent
  const itemSep = indent === undefined ? ", " : ","
  const pad = (level: number): string => indent === undefined ? "" : "\n" + " ".repeat(indent * level)
  const walk = (v: unknown, level: number): string => {
    if (v === null || v === undefined) return "null"
    if (typeof v === "string") return encodeString(v, ensureAscii)
    if (typeof v === "number") return encodeNumber(v)
    if (typeof v === "boolean") return v ? "true" : "false"
    if (Array.isArray(v)) {
      if (v.length === 0) return "[]"
      const inner = v.map((x) => pad(level + 1) + walk(x, level + 1)).join(itemSep)
      return "[" + inner + pad(level) + "]"
    }
    if (typeof v === "object") {
      const keys = Object.keys(v as object)
      if (keys.length === 0) return "{}"
      const ordered = sortKeys ? [...keys].sort(pyCompare) : keys
      const inner = ordered.map((k) => pad(level + 1) + encodeString(k, ensureAscii) + ": " + walk((v as Record<string, unknown>)[k], level + 1)).join(itemSep)
      return "{" + inner + pad(level) + "}"
    }
    throw new TypeError(`Object of type ${typeof v} is not JSON serializable`)
  }
  return walk(value, 0)
}
