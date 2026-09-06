/** Approval fingerprints, evidence coverage, and behavior-diagram validation. */
import type { Evidence, NodeRecord } from "./types.js"
import { sha256Json } from "./hash.js"
import { sorted } from "./pystr.js"

export const CONTENT_FIELDS = ["statement", "gloss", "effect", "contract", "body", "target", "walkthrough",
  "composition", "decisions", "deferred", "adaptation", "depends", "implementation_plan", "behavior"] as const

const truthy = (v: unknown): boolean => {
  if (v === undefined || v === null || v === false || v === 0 || v === "") return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === "object") return Object.keys(v as object).length > 0
  return true
}
export { truthy }

export const fingerprint = (node: NodeRecord): string => {
  const content: Record<string, unknown> = {}
  for (const key of CONTENT_FIELDS) if (truthy(node[key])) content[key] = node[key]
  return sha256Json(content, { sortKeys: true, ensureAscii: false })
}

export const currentEvidence = (node: NodeRecord): Array<[string, Evidence]> => {
  if (node.design !== "approved" || node.approved_content_hash !== fingerprint(node)) return []
  return (node.evidence ?? []).map((ev, i) => [`EV-${i + 1}`, ev] as [string, Evidence]).filter(([, ev]) =>
    (ev.dependency_hash ?? "") === (node.evidence_context ?? "")
    && ev.revision === (node.revision ?? 0)
    && ev.content_hash === node.approved_content_hash)
}

export interface Coverage {
  status: string
  covered: string[]
  missing: string[]
  failed: string[]
}

/** Latest result per check, with explicit resolution across different checks. */
export const coverage = (node: NodeRecord): Coverage => {
  const clauses = new Set(Object.keys(node.contract ?? {}))
  const records = node.evidence ?? []
  const evidence = currentEvidence(node)
  const resolved = new Set<string>()
  for (const [, ev] of evidence) if (ev.result === "pass" && !ev.withdrawn) for (const ref of ev.resolves ?? []) resolved.add(ref)
  const latest = new Map<string, { clause: string; result: string }>()
  for (const [eid, ev] of evidence) {
    if (ev.withdrawn) continue
    if (ev.result === "fail" && resolved.has(eid)) continue
    const list = ev.clauses && ev.clauses.length ? ev.clauses : [""]
    for (const clause of list) latest.set(JSON.stringify([clause, ev.kind ?? null, ev.ref ?? null]), { clause, result: ev.result })
  }
  const failures = sorted(new Set([...latest.values()].filter((v) => v.result === "fail").map((v) => v.clause || "(unscoped)")))
  const passed = new Set([...latest.values()].filter((v) => v.result === "pass" && clauses.has(v.clause)).map((v) => v.clause))
  let status: string
  if (failures.length) status = "failed"
  else if (clauses.size && passed.size === clauses.size && [...clauses].every((c) => passed.has(c))) status = "verified"
  else if (latest.size) status = "partial"
  else if (records.length) status = "stale"
  else status = "unverified"
  return { status, covered: sorted(passed), missing: sorted([...clauses].filter((c) => !passed.has(c))), failed: failures }
}

export const refresh = (nodes: Record<string, NodeRecord>): void => {
  for (const node of Object.values(nodes)) node.verification = coverage(node).status
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const nonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0

export const validateBehavior = (value: unknown): string => {
  if (!isPlainObject(value) || Object.keys(value).some((k) => !["states", "transitions", "participants", "messages"].includes(k))) {
    return "behavior must contain states/transitions and/or participants/messages arrays"
  }
  const ids: Record<string, Set<string>> = {}
  for (const field of ["states", "participants"]) {
    const rows = value[field] ?? []
    if (!Array.isArray(rows)) return `behavior.${field} must be an array`
    ids[field] = new Set()
    for (const row of rows) {
      if (!isPlainObject(row) || !nonEmptyString(row.id) || !nonEmptyString(row.label)) return `behavior.${field} items need nonempty id and label strings`
      if (ids[field].has(row.id)) return `behavior.${field}: duplicate id ${row.id}`
      ids[field].add(row.id)
      for (const flag of ["initial", "terminal"]) if (flag in row && typeof row[flag] !== "boolean") return `behavior.${field}.${flag} must be boolean`
      if ("node" in row && typeof row.node !== "string") return `behavior.${field}.node must be a node ID`
    }
  }
  for (const [field, endpoints, label] of [["transitions", "states", "event"], ["messages", "participants", "label"]] as const) {
    const rows = value[field] ?? []
    if (!Array.isArray(rows)) return `behavior.${field} must be an array`
    for (const row of rows) {
      if (!isPlainObject(row) || !nonEmptyString(row[label])) return `behavior.${field} items need a nonempty ${label}`
      if (typeof row.from !== "string" || typeof row.to !== "string" || !ids[endpoints].has(row.from) || !ids[endpoints].has(row.to)) return `behavior.${field} endpoints must name recorded ${endpoints}`
      for (const key of ["guard", "action", "node", "kind"]) if (key in row && typeof row[key] !== "string") return `behavior.${field}.${key} must be a string`
    }
  }
  return ""
}
