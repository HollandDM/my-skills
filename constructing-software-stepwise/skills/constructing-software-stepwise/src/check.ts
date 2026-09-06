/** Lint rules, derived dependencies, and the report line every command ends with. */
import { Effect, FileSystem } from "effect"
import * as nodePath from "node:path"
import { Ledger, relpath } from "./ledger.js"
import { DESIGN, REALIZATION, VERIFICATION, bodyHash, callNames, fnOf, isAdrId, isCtxId, isNodeId, nodeUnknowns, stmtKind, targetOk } from "./core.js"
import { fingerprint, validateBehavior } from "./state.js"
import { renderAll } from "./render.js"
import * as existing from "./existing.js"
import { Io } from "./services.js"
import { asFail } from "./errors.js"
import { isAlnumChar, maxStr, minStr, partition, repr, reprList, reprTuple, split, splitWs, strip } from "./pystr.js"

/** Pure lint over the in-memory ledger; `views` compares generated views with `viewsOnDisk`. */
export const checkSync = (led: Ledger, viewsOnDisk?: Map<string, string | null>): void => {
  const E = (msg: string): void => { led.errors.push(msg) }
  const W = (msg: string): void => { led.warnings.push(msg) }
  const nodes = led.nodes
  led.errors.push(...existing.validate(led))
  const fr = led.frontier()
  const liveRoots = led.roots().filter((r) => !["retired", "superseded"].includes(nodes[r].design))
  if (Object.keys(nodes).length && liveRoots.length !== 1) {
    const first = minStr(liveRoots, "")
    const orphans = liveRoots.filter((r) => r !== first)
    E(`ledger: expected exactly one root node; found ${reprList(liveRoots)}.`
      + (orphans.length ? ` ${orphans.join(", ")} lost every caller when a body was rewritten: \`retire <dir> <id> "reason"\` each node the design dropped, `
        + "or restore the call in the body that used to make it. Never add a call back to satisfy this message." : ""))
  }
  const adrs = led.adrs()
  const adrIds = new Set(adrs.map((a) => a.id))
  for (const [nid, n] of Object.entries(nodes)) {
    const where = nid
    if (!isNodeId(nid)) E(`${where}: invalid node ID`)
    if (!(DESIGN as readonly string[]).includes(n.design)) E(`${where}: design ${repr(n.design)} not in ${reprTuple(DESIGN)}`)
    if (!(REALIZATION as readonly string[]).includes(n.realization)) E(`${where}: realization ${repr(n.realization)} not in ${reprTuple(REALIZATION)}`)
    if (!(VERIFICATION as readonly string[]).includes(n.verification)) E(`${where}: verification ${repr(n.verification)} not in ${reprTuple(VERIFICATION)}`)
    if (n.design === "superseded" && !(n.superseded_by! in nodes) && !fr.has(n.superseded_by!)) E(`${where}: superseded_by ${n.superseded_by === undefined ? "None" : repr(n.superseded_by)} does not exist`)
    if (!fnOf(n.statement)) E(`${where}: statement ${repr(n.statement)} has no call \`f(...)\``)
    const body = n.body ?? []
    const stmts = body.filter((it) => stmtKind(it.code) === "stmt")
    for (const it of stmts) {
      const tagged = "child" in it || "reuse" in it || "target" in it
      if (!tagged && callNames(it.code).length) E(`${where}: untagged call ${repr(it.code)}; tag \`-- D-NNN\` (new id), \`-- ↗ D-NNN\` (reuse) or \`-- ⇒ <target>: <identifier>\``)
      const cid = it.child
      if (!["superseded", "retired"].includes(n.design) && cid !== undefined && cid in nodes && nodes[cid].design === "superseded") E(`${where}: calls ${cid} which is ${led.status(cid)}; call the node that replaced it`)
      if (!["superseded", "retired"].includes(n.design) && "reuse" in it && (!(it.reuse! in nodes) || nodes[it.reuse!].design !== "approved")) E(`${where}: reuse ↗ ${it.reuse} but it is not an approved node`)
      if ("target" in it) {
        const why = targetOk(it.target!)
        if (why) E(`${where}: ${why}`)
      }
    }
    if (n.design === "approved") {
      if (n.approved_content_hash !== fingerprint(n)) E(`${where}: approved content changed; reopen and re-approve it`)
      if (nodeUnknowns(n).length) E(`${where}: approved with unresolved ?${nodeUnknowns(n).join(", ?")}`)
      if (!body.length && !n.target && !n.implementation_plan) E(`${where}: approved needs a refinement body (\`body\`) or a target (\`terminal\`)`)
      if (body.length && !led.isCollapsed(n) && !(n.composition?.length)) E(`${where}: approved composite lacks composition (\`set ${nid} composition ...\`)`)
      if (n.approved_hash && n.approved_hash !== bodyHash(body)) E(`${where}: body changed since approval; \`reopen\` then \`approve\` again`)
      if (n.adr_pending) E(`${where}: approved while ${n.adr_pending} is pending; \`adr accept\` first`)
    }
    for (const ad of n.adaptation ?? []) {
      const clause = strip(partition(ad, ":")[0]).toLowerCase()
      if (!ad.includes("→") && !ad.includes("->") && !(clause in (n.contract ?? {}))) {
        E(`${where}: adaptation ${repr(ad)} must name the clause it maps — '<clause> → <concrete construct>' or '<Clause>: <concrete construct>' (query text, API call + args, type); behaviour prose is not adaptation`)
      }
    }
    if (n.implementation_plan && (body.length || n.target)) E(`${where}: implementation-ready leaves cannot also have a body or target`)
    if (n.behavior && Object.keys(n.behavior).length) {
      const why = validateBehavior(n.behavior)
      if (why) E(`${where}: ${why}`)
    }
    if (n.target) {
      const why = targetOk(n.target)
      if (why) E(`${where}: ${why}`)
      if (body.length && !led.isCollapsed(n)) E(`${where}: has target and child statements; a terminal has no body, a collapsed leaf tags every statement \`-- ⇒\``)
    }
    for (const r of n.depends ?? []) {
      if (isNodeId(r) || isAdrId(r)) {
        if (!led.resolves(r)) E(`${where}: depends on ${r} which does not exist`)
        else if (isNodeId(r) && n.design === "approved") {
          const u = nodes[r]
          if (u && ["stale", "superseded", "retired"].includes(u.design)) E(`${where}: depends on ${r} which is ${led.status(r)}; \`stale\` this node and re-approve it against the live design, or re-point the dependency`)
        }
        continue
      }
      const e = led.entry(r)
      if (!e) E(`${where}: depends on ${repr(r)}: no term / fact / scenario with that name or id (\`entry\` first)`)
      else if (n.design === "approved" && n.approved_at) {
        const last = maxStr((e[2].changed ?? []).map((c) => c.at), "")
        if (last > n.approved_at) E(`${where}: ${e[1]} changed ${last.slice(0, 10)} after approval ${n.approved_at.slice(0, 10)}; \`stale\` or \`reopen\`+\`approve\``)
      }
    }
    if (n.adr_pending && !adrIds.has(n.adr_pending)) E(`${where}: adr_pending ${n.adr_pending} has no file`)
  }
  for (const a of adrs) {
    for (const rid of a.constrains) {
      if (!["superseded", "deprecated"].includes(a.status) && rid in nodes && nodes[rid].design === "superseded") E(`${nodePath.basename(a.path)}: constrains ${rid} which is ${led.status(rid)}; re-point to the live node`)
      else if (!(rid in nodes) && !fr.has(rid)) E(`${nodePath.basename(a.path)}: constrains ${rid} which does not exist`)
    }
    if (a.lines.join("\n").includes("<1–3 sentences")) W(`${nodePath.basename(a.path)}: paragraph still a placeholder`)
  }
  const live = Object.values(nodes).filter((n) => !["retired", "superseded"].includes(n.design) && Object.keys(n.contract ?? {}).length)
  const prose = live.map((n) => [n.statement ?? "", n.effect ?? "", ...Object.values(n.contract ?? {})].join(" ").toLowerCase()).join(" ")
  const words = new Set(splitWs(Array.from(prose).map((c) => (isAlnumChar(c) ? c : " ")).join("")))
  const stateful = ["state", "retry", "durable", "workflow", "transition", "concurrent", "concurrency"].some((w) => words.has(w))
  if (live.length && !fr.size && live.every((n) => n.design === "approved") && !Object.keys(led.data!.scenarios ?? {}).length && stateful) {
    W("ledger: complete stateful design has no scenarios; record relevant success and failure paths")
  }
  for (const amb of led.data!.ambiguities ?? []) {
    const r = amb.resolves_at
    if (r in nodes && nodes[r].design === "approved") E(`ambiguity ${repr(amb.claim)} resolves at ${r} which is approved; re-point (\`ambiguity\`) or drop it`)
  }
  for (const f of ["terms", "facts", "scenarios"] as const) {
    for (const [k, e] of Object.entries(led.data![f] ?? {})) {
      if (!(e.definition || e.then)) E(`${f}/${k}: empty definition`)
      if (f === "scenarios" && e.settles && !led.termsIn(e.settles).length) W(`${f}/${k}: settles ${repr(e.settles)} names no term`)
      for (const t of e.not ?? []) if (!led.entry(t)) W(`${f}/${k}: not ${repr(t)} is not a term`)
    }
  }
  if (viewsOnDisk) {
    for (const [p, text] of renderAll(led)) {
      const onDisk = viewsOnDisk.get(p)
      if (onDisk === null || onDisk === undefined) E(`${nodePath.basename(p)}: missing; run sync`)
      else if (onDisk !== text) E(`${relpath(p, led.dir)}: generated view edited or stale; run sync (edit the ledger via the CLI, never the view)`)
    }
  }
}

