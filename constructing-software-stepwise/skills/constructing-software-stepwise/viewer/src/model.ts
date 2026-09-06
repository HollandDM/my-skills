/** Snapshot parsing and the derived graph: pure data, no DOM. */

export interface BodyLine {
  indent?: number
  code?: string
  gloss?: string
  child?: string
  reuse?: string
  target?: string
  note?: string
}

export interface Observation {
  effect?: string
  claims?: Array<{ text: string; basis: string; sources: string[] }>
  unknowns?: string[]
  behavior?: Behavior
  comparisons?: Record<string, { status: string; reason: string }>
  body?: BodyLine[]
  bindings?: Record<string, Binding>
  date?: string
  by?: string
  revision?: number
  scope_hash?: string
  implementation_version?: string | null
  implementation_commit?: string | null
}

export interface Binding {
  path: string
  baseline_sha256?: string
  symbol?: string
  lines?: number[]
}

export interface Behavior {
  states?: Array<{ id: string; label: string; initial?: boolean; terminal?: boolean; node?: string }>
  transitions?: Array<{ from: string; to: string; event: string; guard?: string; action?: string; node?: string }>
  participants?: Array<{ id: string; label: string; node?: string }>
  messages?: Array<{ from: string; to: string; label: string; kind?: string; node?: string }>
}

export interface Evidence {
  date?: string
  kind?: string
  ref?: string
  result?: string
  clauses?: string[]
  revision?: number
  scope?: string
  scenario?: string
  assessment?: string
  note?: string
  withdrawn?: { date: string; by: string; reason: string }
}

export interface DesignNode {
  id: string
  statement?: string
  gloss?: string
  effect?: string
  design?: string
  realization?: string
  verification?: string
  approved?: string
  contract?: Record<string, string>
  depends?: string[]
  body?: BodyLine[]
  target?: string
  walkthrough?: string[]
  composition?: string[]
  decisions?: string[]
  deferred?: string[]
  adaptation?: string[]
  implementation_plan?: { approach: string; validation: string }
  behavior?: Behavior
  evidence?: Evidence[]
  history?: Array<{ date: string; event: string; reason?: string }>
  revisions?: Array<{ date: string; reason?: string; revision?: number; content?: Record<string, any> }>
  superseded?: { date?: string; reason?: string; body?: BodyLine[]; composition?: string[]; decisions?: string[]; deferred?: string[] }
  superseded_by?: string
  adr_pending?: string
  stale_by?: string[]
  origin?: string
  bindings?: Record<string, Binding>
  observation?: Observation
  observation_history?: Observation[]
  observed_children?: string[]
  source_state?: string
  conformance?: { status: string; reason: string }
  current_implementation_version?: string | null
  implementation_version?: string | null
  implementation_revision?: number
  implementation_history?: Array<{ revision: number; date: string; version: string | null; commit?: string | null }>
  source_report?: {
    reason?: string
    implementation_version?: string | null
    commit?: string | null
    conformance?: { status: string; reason: string }
    bindings?: Record<string, { current: { state: string; sha256?: string }; changed: boolean }>
  }
  coverage?: { status: string; covered: string[]; missing: string[]; failed: string[] }
  placeholder?: boolean
  [key: string]: unknown
}

export interface ContextEntry {
  name?: string
  definition?: string
  source?: string
  [key: string]: unknown
}

export interface Ledger {
  title?: string
  scope?: string
  nongoals?: string[]
  ambiguities?: Array<{ claim: string; conflict: string; resolves_at: string }>
  nodes?: Record<string, DesignNode>
  terms?: Record<string, ContextEntry>
  facts?: Record<string, ContextEntry>
  scenarios?: Record<string, ContextEntry>
  source_coverage?: { active?: number; current?: number }
}

export interface Snapshot {
  ledger: Ledger
  title: string
  exported_at: string
  adrs: Array<{ id: string; text: string }>
  review_key?: string
  pseudocode?: { signatures: Record<string, string>; code: Record<string, string> }
}

export interface Edge {
  from: string
  to: string
  kind: "child" | "reuse" | "observed" | "dependency"
}

export interface TreeEdge extends Edge {
  reference: boolean
}

const STATE_NAMES = new Set(["draft", "approved", "stale", "superseded", "retired", "frontier", "unresolved"])

export const pseudo = (value: boolean): "true" | "false" => (value ? "true" : "false")

export const txt = (value: unknown): string => (typeof value === "string" ? value : JSON.stringify(value))

export class Model {
  readonly snapshot: Snapshot
  readonly ledger: Ledger
  readonly nodes: Map<string, DesignNode>
  readonly originalIds: Set<string>
  readonly edges: Edge[] = []
  readonly outgoing: Map<string, Edge[]>
  readonly incoming: Map<string, Edge[]>
  readonly roots: string[]
  readonly treeChildren: Map<string, TreeEdge[]>
  readonly treeParent = new Map<string, string>()
  readonly forest: string[] = []
  readonly searchIndex: Map<string, string>

