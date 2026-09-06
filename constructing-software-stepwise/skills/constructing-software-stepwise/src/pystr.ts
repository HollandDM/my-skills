/** Python string semantics the ledger format depends on (Unicode-aware, byte-compatible with CPython). */

const LETTER = /^\p{L}$/u
const ALNUM = /^[\p{L}\p{N}]$/u
const DIGIT = /^\p{Nd}$/u
const IDENT = /^[\p{XID_Start}_][\p{XID_Continue}]*$/u
// CPython str.isspace(): bidirectional class WS/B/S or category Zs.
const SPACE = /[\t\n\v\f\r\x1c-\x1f \x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/u

export const isAlphaChar = (ch: string): boolean => LETTER.test(ch)
export const isAlnumChar = (ch: string): boolean => ALNUM.test(ch)
export const isDigitChar = (ch: string): boolean => DIGIT.test(ch)
export const isSpaceChar = (ch: string): boolean => SPACE.test(ch)

const every = (s: string, pred: (ch: string) => boolean): boolean => {
  if (s.length === 0) return false
  for (const ch of s) if (!pred(ch)) return false
  return true
}

/** str.isalpha() */
export const isAlpha = (s: string): boolean => every(s, isAlphaChar)
/** str.isalnum() */
export const isAlnum = (s: string): boolean => every(s, isAlnumChar)
/** str.isdigit() (decimal digits; superscript digits are not needed by the ledger) */
export const isDigit = (s: string): boolean => every(s, isDigitChar)
/** str.isidentifier() */
export const isIdentifier = (s: string): boolean => s.length > 0 && IDENT.test(s)

const LOWER = /^\p{Lowercase}$/u
const UPPER = /^\p{Uppercase}$/u
const TITLECASE = /^\p{Lt}$/u
const isCased = (ch: string): boolean => LOWER.test(ch) || UPPER.test(ch) || TITLECASE.test(ch)
/** str.islower(): at least one cased character and no uppercase or titlecase ones. */
export const isLower = (s: string): boolean => {
  let cased = false
  for (const ch of s) {
    if (UPPER.test(ch) || TITLECASE.test(ch)) return false
    if (LOWER.test(ch)) cased = true
  }
  return cased
}
/** str.isupper() */
export const isUpper = (s: string): boolean => {
  let cased = false
  for (const ch of s) {
    if (LOWER.test(ch) || TITLECASE.test(ch)) return false
    if (UPPER.test(ch)) cased = true
  }
  return cased
}

const DIGRAPHS: Record<string, string> = { "Ǆ": "ǅ", "ǅ": "ǅ", "ǆ": "ǅ", "Ǉ": "ǈ", "ǈ": "ǈ", "ǉ": "ǈ", "Ǌ": "ǋ", "ǋ": "ǋ", "ǌ": "ǋ", "Ǳ": "ǲ", "ǲ": "ǲ", "ǳ": "ǲ" }
/** Unicode titlecase mapping: multi-character uppercase expansions keep only their first letter capitalized (ß → Ss). */
const titleChar = (ch: string): string => {
  if (DIGRAPHS[ch]) return DIGRAPHS[ch]
  const upper = ch.toUpperCase()
  return upper.length > 1 ? upper[0] + upper.slice(1).toLowerCase() : upper
}

/** str.title(): uppercase the first cased character of every run of cased characters, lowercase the rest. */
export const title = (s: string): string => {
  let out = ""
  let previousCased = false
  for (const ch of s) {
    if (isCased(ch)) {
      out += previousCased ? ch.toLowerCase() : titleChar(ch)
      previousCased = true
    } else {
      out += ch
      previousCased = false
    }
  }
  return out
}

/** str.split() with no separator: runs of whitespace, leading and trailing runs dropped. */
export const splitWs = (s: string): string[] => {
  const out: string[] = []
  let current = ""
  for (const ch of s) {
    if (isSpaceChar(ch)) {
      if (current) out.push(current)
      current = ""
    } else current += ch
  }
  if (current) out.push(current)
  return out
}

/** str.split(sep, maxsplit) */
export const split = (s: string, sep: string, maxsplit = -1): string[] => {
  const out: string[] = []
  let rest = s
  while (maxsplit < 0 || out.length < maxsplit) {
    const at = rest.indexOf(sep)
    if (at < 0) break
    out.push(rest.slice(0, at))
    rest = rest.slice(at + sep.length)
  }
  out.push(rest)
  return out
}

/** str.strip() / str.strip(chars) */
export const strip = (s: string, chars?: string): string => lstrip(rstrip(s, chars), chars)
export const lstrip = (s: string, chars?: string): string => {
  const drop = chars === undefined ? isSpaceChar : (ch: string) => chars.includes(ch)
  let i = 0
  const cps = Array.from(s)
  while (i < cps.length && drop(cps[i])) i++
  return cps.slice(i).join("")
}
export const rstrip = (s: string, chars?: string): string => {
  const drop = chars === undefined ? isSpaceChar : (ch: string) => chars.includes(ch)
  const cps = Array.from(s)
  let j = cps.length
  while (j > 0 && drop(cps[j - 1])) j--
  return cps.slice(0, j).join("")
}

/** str.partition(sep) */
export const partition = (s: string, sep: string): [string, string, string] => {
  const at = s.indexOf(sep)
  return at < 0 ? [s, "", ""] : [s.slice(0, at), sep, s.slice(at + sep.length)]
}

/** Python compares strings by code point; JS sorts by UTF-16 code unit. */
export const pyCompare = (a: string, b: string): number => {
  if (a === b) return 0
  const ia = a[Symbol.iterator]()
  const ib = b[Symbol.iterator]()
  for (;;) {
    const x = ia.next()
    const y = ib.next()
    if (x.done && y.done) return 0
    if (x.done) return -1
    if (y.done) return 1
    const cx = x.value.codePointAt(0)!
    const cy = y.value.codePointAt(0)!
    if (cx !== cy) return cx < cy ? -1 : 1
  }
}
export const sorted = (values: Iterable<string>): string[] => Array.from(values).sort(pyCompare)
/** sorted() over tuples of strings (lexicographic). */
export const sortedTuples = <T extends string[]>(rows: T[]): T[] =>
  [...rows].sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const c = pyCompare(a[i], b[i])
      if (c) return c
    }
    return a.length - b.length
  })
