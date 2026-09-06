/** Paper-style pseudocode helpers. Presentation never rewrites approved content. */
import type { BodyItem, NodeRecord } from "./types.js"
import { rstrip, strip, title } from "./pystr.js"

/** Recognize Stepwise and paper-style comments outside string literals. */
export const splitComment = (line: string): [string, string, string] => {
  let quote = ""
  let escaped = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === "▷" || line.startsWith("--", i)) {
      const width = ch === "▷" ? 1 : 2
      return [line.slice(0, i), line.slice(i, i + width), line.slice(i + width)]
    }
  }
  return [line, "", ""]
}

export const signature = (statement: string): string => {
  let value = strip(statement)
  let quote = ""
  let depth = 0
  let escaped = false
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === "(") depth += 1
    else if (ch === ")") depth -= 1
    else if (depth === 0 && (ch === "←" || value.startsWith("<-", i))) {
      value = strip(value.slice(i + (ch === "←" ? 1 : 2)))
      break
    }
  }
  for (const prefix of ["procedure ", "function ", "return ", "->"]) {
    if (value.toLowerCase().startsWith(prefix)) {
      value = strip(value.slice(prefix.length))
      break
    }
  }
  depth = 0
  quote = ""
  escaped = false
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === "(") depth += 1
    else if (ch === ")") {
      depth -= 1
      if (depth === 0) return value.slice(0, i + 1)
    }
  }
  return rstrip(value, ":")
}

/** Normalize legacy assignment/return glyphs outside quoted literals only. */
export const displayCode = (code: string): string => {
  let value = strip(code)
  if (value.startsWith("->")) value = "return " + value.slice(2).replace(/^\s+/u, "")
  let result = ""
  let quote = ""
  let escaped = false
  let i = 0
  while (i < value.length) {
    const ch = value[i]
    if (quote) {
      result += ch
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === quote) quote = ""
    } else if (ch === '"' || ch === "'") {
      quote = ch
      result += ch
    } else if (value.startsWith("<-", i)) {
      result += "←"
      i += 1
    } else result += ch
    i += 1
  }
  return result
}

const HEADINGS: Record<string, string> = { pre: "Require", post: "Ensure", input: "Input", output: "Output" }
export const contractHeading = (label: string): string => HEADINGS[label] ?? title(label)

/** One procedure per node: calls stay calls, preserving return/state scope. */
export const algorithmLines = (nid: string, node: NodeRecord, tag: (item: BodyItem) => string): string[] => {
  const out = [`Algorithm ${nid}: ${node.gloss || signature(node.statement)}`]
  for (const [k, v] of Object.entries(node.contract ?? {})) out.push(`${contractHeading(k)}: ${v}`)
  const body = node.body ?? []
  if (body.length === 0) {
    if (node.target) out.push("Implementation target: " + node.target)
    else if (node.implementation_plan) {
      out.push("Implementation approach: " + node.implementation_plan.approach)
      out.push("Validation plan: " + node.implementation_plan.validation)
    }
    return out
  }
  const width = String(body.length + 2).length
  out.push(`${"1".padStart(width)}: procedure ${signature(node.statement)}`)
  body.forEach((item, index) => {
    const note = tag(item)
    const code = " ".repeat(2 + (item.indent ?? 0)) + displayCode(item.code)
    out.push(`${String(index + 2).padStart(width)}: ${code}` + (note ? `  ▷ ${note}` : ""))
  })
  out.push(`${String(body.length + 2).padStart(width)}: end procedure`)
  return out
}

/** Keep HTML and Markdown notation identical without altering ledger data. */
export const presentation = (ledger: unknown): { signatures: Record<string, string>; code: Record<string, string> } => {
  const signatures: Record<string, string> = {}
  const code: Record<string, string> = {}
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if ((key === "statement" || key === "code") && typeof item === "string") {
          signatures[item] = signature(item)
          code[item] = displayCode(item)
        }
        visit(item)
      }
    }
  }
  visit(ledger)
  return { signatures, code }
}
