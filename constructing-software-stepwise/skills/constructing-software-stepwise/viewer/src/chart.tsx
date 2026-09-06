/** Design map plus explicit state and sequence charts. Behavior charts render recorded models, never inferred behavior. */
import { For, Show, Switch, Match, createMemo } from "solid-js"
import type { JSX } from "@solidjs/web"
import { pseudo } from "./model"
import { COL_STEP, NODE_H, NODE_W, useApp, type ChartBasis, type ChartMode } from "./state"

const HEADINGS: Record<ChartMode, string> = { design: "DESIGN MAP", states: "STATE MODEL", sequence: "INTERACTION SEQUENCE" }

const DesignMap = () => {
  const app = useApp()
  const model = app.model
  const pos = (id: string) => app.positions.get(id)!
  const edgePath = (from: string, to: string): string => {
    const a = pos(from)
    const b = pos(to)
    if (a === b) return `M ${a.x + 160} ${a.y} C ${a.x + 240} ${a.y - 30},${a.x + 240} ${a.y + 90},${a.x + 180} ${a.y + 50}`
    if (b.x > a.x) return `M ${a.x + NODE_W} ${a.y + 35} C ${a.x + 205} ${a.y + 35},${b.x - 26} ${b.y + 35},${b.x} ${b.y + 35}`
    return `M ${a.x + 89} ${a.y + NODE_H} C ${a.x + 89} ${a.y + 92},${b.x + 89} ${b.y + 92},${b.x + 89} ${b.y + NODE_H}`
  }
  const label = (id: string) => {
    const n = model.name(model.nodes.get(id)!)
    return n.length > 23 ? n.slice(0, 22) + "…" : n
  }
  return (
    <>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--edge)" />
        </marker>
      </defs>
      <For each={model.edges}>
        {(edge) => (
          <path
            d={edgePath(edge.from, edge.to)}
            class={["graph-edge", edge.kind, { related: edge.from === app.selected() || edge.to === app.selected() }]}
            marker-end="url(#arrow)"
            data-from={edge.from}
            data-to={edge.to}
          />
        )}
      </For>
      <For each={[...model.nodes.values()]}>
        {(n) => {
          const p = pos(n.id)
          const state = model.state(n)
          return (
            <g
              class={["graph-node", { selected: app.selected() === n.id }]}
              transform={`translate(${p.x},${p.y})`}
              role="button"
              tabindex={0}
              aria-label={n.id + " " + model.name(n) + " " + state}
              aria-pressed={pseudo(app.selected() === n.id)}
              data-node-id={n.id}
              onClick={() => app.navigate(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  app.navigate(n.id)
                }
              }}
            >
              <title>{n.id + " · " + (n.gloss || n.statement || "") + " · " + state}</title>
              <rect width={NODE_W} height={NODE_H} />
              <circle cx={15} cy={17} r={3} class={"node-dot " + state} />
              <text x={26} y={20} class="graph-id">{n.id}</text>
              <text x={12} y={40}>{label(n.id)}</text>
              <text x={12} y={57} class="graph-status">{model.observedOnly(n) ? "observed · " + (n.source_state || "unbound") : state}</text>
            </g>
          )
        }}
      </For>
      <Show when={!model.nodes.size}>
        <text x={24} y={50} fill="var(--muted)">No design nodes yet.</text>
      </Show>
    </>
  )
}

/** Clickable chart label or shape: opens the linked node, or names itself in the footer. */
const useBehaviorLink = () => {
  const app = useApp()
  return (node: string | undefined, fallback: string) => {
    const activate = () => {
      if (node && app.model.nodes.has(node)) app.navigate(node)
      else app.setChartSelectionOverride(fallback)
    }
    return {
      tabindex: 0,
      role: "button" as const,
      "aria-label": node ? "Open " + node : fallback,
      onClick: activate,
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          activate()
        }
      },
    }
  }
}

const ChartLabel = (props: { x: number; y: number; value: string; link?: ReturnType<ReturnType<typeof useBehaviorLink>> }) => (
  <text x={props.x} y={props.y} class="behavior-label" text-anchor="middle" {...(props.link ?? {})}>
    {props.value}
    <title>{props.value}</title>
  </text>
)

const BehaviorDefs = () => (
  <defs>
    <marker id="behavior-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--teal)" />
    </marker>
  </defs>
)