export const maxStr = (values: Iterable<string>, fallback: string): string => {
  let best: string | undefined
  for (const v of values) if (best === undefined || pyCompare(v, best) > 0) best = v
  return best === undefined ? fallback : best
}
export const minStr = (values: Iterable<string>, fallback: string): string => {
  let best: string | undefined
  for (const v of values) if (best === undefined || pyCompare(v, best) < 0) best = v
  return best === undefined ? fallback : best
}

/** repr(str) — CPython picks quotes the same way. */
export const repr = (s: string): string => {
  const quote = s.includes("'") && !s.includes('"') ? '"' : "'"
  let out = quote
  for (const ch of s) {
    const cp = ch.codePointAt(0)!
    if (ch === quote || ch === "\\") out += "\\" + ch
    else if (ch === "\n") out += "\\n"
    else if (ch === "\r") out += "\\r"
    else if (ch === "\t") out += "\\t"
    else if (cp < 0x20 || cp === 0x7f) out += "\\x" + cp.toString(16).padStart(2, "0")
    else if (cp >= 0x80 && !isPrintable(ch)) out += cp <= 0xff ? "\\x" + cp.toString(16).padStart(2, "0") : cp <= 0xffff ? "\\u" + cp.toString(16).padStart(4, "0") : "\\U" + cp.toString(16).padStart(8, "0")
    else out += ch
  }
  return out + quote
}
const isPrintable = (ch: string): boolean => !/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}]/u.test(ch) || ch === " "

/** repr(list[str]) */
export const reprList = (items: string[]): string => "[" + items.map(repr).join(", ") + "]"
/** repr(tuple[str, ...]) */
export const reprTuple = (items: readonly string[]): string => items.length === 1 ? "(" + repr(items[0]) + ",)" : "(" + items.map(repr).join(", ") + ")"

export const zfill = (n: number, width: number): string => String(n).padStart(width, "0")
export const rjust = (s: string, width: number): string => s.padStart(width, " ")
export const ljust = (s: string, width: number): string => s.padEnd(width, " ")

/** str(value) for the scalar shapes an f-string can meet in the ledger. */
export const pyStr = (v: unknown): string => {
  if (v === null || v === undefined) return "None"
  if (v === true) return "True"
  if (v === false) return "False"
  if (typeof v === "string") return v
  if (Array.isArray(v)) return "[" + v.map((x) => (typeof x === "string" ? repr(x) : pyStr(x))).join(", ") + "]"
  return String(v)
}

/** dict.get(key, default) inside an f-string: a present key wins even when its value is None. */
export const pyGet = (obj: Record<string, unknown>, key: string, fallback: string): string => (key in obj ? pyStr(obj[key]) : fallback)
