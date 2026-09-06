/** Generated Markdown views: DESIGN.md, CONTEXT.md, nodes/D-NNN.md. */
import * as nodePath from "node:path"
import { Ledger, linkRef } from "./ledger.js"
import type { ContextEntry, NodeRecord } from "./types.js"
import { GENERATED, anchorOf, bodyText, fnOf, itemTag } from "./core.js"
import { algorithmLines } from "./pseudocode.js"
import { coverage } from "./state.js"
import { pyJsonDumps } from "./pyjson.js"
import { pyCompare, pyGet, sortedTuples, split, title } from "./pystr.js"

/** Why the node left `approved`, from the verb that moved it. */
export const stateLine = (n: NodeRecord): string[] => {
  if (n.design === "draft" || n.design === "approved") return []
  const last = [...(n.history ?? [])].reverse().find((h) => ["stale", "superseded", "retired", "reopened"].includes(h.event))
  if (!last) return []
  let line = `${title(last.event)}: ${last.date}` + (last.reason ? ` — ${last.reason}` : "")
  if (n.design === "stale" && n.stale_by?.length) line += ` · invalidated by ${n.stale_by.join(", ")}`
  return [line]
}

const firstSentence = (definition: string): string => split(definition, ". ")[0].replace(/\.+$/u, "")

