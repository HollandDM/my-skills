/** The in-memory ledger: canonical data, staged files, derived structure, ADR files. */
import { Effect, FileSystem } from "effect"
import * as nodePath from "node:path"
import type { AdrRecord, ContextEntry, LedgerData, NodeRecord } from "./types.js"
import { LEDGER, anchorOf, frontierStatement, isAdrId, isCtxId, isNodeId, legacyIntact, nodeUnknowns, stmtKind, GENERATED } from "./core.js"
import { fingerprint, refresh } from "./state.js"
import { isDigit, isUpper, partition, sorted, splitWs, strip, title } from "./pystr.js"
import { sha256Json } from "./hash.js"
import { asFail } from "./errors.js"
import * as existing from "./existing.js"
import type { ScanReport } from "./existing.js"

export type Frontier = Map<string, [string, string]>

export const defaultTitle = (dir: string): string => title(nodePath.basename(dir).replaceAll("-", " "))

export class Ledger {
  readonly dir: string
  readonly path: string
  data: LedgerData | null
  errors: string[] = []
  warnings: string[] = []
  /** Staged file writes (absolute path -> text), committed with the ledger. */
  files = new Map<string, string>()
  messages: string[] = []
  operations: string[] = []
  sourceScan: ScanReport = existing.emptyReport()
  /** Source bytes read once per process; the ledger lock makes this safe. */
  sourceCache = new Map<string, existing.SourceInfo>()
  commits = new Map<string, string | null>()
  /** ADR directory discovered on disk at load time and its markdown files. */
  adrDiskDir: string | null = null
  adrDisk = new Map<string, string>()

  private constructor(dir: string, data: LedgerData | null) {
    this.dir = dir
    this.path = nodePath.join(dir, LEDGER)
    this.data = data
  }

  /** Read <dir>/ledger.json (if any), migrate legacy approval fields, discover ADRs and refresh derived state. */
  static load = Effect.fn("Ledger.load")(function* (dir: string) {
    const fs = yield* FileSystem.FileSystem
    const path = nodePath.join(dir, LEDGER)
    const data = (yield* asFail(fs.exists(path))) ? (JSON.parse(yield* asFail(fs.readFileString(path))) as LedgerData) : null
    const led = new Ledger(dir, data)
    for (const n of Object.values(led.data?.nodes ?? {})) {
      if (!("approved_content_hash" in n) && (n.design === "approved" || n.design === "stale")) {
        if (n.proposal_hash) {
          if (legacyIntact(n)) n.approved_content_hash = fingerprint(n)
          else if (n.design === "approved") n.design = "stale"
        } else if (n.design === "approved") n.approved_content_hash = fingerprint(n)
        if (n.revision === undefined) n.revision = 0
      }
    }
    yield* led.discoverAdrs()
    if (led.data) yield* refreshLedger(led)
    return led
  })

  static create = Effect.fn("Ledger.create")(function* (dir: string, titleText: string) {
    const fs = yield* FileSystem.FileSystem
    yield* asFail(fs.makeDirectory(dir, { recursive: true }))
    const led = yield* Ledger.load(dir)
    led.data = { schema: 1, title: titleText, scope: "", nongoals: [], ambiguities: [], nodes: {}, terms: {}, facts: {}, scenarios: {} }
    return led
  })

  /** Locate `adr/` next to the ledger or up to four parents above it, and cache its markdown files. */
  discoverAdrs = Effect.fn("Ledger.discoverAdrs")(function* (this: Ledger) {
    const fs = yield* FileSystem.FileSystem
    const candidates = [this.dir]
    let cursor = this.dir
    while (candidates.length < 5) {
      const parent = nodePath.dirname(cursor)
      if (parent === cursor) break
      candidates.push(parent)
      cursor = parent
    }
    for (const base of candidates) {
      const candidate = nodePath.join(base, "adr")
      const info = yield* fs.stat(candidate).pipe(Effect.option)
      if (info._tag === "Some" && info.value.type === "Directory") {
        this.adrDiskDir = candidate
        yield* this.loadAdrFiles(candidate)
        return
      }
    }
  })

  loadAdrFiles = Effect.fn("Ledger.loadAdrFiles")(function* (this: Ledger, dir: string) {
    const fs = yield* FileSystem.FileSystem
    const names = yield* fs.readDirectory(dir).pipe(Effect.orElseSucceed(() => [] as string[]))
    for (const name of names) {
      if (!name.endsWith(".md")) continue
      const full = nodePath.join(dir, name)
      const info = yield* fs.stat(full).pipe(Effect.option)
      if (info._tag === "Some" && info.value.type !== "Directory") this.adrDisk.set(full, yield* asFail(fs.readFileString(full)))
    }
  })

  get nodes(): Record<string, NodeRecord> {
    const d = this.data!
    if (!d.nodes) d.nodes = {}
    return d.nodes
  }

  node(nid: string): NodeRecord | undefined {
    return this.nodes[nid]
  }

  get title(): string {
    return this.data?.title || defaultTitle(this.dir)
  }