const StateChart = () => {
  const app = useApp()
  const link = useBehaviorLink()
  const rows = () => app.behavior().states || []
  const transitions = () => app.behavior().transitions || []
  const places = createMemo(() => new Map(rows().map((r, i) => [r.id, { x: 115, y: 45 + i * 140 }])))
  const geometry = (edge: { from: string; to: string }) => {
    const a = places().get(edge.from)
    const b = places().get(edge.to)
    if (!a || !b) return null
    if (edge.from === edge.to) return { d: `M ${a.x + 30} ${a.y} C ${a.x + 20} ${a.y - 55},${a.x + 135} ${a.y - 55},${a.x + 125} ${a.y}`, x: a.x + 80, y: a.y - 34 }
    if (b.y === a.y + 140) return { d: `M ${a.x + 80} ${a.y + 60} L ${b.x + 80} ${b.y}`, x: a.x + 130, y: (a.y + 60 + b.y) / 2 - 8 }
    const lane = b.y > a.y ? 365 : 45
    const side = b.y > a.y ? 160 : 0
    return { d: `M ${a.x + side} ${a.y + 30} H ${lane} V ${b.y + 30} H ${b.x + side}`, x: lane, y: (a.y + b.y) / 2 + 20 }
  }
  return (
    <>
      <BehaviorDefs />
      <For each={transitions()}>
        {(edge) => {
          const g = geometry(edge)
          if (!g) return null
          return (
            <>
              <path d={g.d} class="behavior-edge" marker-end="url(#behavior-arrow)">
                <title>{edge.event + (edge.guard ? " [" + edge.guard + "]" : "") + (edge.action ? " / " + edge.action : "")}</title>
              </path>
              <ChartLabel x={g.x} y={g.y} value={edge.event + (edge.guard ? " [" + edge.guard + "]" : "")} link={link(edge.node, edge.event + (edge.action ? " → " + edge.action : ""))} />
            </>
          )
        }}
      </For>
      <For each={rows()}>
        {(row) => {
          const p = places().get(row.id)!
          return (
            <g transform={`translate(${p.x},${p.y})`} class="behavior-state" {...link(row.node, row.label)}>
              <rect width={160} height={60} rx={12} />
              <Show when={row.terminal}>
                <rect x={4} y={4} width={152} height={52} rx={9} />
              </Show>
              <Show when={row.initial}>
                <circle cx={-12} cy={30} r={5} fill="var(--teal)" />
              </Show>
              <text x={80} y={34} text-anchor="middle">{row.label}</text>
              <title>{row.label}</title>
            </g>
          )
        }}
      </For>
    </>
  )
}

const SequenceChart = () => {
  const app = useApp()
  const link = useBehaviorLink()
  const rows = () => app.behavior().participants || []
  const messages = () => app.behavior().messages || []
  const places = createMemo(() => new Map(rows().map((row, i) => [row.id, 100 + i * 180])))
  const height = () => app.graphSize().height
  return (
    <>
      <BehaviorDefs />
      <For each={rows()}>
        {(row) => {
          const x = places().get(row.id)!
          return (
            <>
              <path d={`M ${x} 70 L ${x} ${height() - 30}`} class="lifeline" />
              <g class="behavior-state" {...link(row.node, row.label)}>
                <rect x={x - 72} y={20} width={144} height={44} rx={8} />
                <text x={x} y={47} text-anchor="middle">{row.label}</text>
              </g>
            </>
          )
        }}
      </For>
      <For each={messages()}>
        {(m, i) => {
          const x = places().get(m.from)
          const to = places().get(m.to)
          if (x === undefined || to === undefined) return null
          const y = 125 + i() * 88
          return (
            <>
              <path d={x === to ? `M ${x} ${y} h 52 v 30 h -52` : `M ${x} ${y} H ${to}`} class={["behavior-edge", { returning: m.kind === "return" }]} marker-end="url(#behavior-arrow)" />
              <ChartLabel x={x === to ? x + 55 : (x + to) / 2} y={y - 10} value={i() + 1 + ". " + m.label} link={link(m.node, m.label)} />
            </>
          )
        }}
      </For>
    </>
  )
}

const EmptyBehavior = () => {
  const app = useApp()
  return (
    <>
      <BehaviorDefs />
      <ChartLabel x={200} y={70} value={app.chartMode() === "states" ? "No state model recorded." : "No interaction sequence recorded."} />
      <ChartLabel x={200} y={100} value="Add explicit behavior to this node to see it here." />
    </>
  )
}