export const renderNode = (led: Ledger, nid: string): string => {
  const n = led.nodes[nid]
  const p = nodePath.join(led.dir, "nodes", `${nid}.md`)
  const L: string[] = [`# ${nid} — ${fnOf(n.statement) || nid}`, "", GENERATED, "",
    "Kind: node · Index: [../DESIGN.md](../DESIGN.md)",
    `Design: ${led.status(nid)} · Realization: ${n.realization} · Verification: ${n.verification}`,
    `Parents: ${led.parents(nid).map((x) => linkRef(led, x, p)).join(", ") || "-"}`,
    `Depends on: ${(n.depends ?? []).map((x) => linkRef(led, x, p)).join(", ") || "-"}`,
    `Approved: ${n.approved || "-"}`,
    ...stateLine(n), "",
    "## Statement", "", `\`${n.statement}\`` + (n.gloss ? ` — ${n.gloss}` : ""), "",
    "## Effect", "", n.effect || "-", "",
    "## Contract", ""]
  const contract = Object.entries(n.contract ?? {})
  L.push(...(contract.length ? contract.map(([k, v]) => `- ${title(k)}: ${v}`) : ["-"]))
  if (n.body?.length) {
    L.push("", "## Refinement", "")
    if (n.walkthrough?.length) L.push("What it does:", ...n.walkthrough.map((ln) => `${ln}`), "")
    L.push("```pseudo", ...algorithmLines(nid, n, itemTag), "```")
    const lines = n.body.filter((it) => "child" in it || "reuse" in it || "target" in it).map((it) => [
      it.child || it.reuse || it.target || "",
      it.gloss || led.nodes[it.child || it.reuse || ""]?.gloss || "",
    ] as [string, string])
    if (lines.some(([, g]) => g)) L.push("", ...lines.filter(([, g]) => g).map(([c, g]) => `- ${c} — ${g}`))
  }
  const children = new Set((n.body ?? []).map((it) => it.child).filter(Boolean))
  const deferred = [...(n.deferred ?? []), ...(led.data!.ambiguities ?? []).filter((a) => children.has(a.resolves_at)).map((a) => `${a.claim} — ${a.conflict} → ${a.resolves_at}`)]
  for (const [heading, items] of [["Composition argument", n.composition ?? []], ["Decisions", n.decisions ?? []], ["Deferred", deferred]] as Array<[string, string[]]>) {
    if (items.length) L.push("", `## ${heading}`, "", ...items.map((b) => `- ${b}`))
  }
  const s = n.superseded as { date: string; reason?: string; body?: NodeRecord["body"]; composition?: string[]; decisions?: string[]; deferred?: string[] } | undefined
  if (s) {
    L.push("", "## Superseded refinement", "", `Replaced ${s.date}` + (s.reason ? ` — ${s.reason}` : ""))
    if (s.body?.length) L.push("", "```pseudo", ...bodyText(s.body), "```")
    for (const [f, heading] of [["composition", "Composition argument"], ["decisions", "Decisions"], ["deferred", "Deferred"]] as const) {
      const items = s[f]
      if (items?.length) L.push("", `Superseded ${heading.toLowerCase()}:`, ...items.map((b) => `- ${b}`))
    }
  }
  const collapsed = !n.target && led.isCollapsed(n)
  if (n.target || n.adaptation?.length || collapsed) {
    L.push("", "## Realization", "")
    if (n.target) L.push(`Target: \`${n.target}\``)
    else if (collapsed) {
      const heads = [...new Set((n.body ?? []).filter((it) => it.target).map((it) => split(it.target!, ":", 1)[0].trim()))]
      L.push("Collapsed leaf. Targets: " + heads.map((h) => `\`${h}\``).join(", "))
    }
    L.push(...(n.adaptation ?? []).map((a) => `Adaptation: ${a}`))
  }
  if ((n.bindings && Object.keys(n.bindings).length) || n.observation || n.origin === "existing-code") {
    L.push("", "## Existing implementation", `Sources: ${pyGet(n, "source_state", "unbound")} · Conformance: ${n.conformance?.status ?? "unassessed"}`,
      `Current implementation: ${pyGet(n, "current_implementation_version", "unknown")}`,
      `Recorded implementation revision: ${pyGet(n, "implementation_revision", "0")} · ${pyGet(n, "implementation_version", "none")}`)
    for (const [sid, b] of Object.entries(n.bindings ?? {})) L.push(`- ${sid}: \`${b.path}\`` + (b.symbol ? ` · ${b.symbol}` : "") + ` · SHA-256 ${b.baseline_sha256}`)
    if (n.observed_children?.length) L.push("", "Observed children: " + n.observed_children.map((cid) => linkRef(led, cid, p)).join(", "))
    const obs = n.observation
    if (obs) {
      L.push("", "### Observed behavior", obs.effect, `Inspected: ${obs.date} by ${obs.by} · implementation ${pyGet(obs, "implementation_version", "unknown")}`)
      L.push(...obs.claims.map((c) => `- ${c.basis}: ${c.text} (sources: ${c.sources.join(", ")})`))
      if (obs.body?.length) L.push("", "```pseudo", ...bodyText(obs.body), "```")
      if (obs.unknowns?.length) L.push("", "### Unknowns", ...obs.unknowns.map((v) => `- ${v}`))
      for (const [clause, value] of Object.entries(obs.comparisons ?? {})) L.push(`- Intended ${clause}: ${value.status} — ${value.reason}`)
    }
  }
  if (n.implementation_plan) L.push("", "## Implementation plan", ...Object.entries(n.implementation_plan).map(([k, v]) => `- ${title(k)}: ${v}`))
  if (n.behavior && Object.keys(n.behavior).length) L.push("", "## Behavior diagrams", "```json", pyJsonDumps(n.behavior, { indent: 2 }), "```")
  const cov = coverage(n)
  L.push("", "## Evidence coverage", `Covered: ${cov.covered.join(", ") || "none"} · Missing: ${cov.missing.join(", ") || "none"} · Failed: ${cov.failed.join(", ") || "none"}`)
  if (n.evidence?.length) {
    L.push("", "## Evidence", "")
    n.evidence.forEach((ev, i) => {
      const result = ev.withdrawn ? "withdrawn" : ev.result
      let detail = `${ev.date} · ${ev.ref} · Covers: ${(ev.clauses?.length ? ev.clauses : ev.covers ?? []).join(", ")} · revision ${pyGet(ev as unknown as Record<string, unknown>, "revision", "legacy")}`
      if (ev.scope) detail += ` · Scope: ${ev.scope}`
      if (ev.scenario) detail += ` · Scenario: ${ev.scenario}`
      if (ev.assessment) detail += ` · Assessment: ${ev.assessment}`
      if (ev.resolves?.length) detail += ` · Resolves: ${ev.resolves.join(", ")}`
      if (ev.note) detail += ` · ${ev.note}`
      if (ev.withdrawn) detail += ` · Withdrawn ${ev.withdrawn.date} by ${ev.withdrawn.by}: ${ev.withdrawn.reason}`
      L.push(`### EV-${i + 1} ${ev.kind} — ${result}`, detail)
    })
  }
  if (n.history?.length) L.push("", "## History", "", ...n.history.map((h) => `- ${h.date} — ${h.event}` + (h.reason ? `: ${h.reason}` : "")))
  return L.join("\n") + "\n"
}