/** Read the generated views from disk so `checkSync` can compare them. */
export const readViews = Effect.fn("readViews")(function* (led: Ledger) {
  const fs = yield* FileSystem.FileSystem
  const out = new Map<string, string | null>()
  for (const p of renderAll(led).keys()) {
    const exists = yield* asFail(fs.exists(p))
    out.set(p, exists ? yield* asFail(fs.readFileString(p)) : null)
  }
  return out
})

export const check = Effect.fn("check")(function* (led: Ledger, options: { views: boolean } = { views: true }) {
  const views = options.views ? yield* readViews(led) : undefined
  checkSync(led, views)
})

export const compactErrors = (errors: string[]): string[] => {
  const grouped = new Map<string, string[]>()
  const rest: string[] = []
  for (const error of errors) {
    const [, marker, tail] = partition(error, ": constrains ")
    const node = marker ? split(tail, " ", 1)[0] : ""
    if (marker && isNodeId(node)) {
      if (!grouped.has(node)) grouped.set(node, [])
      grouped.get(node)!.push(error)
    } else rest.push(error)
  }
  for (const node of [...grouped.keys()].sort()) {
    const items = grouped.get(node)!
    if (items.length === 1) rest.push(...items)
    else rest.push(`${items.length} ADRs are blocked by ${node}; run \`repair\` for dependency order`)
  }
  return rest
}