  constructor(snapshot: Snapshot) {
    this.snapshot = snapshot
    this.ledger = snapshot.ledger
    this.nodes = new Map(Object.entries(this.ledger.nodes || {}))
    this.originalIds = new Set(this.nodes.keys())
    for (const [id, n] of [...this.nodes]) {
      n.id = id
      for (const line of n.body || []) {
        if (line.child) this.addEdge(id, line.child, "child", line.code)
        if (line.reuse) this.addEdge(id, line.reuse, "reuse", line.code)
      }
      for (const cid of n.observed_children || []) this.addEdge(id, cid, "observed", this.nodes.get(cid)?.statement || cid)
      for (const line of n.observation?.body || []) {
        const cid = line.child || line.reuse
        if (cid) this.addEdge(id, cid, "observed", line.code)
      }
      for (const dep of n.depends || []) if (/^D-\d+$/u.test(dep)) this.addEdge(id, dep, "dependency", dep)
    }
    this.outgoing = new Map([...this.nodes.keys()].map((id) => [id, [] as Edge[]]))
    this.incoming = new Map([...this.nodes.keys()].map((id) => [id, [] as Edge[]]))
    for (const e of this.edges) {
      this.outgoing.get(e.from)!.push(e)
      this.incoming.get(e.to)!.push(e)
    }
    this.roots = [...this.nodes.keys()].filter((id) => this.incoming.get(id)!.length === 0)
    // Build a spanning forest once. Remaining edges stay references, including cycles.
    this.treeChildren = new Map([...this.nodes.keys()].map((id) => [id, [] as TreeEdge[]]))
    const seen = new Set<string>()
    const visitRoot = (root: string): void => {
      if (seen.has(root)) return
      this.forest.push(root)
      seen.add(root)
      const queue = [root]
      for (let i = 0; i < queue.length; i++) {
        for (const edge of this.outgoing.get(queue[i])!) {
          const reference = seen.has(edge.to)
          this.treeChildren.get(edge.from)!.push({ ...edge, reference })
          if (!reference) {
            seen.add(edge.to)
            this.treeParent.set(edge.to, edge.from)
            queue.push(edge.to)
          }
        }
      }
    }
    for (const id of [...this.roots, ...this.nodes.keys()]) visitRoot(id)
    this.searchIndex = new Map([...this.nodes].map(([id, n]) => [id, JSON.stringify(n).toLowerCase()]))
  }

  private addEdge(from: string, to: string | undefined, kind: Edge["kind"], code?: string): void {
    if (!to) return
    if (!this.nodes.has(to)) {
      this.nodes.set(to, {
        id: to,
        statement: code || to,
        design: kind === "child" && this.nodes.get(from)!.design !== "draft" ? "frontier" : "unresolved",
        placeholder: true,
      })
    }
    if (!this.edges.some((e) => e.from === from && e.to === to && e.kind === kind)) this.edges.push({ from, to, kind })
  }

  state(n: DesignNode): string {
    return n.design && STATE_NAMES.has(n.design) ? n.design : "unresolved"
  }

  algorithmSignature(statement: string): string {
    return this.snapshot.pseudocode?.signatures[statement] || statement
  }

  displayCode(raw: string): string {
    return this.snapshot.pseudocode?.code[raw] || raw
  }

  name(n: DesignNode): string {
    return this.algorithmSignature(n.statement || "").split("(")[0].trim() || n.id
  }

  /** Descriptive observations and source versions never stand in for intended contracts. */
  observedOnly(n: DesignNode): boolean {
    return Boolean(n.origin === "existing-code" || n.observation || Object.keys(n.bindings || {}).length) && !Object.keys(n.contract || {}).length
  }

  hasObserved(n: DesignNode): boolean {
    return n.origin === "existing-code" || Boolean(n.observation) || Object.keys(n.bindings || {}).length > 0
  }

  depth(id: string): number {
    let depth = 0
    let p = this.treeParent.get(id)
    while (p) {
      depth++
      p = this.treeParent.get(p)
    }
    return depth
  }

  path(id: string): string[] {
    const path: string[] = []
    let parent = this.treeParent.get(id)
    while (parent) {
      path.unshift(parent)
      parent = this.treeParent.get(parent)
    }
    return path
  }

  reachableProcedures(root: DesignNode, observed: boolean): DesignNode[] {
    const visited = new Set<string>()
    const result: DesignNode[] = []
    const pending = [root.id]
    while (pending.length) {
      const id = pending.pop()!
      if (visited.has(id) || !this.nodes.has(id)) continue
      visited.add(id)
      const node = this.nodes.get(id)!
      result.push(node)
      const body = observed ? node.observation?.body || [] : node.body || []
      const refs = body.flatMap((line) => [line.child, line.reuse]).filter((ref): ref is string => Boolean(ref))
      if (observed) refs.push(...(node.observed_children || []))
      else refs.push(...(node.depends || []).filter((ref) => this.nodes.has(ref)))
      pending.push(...refs.reverse())
    }
    return result
  }

  // --- review baselines

  reviewRecord(n: DesignNode): Record<string, unknown> {
    const related: Record<string, unknown> = {}
    for (const dep of n.depends || []) {
      for (const group of ["terms", "facts", "scenarios"] as const) {
        const table = this.ledger[group] || {}
        const record = table[dep] || Object.values(table).find((v) => v.name === dep)
        if (record) related[dep] = record
      }
    }
    return stable({
      node: n,
      scope: this.ledger.scope || "",
      nongoals: this.ledger.nongoals || [],
      context: related,
      adrs: this.snapshot.adrs.filter((a) => (n.depends || []).includes(a.id)),
    }) as Record<string, unknown>
  }

  agentChosen(n: DesignNode): boolean {
    const text = [n.approved || "", ...(n.decisions || [])].join(" ").toLowerCase()
    if (text.includes("standing approval") || text.includes("agent recommendation")) return true
    const context = this.reviewRecord(n).context as Record<string, { source?: string }>
    return Object.values(context).some((e) => (e.source || "").toLowerCase().includes("agent recommendation"))
  }
}

export const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as object).sort().map((k) => [k, stable((value as Record<string, unknown>)[k])]))
  }
  return value
}

export const readSnapshot = (): Snapshot => JSON.parse(document.getElementById("stepwise-data")!.textContent!) as Snapshot