export const tagFor = (led: Ledger, cid: string, reuse: boolean): string => {
  const n = led.nodes[cid]
  if (n && n.design === "approved" && led.isTerminal(n)) return `${cid} ${n.verification === "verified" ? "✓" : "⇒"} ${n.target}`
  if (n && n.design === "approved" && n.implementation_plan) return `${cid} ◇ implementation-ready`
  if (reuse || (n && led.parents(cid).length >= 2)) return `↗ ${cid}`
  if (!n) return `${cid} (frontier)`
  if (n.design === "draft") return `${cid} (${led.status(cid)})`
  if (n.design === "stale" || n.design === "superseded") return `${cid} (${led.status(cid)})`
  if (led.isTerminal(n)) return `${cid} ${n.verification === "verified" ? "✓" : "⇒"} ${n.target}`
  return cid
}

export const renderProgram = (led: Ledger): [string[], string[]] => {
  const main: string[] = []
  const procs: string[] = []
  const roots = new Set(led.roots())
  for (const [nid, n] of Object.entries(led.nodes)) {
    if ((!n.body?.length && !roots.has(nid)) || ["draft", "retired", "superseded"].includes(n.design)) continue
    const destination = roots.has(nid) ? main : procs
    if (destination.length) destination.push("")
    destination.push(`${nid} · ${led.status(nid)}`)
    destination.push(...algorithmLines(nid, n, itemTag))
  }
  return [main, procs]
}

export const renderDesign = (led: Ledger): string => {
  const d = led.dir
  const fr = led.frontier()
  const frontier = [...new Set([...fr.keys(), ...Object.entries(led.nodes).filter(([, n]) => n.design === "draft").map(([nid]) => nid)])].sort(pyCompare)
  const L: string[] = [`# ${led.title} — Design`, "", GENERATED, "", "Kind: index · Context: [./CONTEXT.md](./CONTEXT.md)",
    `Root: ${led.roots().join(", ") || "-"} · Active frontier: ${frontier.join(", ") || "-"}`, "", "## Applicable ADRs", ""]
  const adrs = led.adrs()
  const designPath = nodePath.join(d, "DESIGN.md")
  L.push(...(adrs.length ? adrs.map((a) => `- [${a.id} ${a.title}](${led.rel(designPath, a.path)}) — ${a.status} — constrains ${a.constrains.join(", ") || "-"}`) : ["- none"]))
  L.push("", "## Nodes", "", "| ID | Statement | Parents | Design | Realization | Verification | File |", "| --- | --- | --- | --- | --- | --- | --- |")
  const rows: string[][] = Object.entries(led.nodes).map(([nid, n]) => [nid, n.statement.replaceAll("|", "\\|"), led.parents(nid).join(", ") || "-", led.status(nid), n.realization, n.verification, `[nodes/${nid}.md](nodes/${nid}.md)`])
  for (const [fid, [s, p]] of fr) rows.push([fid, s.replaceAll("|", "\\|"), p, "frontier", "not-started", "unverified", "-"])
  L.push(...sortedTuples(rows).map((r) => "| " + r.join(" | ") + " |"))
  const [main, procs] = renderProgram(led)
  L.push("", "## Program", "", "```pseudo", ...main, "```")
  if (procs.length) L.push("", "### Procedures", "", "```pseudo", ...procs, "```")
  const observed = Object.entries(led.nodes).filter(([, n]) => n.origin === "existing-code" || n.observation)
  if (observed.length) {
    L.push("", "## Observed implementation", "", "| Node | Observed children | Source state | Conformance |", "| --- | --- | --- | --- |")
    L.push(...observed.map(([nid, n]) => `| [${nid}](nodes/${nid}.md) | ${(n.observed_children ?? []).join(", ") || "-"} | ${pyGet(n, "source_state", "unbound")} | ${n.conformance?.status ?? "unassessed"} |`))
    L.push("", "Observed behavior is descriptive; it does not approve an intended contract. Use `scan` to find changes and unfinished inspection.")
  }
  return L.join("\n") + "\n"
}

const changedLines = (e: ContextEntry): string[] => (e.changed ?? []).map((c) => `Changed: ${c.at.slice(0, 10)} — ${c.reason}`)
const byLowerKey = (entries: Array<[string, ContextEntry]>): Array<[string, ContextEntry]> => [...entries].sort((a, b) => pyCompare(a[0].toLowerCase(), b[0].toLowerCase()))
const byKey = (entries: Array<[string, ContextEntry]>): Array<[string, ContextEntry]> => [...entries].sort((a, b) => pyCompare(a[0], b[0]))