/** Print warnings, errors and the summary line; 1 when errors exist. */
export const report = Effect.fn("report")(function* (led: Ledger, head = "") {
  const io = yield* Io
  if (head) io.out(head + "\n")
  for (const w of led.warnings) io.out(`warn  ${w}\n`)
  for (const e of compactErrors(led.errors)) io.out(`error ${e}\n`)
  io.out(`${led.errors.length ? "FAIL" : "ok"}  ${nodePath.basename(led.dir)}: ${Object.keys(led.nodes).length} nodes, ${led.frontier().size} frontier, ${led.errors.length} errors, ${led.warnings.length} warnings\n`)
  return led.errors.length ? 1 : 0
})

/** A term / CTX id / ADR id named in a node's prose is a dependency; record it so `Used by` and staleness follow. */
export const deriveDepends = (led: Ledger): void => {
  const adrs = led.adrs()
  const adrIds = new Set(adrs.map((a) => a.id))
  for (const adr of adrs) {
    for (const nid of adr.constrains) {
      const n = led.nodes[nid]
      if (n !== undefined) {
        n.depends ??= []
        if (!n.depends.includes(adr.id)) n.depends.push(adr.id)
      }
    }
  }
  for (const [nid, n] of Object.entries(led.nodes)) {
    const text = [n.gloss ?? "", n.effect ?? "", ...Object.values(n.contract ?? {})].join(" ")
    const deps = (n.depends ??= [])
    const called = new Set((n.body ?? []).map((it) => it.child || it.reuse))
    for (const word of splitWs(text)) {
      const w = strip(word, ",.;:()[]`")
      if ((isCtxId(w) && led.entry(w)) || (isAdrId(w) && adrIds.has(w)) || (isNodeId(w) && w !== nid && !called.has(w) && w in led.nodes)) {
        if (!deps.includes(w)) deps.push(w)
      }
    }
    for (const rows of Object.values(n.behavior ?? {})) {
      for (const row of rows ?? []) {
        const ref = row.node as string | undefined
        if (ref && ref !== nid && !deps.includes(ref)) deps.push(ref)
      }
    }
    const padded = ` ${text} `
    const cleaned = padded.replaceAll(",", " ").replaceAll(".", " ").replaceAll(";", " ").replaceAll("(", " ").replaceAll(")", " ")
    for (const t of Object.keys(led.data!.terms ?? {})) if (cleaned.includes(` ${t} `) && !deps.includes(t)) deps.push(t)
  }
}