export const Chart = () => {
  const app = useApp()
  const model = app.model
  const mode = app.chartMode
  const edgeCount = createMemo(() => {
    if (mode() === "design") return model.edges.length + " links"
    const rows = app.behaviorRows()
    if (!rows.length) return "No behavior model"
    if (mode() === "states") return rows.length + " states · " + (app.behavior().transitions || []).length + " transitions"
    return rows.length + " participants · " + (app.behavior().messages || []).length + " messages"
  })
  const note = createMemo(() => {
    if (mode() === "design") return "Explore intended refinements and observed relationships. Select a node, then read its contract or inspected implementation."
    if (app.chartBasis() === "observed") return "Observed behavior · Source inspection: " + (app.selectedNode()?.source_state || "not recorded") + ". This is not an approved requirement."
    return "Intended behavior from the recorded design. Select an operation to read its contract."
  })
  const selection = createMemo(() => {
    const override = app.chartSelectionOverride()
    if (override !== null) return override
    const id = app.selected()
    return id ? id + " · " + model.name(model.nodes.get(id)!) : "No node selected"
  })
  const size = app.graphSize
  const style = (): JSX.CSSProperties => ({ width: size().width * app.zoom() + "px", height: size().height * app.zoom() + "px" })
  const refit = () => queueMicrotask(app.fitGraph)
  return (
    <aside class="chart" aria-label="Design chart">
      <div class="panel-heading">
        <h2>{HEADINGS[mode()]}</h2>
        <small id="edge-count">{edgeCount()}</small>
      </div>
      <p class="chart-note">{note()}</p>
      <div class="chart-tools">
        <label class="sr-only" for="chart-mode">Chart type</label>
        <select
          id="chart-mode"
          value={mode()}
          onChange={(e) => {
            app.setChartMode((e.target as HTMLSelectElement).value as ChartMode)
            refit()
          }}
        >
          <option value="design">Refinement map</option>
          <option value="states">State transitions</option>
          <option value="sequence">Interaction sequence</option>
        </select>
        <label class="sr-only" for="chart-basis">Behavior model</label>
        <select
          id="chart-basis"
          hidden={mode() === "design"}
          value={app.chartBasis()}
          onChange={(e) => {
            app.setChartBasis((e.target as HTMLSelectElement).value as ChartBasis)
            refit()
          }}
        >
          <option value="intended">Intended behavior</option>
          <option value="observed">Observed behavior</option>
        </select>
        <button id="zoom-out" aria-label="Zoom out" onClick={() => app.setZoom(app.zoom() / 1.2)}>−</button>
        <output id="zoom-label" aria-live="polite">{Math.round(app.zoom() * 100) + "%"}</output>
        <button id="zoom-in" aria-label="Zoom in" onClick={() => app.setZoom(app.zoom() * 1.2)}>+</button>
        <button id="fit-graph" onClick={app.fitGraph}>Fit</button>
        <button id="focus-node" disabled={mode() !== "design"} onClick={app.focusGraph}>Focus selected</button>
        <button
          id="read-selected"
          onClick={() => {
            app.showWorkspace("read")
            document.getElementById("reader")?.scrollIntoView({ block: "start" })
          }}
        >
          Read selected node
        </button>
      </div>
      <div class="graph-viewport" id="graph-viewport" tabindex={0} aria-label="Scrollable design diagram" ref={app.registerViewport}>
        <svg id="graph" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Node relationship diagram" viewBox={`0 0 ${size().width} ${size().height}`} style={style()}>
          <Switch>
            <Match when={mode() === "design"}>
              <DesignMap />
            </Match>
            <Match when={!app.behaviorRows().length}>
              <EmptyBehavior />
            </Match>
            <Match when={mode() === "states"}>
              <StateChart />
            </Match>
            <Match when={mode() === "sequence"}>
              <SequenceChart />
            </Match>
          </Switch>
        </svg>
      </div>
      <div class="chart-footer">
        <div class="legend" hidden={mode() !== "design"}>
          <span><i />Refinement</span>
          <span><i class="reuse" />Reuse</span>
          <span><i class="dependency" />Dependency</span>
          <span><i class="observed" />Observed relationship</span>
        </div>
        <div id="chart-selection">{selection()}</div>
        <div>Snapshot only · Regenerate with the html command.</div>
      </div>
    </aside>
  )
}

export { COL_STEP }