export const renderContext = (led: Ledger): string => {
  const D = led.data!
  const used = led.usedBy()
  const terms = byLowerKey(Object.entries(D.terms ?? {}))
  const facts = byKey(Object.entries(D.facts ?? {}))
  const scenarios = byKey(Object.entries(D.scenarios ?? {}))
  const L: string[] = [`# ${led.title} — Shared Context`, "", GENERATED, "", "Kind: index · Status: active · Design: [./DESIGN.md](./DESIGN.md)", "",
    "## Scope", "", D.scope || "-", "", "## Vocabulary", "", "| Term | Is | Avoid | Used by |", "| --- | --- | --- | --- |"]
  for (const [k, e] of terms) L.push(`| [${k}](#${anchorOf(k)}) | ${firstSentence(e.definition)} | ${(e.avoid ?? []).join(", ") || "-"} | ${(used[k] ?? []).join(", ") || "-"} |`)
  L.push("", "## Facts and constraints", "", "| ID | Fact | Status | Used by |", "| --- | --- | --- | --- |")
  for (const [k, e] of facts) L.push(`| [${k}](#${anchorOf(k + " " + e.name)}) | ${firstSentence(e.definition)} | ${e.status ?? "confirmed"} | ${(used[k] ?? []).join(", ") || "-"} |`)
  L.push("", "## Scenarios", "", "| ID | Scenario | Settles |", "| --- | --- | --- |")
  for (const [k, e] of scenarios) L.push(`| [${k}](#${anchorOf(k + " " + e.name)}) | ${e.name} | ${e.settles || "-"} |`)
  L.push("", "## Open ambiguities", "", "| Term / claim | Conflict | Resolves at |", "| --- | --- | --- |")
  L.push(...(D.ambiguities ?? []).map((a) => `| ${a.claim} | ${a.conflict} | ${a.resolves_at} |`))
  L.push("", "## Explicit non-goals", "", ...((D.nongoals ?? []).length ? D.nongoals.map((g) => `- ${g}`) : ["- none"]))
  L.push("", "## Terms", "")
  for (const [k, e] of terms) {
    L.push(`### ${k}`, "", `Confirmed: ${e.confirmed}` + (e.source ? ` · Source: ${e.source}` : ""), "", e.definition)
    for (const [lab, key] of [["Avoid", "avoid"], ["Not", "not"]] as const) {
      const values = e[key]
      if (values?.length) L.push(`${lab}: ${values.join(", ")}`)
    }
    if (e.example) L.push(`Example: ${e.example}`)
    L.push(`Used by: ${(used[k] ?? []).join(", ") || "-"}`, ...changedLines(e), "")
  }
  L.push("## Facts", "")
  for (const [k, e] of facts) {
    L.push(`### ${k} ${e.name}`, "", `Status: ${e.status ?? "confirmed"} · Confirmed: ${e.confirmed}` + (e.source ? ` · Source: ${e.source}` : ""), "",
      e.definition, `Used by: ${(used[k] ?? []).join(", ") || "-"}`, ...changedLines(e), "")
  }
  L.push("## Scenario entries", "")
  for (const [k, e] of scenarios) {
    L.push(`### ${k} ${e.name}`, "", `Confirmed: ${e.confirmed}` + (e.settles ? ` · Settles: ${e.settles}` : ""), "")
    for (const w of ["given", "when", "then"] as const) if (e[w]) L.push(`${title(w)} ${e[w]}`)
    if (e.excludes) L.push(`Excludes: ${e.excludes}`)
    L.push(...changedLines(e), "")
  }
  return L.join("\n").replace(/\n+$/u, "") + "\n"
}

export const renderAll = (led: Ledger): Map<string, string> => {
  const out = new Map<string, string>()
  out.set(nodePath.join(led.dir, "DESIGN.md"), renderDesign(led))
  out.set(nodePath.join(led.dir, "CONTEXT.md"), renderContext(led))
  for (const nid of Object.keys(led.nodes)) out.set(nodePath.join(led.dir, "nodes", `${nid}.md`), renderNode(led, nid))
  return out
}