  // --- derived structure
  parents(nid: string): string[] {
    return sorted(Object.entries(this.nodes).filter(([, p]) => (p.body ?? []).some((it) => it.child === nid || it.reuse === nid)).map(([pid]) => pid))
  }

  /** Nodes whose own design rests on this one: the bodies that call or reuse it, and anyone naming it in `depends`. */
  dependents(nid: string): string[] {
    const out = new Set(this.parents(nid))
    for (const [m, v] of Object.entries(this.nodes)) if ((v.depends ?? []).includes(nid)) out.add(m)
    return sorted(out)
  }

  observedParents(nid: string): string[] {
    return sorted(Object.entries(this.nodes).filter(([, p]) => (p.observed_children ?? []).includes(nid)).map(([pid]) => pid))
  }

  /** Nothing calls it and nothing rests on it. */
  roots(): string[] {
    return Object.keys(this.nodes).filter((nid) => this.dependents(nid).length === 0 && this.observedParents(nid).length === 0)
  }

  frontier(): Frontier {
    const out: Frontier = new Map()
    for (const [pid, p] of Object.entries(this.nodes)) {
      if (["draft", "retired", "superseded"].includes(p.design)) continue
      for (const it of p.body ?? []) {
        const cid = it.child
        if (cid && !(cid in this.nodes) && !out.has(cid)) out.set(cid, [frontierStatement(it.code), pid])
      }
    }
    return out
  }

  status(nid: string): string {
    const n = this.nodes[nid]
    if (n.design === "draft") {
      if (n.adr_pending) return `draft (ADR pending ${n.adr_pending})`
      const k = nodeUnknowns(n).length
      return k ? `draft (${k} ?)` : "draft"
    }
    if (n.design === "superseded") return `superseded by ${n.superseded_by ?? "?"}`
    if (n.design === "retired") return "retired"
    return n.design
  }

  isTerminal(n: NodeRecord): boolean {
    return Boolean(n.target) && !(n.body && n.body.length)
  }

  isCollapsed(n: NodeRecord): boolean {
    const stmts = (n.body ?? []).filter((it) => stmtKind(it.code) === "stmt")
    return stmts.length > 0 && stmts.every((it) => "target" in it)
  }

  inlineParent(nid: string): string | null {
    const ps = this.parents(nid)
    if (ps.length !== 1) return null
    return (this.nodes[ps[0]].body ?? []).some((it) => it.child === nid) ? ps[0] : null
  }

  // --- context lookups
  /** [kind-file, key, entry] for a term name or CTX id. */
  entry(ref: string): [string, string, ContextEntry] | null {
    const r = strip(ref)
    if (isCtxId(r)) {
      const f = r[4] === "F" ? "facts" : "scenarios"
      const e = (this.data?.[f] as Record<string, ContextEntry> | undefined)?.[r]
      return e ? [f, r, e] : null
    }
    for (const [k, e] of Object.entries(this.data?.terms ?? {})) if (k.toLowerCase() === r.toLowerCase()) return ["terms", k, e]
    return null
  }

  adrs(): AdrRecord[] {
    return parseAdrs(this.adrDir(), this.files, this.adrDisk)
  }

  adrDir(): string | null {
    if (this.data?.reconstruction) return nodePath.join(this.dir, "adr")
    for (const p of this.files.keys()) if (nodePath.basename(nodePath.dirname(p)) === "adr") return nodePath.dirname(p)
    return this.adrDiskDir
  }

  resolves(ref: string): boolean {
    return (isNodeId(ref) && (ref in this.nodes || this.frontier().has(ref)))
      || (isAdrId(ref) && this.adrs().some((a) => a.id === ref)) || this.entry(ref) !== null
  }

  canonical(ref: string): string {
    const e = this.entry(ref)
    return e ? e[1] : strip(ref)
  }

  usedBy(): Record<string, string[]> {
    const idx: Record<string, Set<string>> = {}
    const add = (k: string, v: string): void => { (idx[k] ??= new Set()).add(v) }
    for (const [nid, n] of Object.entries(this.nodes)) {
      for (const r of n.depends ?? []) {
        const e = this.entry(r)
        if (e) add(e[1], nid)
      }
    }
    for (const [sid, s] of Object.entries(this.data?.scenarios ?? {})) for (const t of this.termsIn(s.settles ?? "")) add(t, sid)
    return Object.fromEntries(Object.entries(idx).map(([k, v]) => [k, sorted(v)]))
  }

  termsIn(text: string): string[] {
    const low = ` ${text.toLowerCase()} `
    return Object.keys(this.data?.terms ?? {}).filter((t) => low.includes(` ${t.toLowerCase()} `) || strip(low).startsWith(t.toLowerCase()))
  }

  /** Relative link target from a file inside the ledger to another path. */
  rel(from: string, to: string): string {
    return relpath(to, nodePath.dirname(from))
  }
}

/** os.path.relpath(to, start) */
export const relpath = (to: string, start: string): string => {
  const r = nodePath.relative(nodePath.resolve(start), nodePath.resolve(to))
  return r === "" ? "." : r
}

