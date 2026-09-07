/** Algorithm traceability is independent of source freshness and design approval. */
import { callNames, fnOf, targetOk } from "./core.js"
import type { Behavior, NodeRecord } from "./types.js"

export interface AlgorithmIssue {
  node: string
  basis: "intended" | "observed"
  /** Displayed algorithm line, including the generated procedure header. */
  line?: number
  kind: "missing-body" | "unlinked-call" | "missing-procedure" | "historical-procedure" | "unexplained-relationship" | "invalid-target"
  message: string
  candidates?: string[]
}

export interface AlgorithmAudit {
  complete: boolean
  procedures: number
  issues: AlgorithmIssue[]
}

const diagramRefs = (behavior?: Behavior): Set<string> => {
  const refs = new Set<string>()
  for (const rows of Object.values(behavior || {})) {
    for (const row of rows || []) if (typeof row.node === "string") refs.add(row.node)
  }
  return refs
}

export const auditAlgorithms = (nodes: Record<string, NodeRecord>): AlgorithmAudit => {
  const issues: AlgorithmIssue[] = []
  let procedures = 0
  const byName = new Map<string, string[]>()
  for (const [id, node] of Object.entries(nodes)) {
    const name = fnOf(node.statement)
    if (name) byName.set(name, [...(byName.get(name) || []), id])
  }
  for (const [id, node] of Object.entries(nodes)) {
    if (["retired", "superseded"].includes(node.design)) continue
    const bases: Array<"intended" | "observed"> = []
    const hasObservation = Boolean(node.observation || node.origin === "existing-code")
    if (!hasObservation || node.body?.length || node.target || node.implementation_plan || Object.keys(node.contract || {}).length) bases.push("intended")
    if (hasObservation) bases.push("observed")
    for (const basis of bases) {
      procedures += 1
      const body = (basis === "observed" ? node.observation?.body : node.body) || []
      if (!body.length && !(basis === "intended" && (node.target || node.implementation_plan))) {
        issues.push({ node: id, basis, kind: "missing-body", message: "No algorithm explains this procedure. Record pseudocode, or an intended terminal/implementation-ready mapping where appropriate." })
      }
      const refs = diagramRefs(basis === "observed" ? node.observation?.behavior : node.behavior)
      for (const [index, step] of body.entries()) {
        const line = index + 2
        const ref = step.child || step.reuse
        if (ref) {
          refs.add(ref)
          if (!(ref in nodes)) issues.push({ node: id, basis, line, kind: "missing-procedure", message: `The step refers to ${ref}, which has no recorded procedure.` })
          else if (["retired", "superseded"].includes(nodes[ref].design)) issues.push({ node: id, basis, line, kind: "historical-procedure", message: `The active algorithm refers to ${ref}, which is ${nodes[ref].design}. Reconcile the call with the current responsibility.` })
        }
        if (step.target) {
          const why = targetOk(step.target)
          if (why) issues.push({ node: id, basis, line, kind: "invalid-target", message: why })
        }
        // Conditions and assertions can hide substantial work too. Do not guess links:
        // an explicit reference/target explains the boundary; an untagged call does not.
        if (!ref && !step.target) {
          const names = [...new Set(callNames(step.code))]
          if (names.length) {
            const candidates = [...new Set(names.flatMap((name) => byName.get(name) || []))]
            issues.push({ node: id, basis, line, kind: "unlinked-call", candidates,
              message: `Unlinked operation ${names.join(", ")}. ${candidates.length ? `Possible procedures: ${candidates.join(", ")}. ` : ""}Add an explicit procedure reference or concrete target, or explain the small operation inline.` })
          }
        }
      }
      if (basis === "observed" && node.observation) {
        for (const child of node.observed_children || []) {
          if (!refs.has(child)) issues.push({ node: id, basis, kind: "unexplained-relationship", message: `Observed relationship to ${child} appears in neither pseudocode nor a behavior diagram. Explain the actual call, dispatch, or interaction; do not invent a synchronous call.` })
        }
      }
    }
  }
  return { complete: procedures > 0 && issues.length === 0, procedures, issues }
}

export const describeAlgorithmIssue = (issue: AlgorithmIssue): string =>
  `${issue.node} ${issue.basis}${issue.line === undefined ? "" : ` line ${issue.line}`}: ${issue.message}`
