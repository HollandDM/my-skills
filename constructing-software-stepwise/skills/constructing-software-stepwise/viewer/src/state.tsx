/** Reactive UI state and the actions the legacy reader exposed. */
import { createContext, createMemo, createSignal, useContext, type Accessor } from "solid-js"
import { Model, type Behavior, type DesignNode } from "./model"

export type ChartMode = "design" | "states" | "sequence"
export type ChartBasis = "intended" | "observed"
export type WorkspaceView = "read" | "map"
export type DetailTab = "overview" | "pseudocode" | "observed" | "context" | "evidence" | "review"

export interface Baseline {
  source: string
  nodes: Record<string, { at: string; record: unknown }>
}

export const NODE_W = 178
export const NODE_H = 70
export const COL_STEP = 218
export const ROW_STEP = 98

export interface Position {
  x: number
  y: number
}

export const createAppState = (model: Model) => {
  const [selected, setSelected] = createSignal<string | null>(null)
  const [tab, setTab] = createSignal<DetailTab>("overview")
  const [query, setQuery] = createSignal("")
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set(model.forest))
  const [reviewFilter, setReviewFilter] = createSignal("all")
  const [reviewMessage, setReviewMessage] = createSignal("")
  const [chartMode, setChartMode] = createSignal<ChartMode>("design")
  const [chartBasis, setChartBasis] = createSignal<ChartBasis>("intended")
  const [zoom, setZoomRaw] = createSignal(1)
  const [chartSelectionOverride, setChartSelectionOverride] = createSignal<string | null>(null)
  const [workspaceView, setWorkspaceView] = createSignal<WorkspaceView>("read")
  const [outlineHidden, setOutlineHidden] = createSignal(false)

  // Review baselines stay in the browser or an explicitly downloaded JSON file.
  const reviewStorageKey = "stepwise-review:" + (model.snapshot.review_key || model.snapshot.title)
  let initial: Baseline = { source: reviewStorageKey, nodes: {} }
  try {
    const saved = JSON.parse(localStorage.getItem(reviewStorageKey) || "null") as Baseline | null
    if (saved?.source === reviewStorageKey && saved.nodes) initial = saved
  } catch {
    /* File-origin storage can be disabled. Export/import still works. */
  }
  const [baseline, setBaseline] = createSignal<Baseline>(initial)

  const isChanged = (id: string): boolean => {
    const old = baseline().nodes[id]
    return !old || JSON.stringify(old.record) !== JSON.stringify(model.reviewRecord(model.nodes.get(id)!))
  }

  const matchesReview = (n: DesignNode): boolean => {
    const filter = reviewFilter()
    if (filter === "sources") return Boolean(n.source_state) && n.source_state !== "current"
    if (filter === "differences") return n.conformance?.status === "differs"
    if (filter === "changed") return isChanged(n.id)
    if (filter === "stale") {
      return n.design === "stale" || n.verification === "stale" || n.verification === "failed" || n.source_state === "stale" || n.source_state === "missing"
    }
    if (filter === "agent") return model.agentChosen(n)
    if (filter === "open") return Boolean(n.placeholder) || (n.design === "draft" && !model.observedOnly(n))
    return true
  }

  /** Nodes matching the search and review filter, plus every ancestor needed to reach them. */
  const matches = createMemo(() => {
    const q = query()
    return new Set([...model.nodes.keys()].filter((id) => (!q || model.searchIndex.get(id)!.includes(q)) && matchesReview(model.nodes.get(id)!)))
  })
  const visible = createMemo(() => {
    const out = new Set(matches())
    for (const id of matches()) {
      let p = model.treeParent.get(id)
      while (p) {
        out.add(p)
        p = model.treeParent.get(p)
      }
    }
    return out
  })

  const persistReview = (next: Baseline): void => {
    setBaseline(next)
    try {
      localStorage.setItem(reviewStorageKey, JSON.stringify(next))
      setReviewMessage("Review baseline saved in this browser.")
    } catch {
      setReviewMessage("Baseline kept for this page only. Download it to preserve your review.")
    }
  }

  const markReviewed = (ids: string[], reset = false): void => {
    const at = new Date().toISOString()
    const next: Baseline = { source: baseline().source, nodes: reset ? {} : { ...baseline().nodes } }
    for (const id of ids) next.nodes[id] = { at, record: model.reviewRecord(model.nodes.get(id)!) }
    persistReview(next)
  }

  const importBaseline = (imported: unknown): void => {
    const candidate = imported as Baseline
    if (
      !candidate || typeof candidate !== "object" || candidate.source !== reviewStorageKey || !candidate.nodes || typeof candidate.nodes !== "object" || Array.isArray(candidate.nodes)
      || Object.values(candidate.nodes).some((v) => !v || typeof v.at !== "string" || !v.record || !(v.record as { node?: unknown }).node)
    ) throw Error("The file is not a review baseline for this design.")
    persistReview(candidate)
  }

  // --- design map layout: columns by tree depth, fixed once
  const positions = new Map<string, Position>()
  const columns = new Map<number, string[]>()
  for (const id of model.nodes.keys()) {
    const depth = model.depth(id)
    if (!columns.has(depth)) columns.set(depth, [])
    columns.get(depth)!.push(id)
  }
  let maxRows = 1
  for (const [depth, ids] of columns) {
    maxRows = Math.max(maxRows, ids.length)
    ids.forEach((id, i) => positions.set(id, { x: 24 + depth * COL_STEP, y: 26 + i * ROW_STEP }))
  }
  const designSize = { width: Math.max(260, columns.size * COL_STEP + 30), height: Math.max(180, maxRows * ROW_STEP + 38) }

  const selectedNode: Accessor<DesignNode | null> = createMemo(() => {
    const id = selected()
    return id ? model.nodes.get(id) ?? null : null
  })

  /** Behavior model of the selected node for the chosen basis (intended design or observed implementation). */
  const behavior = createMemo<Behavior>(() => {
    const n = selectedNode()
    return (chartBasis() === "observed" ? n?.observation?.behavior : n?.behavior) || {}
  })
  const behaviorRows = createMemo(() => (chartMode() === "states" ? behavior().states || [] : behavior().participants || []))
  const graphSize = createMemo<{ width: number; height: number }>(() => {
    const mode = chartMode()
    if (mode === "design") return designSize
    const rows = behaviorRows()
    if (!rows.length) return { width: 400, height: 200 }
    if (mode === "states") return { width: 420, height: Math.max(260, rows.length * 140 + 50) }
    const messages = behavior().messages || []
    return { width: Math.max(360, rows.length * 180 + 60), height: Math.max(260, messages.length * 88 + 170) }
  })

  let viewport: HTMLElement | null = null
  const registerViewport = (el: HTMLElement): void => { viewport = el }

  const setZoom = (value: number): void => { setZoomRaw(Math.max(0.15, Math.min(2.5, value))) }

  const fitGraph = (): void => {
    if (workspaceView() !== "map" || !viewport) return
    const size = graphSize()
    setZoom(Math.min(1.5, (viewport.clientWidth - 20) / size.width, chartMode() === "design" ? (viewport.clientHeight - 20) / size.height : 1.5))
    viewport.scrollTo(0, 0)
  }

  const focusGraph = (): void => {
    const id = selected()
    if (!id || chartMode() !== "design" || !viewport) return
    const p = positions.get(id)!
    if (zoom() < 0.7) setZoom(0.85)
    const z = zoom()
    viewport.scrollTo({ left: (p.x + 89) * z - viewport.clientWidth / 2, top: (p.y + 35) * z - viewport.clientHeight / 2 })
  }

  let reader: HTMLElement | null = null
  const registerReader = (el: HTMLElement): void => { reader = el }

  const select = (id: string | undefined, reveal = false): void => {
    if (!id || !model.nodes.has(id)) return
    const n = model.nodes.get(id)!
    setSelected(id)
    setChartSelectionOverride(null)
    if (model.observedOnly(n) && tab() === "overview") setTab("observed")
    if (model.observedOnly(n)) setChartBasis("observed")
    const next = new Set(expanded())
    let p = model.treeParent.get(id)
    while (p) {
      next.add(p)
      p = model.treeParent.get(p)
    }
    setExpanded(next)
    if (chartMode() !== "design") queueMicrotask(fitGraph)
    if (reader) reader.scrollTop = 0
    if (reveal && workspaceView() === "read" && window.innerWidth <= 1150) reader?.scrollIntoView({ block: "start" })
  }

  const navigate = (id: string): void => {
    if (location.hash === "#" + encodeURIComponent(id)) select(id, true)
    else location.hash = encodeURIComponent(id)
  }

  const fromHash = (event?: Event): void => {
    let id: string
    try {
      id = decodeURIComponent(location.hash.slice(1))
    } catch {
      id = ""
    }
    select(model.nodes.has(id) ? id : model.forest[0], Boolean(event))
  }

  const showWorkspace = (view: WorkspaceView, focus = false): void => {
    setWorkspaceView(view)
    if (view === "map") requestAnimationFrame(fitGraph)
    if (focus) queueMicrotask(() => document.getElementById("view-" + view)?.focus())
  }

  return {
    model, selected, selectedNode, tab, setTab, query, setQuery, expanded, setExpanded, reviewFilter, setReviewFilter, reviewMessage, setReviewMessage,
    chartMode, setChartMode, chartBasis, setChartBasis, zoom, setZoom, graphSize, behavior, behaviorRows, workspaceView, showWorkspace, outlineHidden, setOutlineHidden,
    chartSelectionOverride, setChartSelectionOverride,
    baseline, isChanged, matchesReview, matches, visible, markReviewed, importBaseline, positions, designSize, registerViewport, registerReader,
    fitGraph, focusGraph, select, navigate, fromHash,
  }
}

export type AppState = ReturnType<typeof createAppState>

const AppContext = createContext<AppState>()
export const AppProvider = AppContext
export const useApp = (): AppState => {
  const app = useContext(AppContext)
  if (!app) throw new Error("app state missing")
  return app
}