export const refreshLedger = Effect.fn("refreshLedger")(function* (led: Ledger) {
  led.sourceScan = yield* existing.refreshSources(led)
  const adrs = new Map(led.adrs().map((a) => [a.id, a]))
  for (const [nid, node] of Object.entries(led.nodes)) {
    const seen = new Set([nid])
    const context: Record<string, unknown> = {}
    const queue = [nid]
    while (queue.length) {
      const currentId = queue.pop()!
      const current = led.nodes[currentId]
      if ((current.bindings && Object.keys(current.bindings).length) || current.observation || (current.observed_children && current.observed_children.length)) {
        context["source:" + currentId] = current.source_scope_hash ?? null
      }
      const refs = [...(current.depends ?? []), ...(current.body ?? []).map((it) => it.child || it.reuse)]
      for (const ref of refs) {
        if (!ref || seen.has(ref)) continue
        seen.add(ref)
        if (ref in led.nodes) {
          const dep = led.nodes[ref]
          context[ref] = [dep.revision ?? 0, dep.design, fingerprint(dep)]
          queue.push(ref)
        } else if (adrs.has(ref)) context[ref] = adrs.get(ref)!.lines
        else {
          const entry = led.entry(ref)
          if (entry) context[ref] = [entry[2].status ?? null, entry[2].changed ?? []]
          else context[ref] = "unresolved"
        }
      }
    }
    node.evidence_context = sha256Json(context, { sortKeys: true })
  }
  refresh(led.nodes)
  existing.refreshAssessments(led, led.sourceScan)
})

// ----------------------------------------------------------------------------- ADR files (markdown, header only)

/** Rewrite `field: …` in the ADR header block, adding the part if the line lacks it. */
export const setHeader = (lines: string[], field: string, value: string): void => {
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const ln = lines[i]
    if (ln.startsWith("#") || !ln.includes(":")) continue
    const parts = headerParts(ln)
    if (parts.some((x) => x.startsWith(`${field}:`))) {
      lines[i] = parts.map((x) => (x.startsWith(`${field}:`) ? `${field}: ${value}` : x)).join(" · ")
      return
    }
  }
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    if (lines[i].startsWith("Kind:")) {
      lines.splice(i + 1, 0, `${field}: ${value}`)
      return
    }
  }
}

const headerParts = (line: string): string[] => line.replaceAll(" | ", " · ").split(" · ").map((p) => strip(p))

/** str.splitlines() */
export const splitLines = (text: string): string[] => {
  const out = text.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/u)
  if (out.length && out[out.length - 1] === "") out.pop()
  return out
}

export const parseAdrs = (adrDir: string | null, staged: Map<string, string>, disk: Map<string, string>): AdrRecord[] => {
  const out: AdrRecord[] = []
  const paths = new Set<string>()
  if (adrDir) {
    for (const p of disk.keys()) if (nodePath.dirname(p) === adrDir) paths.add(p)
    for (const p of staged.keys()) if (nodePath.dirname(p) === adrDir) paths.add(p)
  }
  for (const p of sorted(paths)) {
    const lines = splitLines(staged.get(p) ?? disk.get(p) ?? "")
    const stem = nodePath.basename(p, ".md")
    let aid = stem.slice(0, 4)
    let titleText = stem
    const header: Record<string, string> = {}
    for (const ln of lines) {
      if (ln.startsWith("# ")) {
        const head = ln.slice(2).replaceAll(" - ", " — ").replaceAll(" – ", " — ")
        const [a, sep, t] = partition(head, " — ")
        if (sep) {
          aid = strip(a)
          titleText = strip(t)
        } else {
          aid = strip(head)
          titleText = strip(head)
        }
      } else if (ln.startsWith("## ")) break
      else {
        for (const part of headerParts(ln)) {
          const [k, sep, v] = partition(part, ":")
          if (sep && k && isUpper(k[0]) && !strip(k).includes(" ")) header[strip(k)] = strip(v)
        }
      }
    }
    if (!isAdrId(aid)) aid = isDigit(stem.slice(0, 4)) ? `ADR-${stem.slice(0, 4)}` : stem
    const constrains = splitWs((header.Constrains ?? "").replaceAll("(", " (")).map((w) => strip(w, "[],")).filter((w) => isNodeId(w))
    out.push({ id: aid, title: titleText, status: header.Status ?? "?", constrains, path: p, lines })
  }
  return out
}

export const linkRef = (led: Ledger, ref: string, frm: string): string => {
  if (isNodeId(ref) && ref in led.nodes) return `[${ref}](${led.rel(frm, nodePath.join(led.dir, "nodes", `${ref}.md`))})`
  if (isAdrId(ref)) {
    const a = led.adrs().find((x) => x.id === ref)
    return a ? `[${ref}](${led.rel(frm, a.path)})` : ref
  }
  const e = led.entry(ref)
  if (e) return `[${e[1]}](${led.rel(frm, nodePath.join(led.dir, "CONTEXT.md"))}#${anchorOf(e[0] === "terms" ? e[1] : e[1] + " " + (e[2].name ?? ""))})`
  return ref
}

export { GENERATED }
