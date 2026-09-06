/** Header, status summary, workspace tabs, and the outline tree. */
import { For, Show, createMemo } from "solid-js"
import { NodeLink } from "./parts"
import { pseudo } from "./model"
import { useApp, type WorkspaceView } from "./state"

export const Header = () => {
  const app = useApp()
  return (
    <header class="top">
      <div class="mark" aria-hidden="true">≋</div>
      <div class="brand">
        <div class="eyebrow">Stepwise / Design explorer</div>
        <h1 id="design-title">{app.model.snapshot.title}</h1>
      </div>
      <div class="snapshot">
        <strong>Local design snapshot</strong>
        <br />
        <span id="snapshot-date">{"Exported " + app.model.snapshot.exported_at.replace("T", " ").split(".")[0]}</span>
      </div>
      <button
        class="mobile-tools"
        id="outline-toggle"
        aria-expanded={pseudo(!app.outlineHidden())}
        hidden={app.workspaceView() === "map"}
        onClick={() => app.setOutlineHidden(!app.outlineHidden())}
      >
        Outline
      </button>
    </header>
  )
}

export const Summary = () => {
  const app = useApp()
  const model = app.model
  const ledger = model.ledger
  const real = [...model.nodes.values()].filter((n) => model.originalIds.has(n.id))
  const live = real.filter((n) => !["retired", "superseded"].includes(n.design ?? ""))
  const approved = live.filter((n) => n.design === "approved").length
  const adoptionOnly = live.length > 0 && live.every((n) => model.observedOnly(n))
  const observedCount = live.filter((n) => n.observation && n.source_state === "current").length
  const placeholders = [...model.nodes.values()].filter((n) => n.placeholder).length
  const counts: Array<[number, string]> = [
    [live.length, "live nodes"],
    [adoptionOnly ? observedCount : approved, adoptionOnly ? "current observations" : "approved"],
    [placeholders, "unrefined"],
    [live.filter((n) => n.verification === "verified").length, "verified"],
    ...(ledger.source_coverage?.active ? [[ledger.source_coverage.current ?? 0, "source current"] as [number, string]] : []),
  ]
  const denominator = live.length + placeholders
  const percent = denominator ? Math.round(((adoptionOnly ? observedCount : approved) / denominator) * 100) : 0
  return (
    <div class="summary" id="summary" aria-label="Design status summary">
      <For each={counts}>
        {([count, label]) => (
          <div class="stat">
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        )}
      </For>
      <div class="progress-wrap">
        <div class="progress-label">
          <span>{adoptionOnly ? "Observed coverage" : "Design approval"}</span>
          <span>{percent + "%"}</span>
        </div>
        <div class="progress">
          <span style={{ width: percent + "%" }} />
        </div>
      </div>
    </div>
  )
}

export const WorkspaceTabs = () => {
  const app = useApp()
  const onKey = (key: WorkspaceView, e: KeyboardEvent) => {
    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
      e.preventDefault()
      app.showWorkspace(e.key === "Home" ? "read" : e.key === "End" ? "map" : key === "read" ? "map" : "read", true)
    }
  }
  const tab = (key: WorkspaceView, label: string) => (
    <button
      id={"view-" + key}
      role="tab"
      aria-selected={pseudo(app.workspaceView() === key)}
      aria-controls="workspace"
      tabindex={app.workspaceView() === key ? 0 : -1}
      onClick={() => app.showWorkspace(key)}
      onKeyDown={(e) => onKey(key, e)}
    >
      {label}
    </button>
  )
  return (
    <nav class="workspace-tabs" role="tablist" aria-label="Preview workspace">
      {tab("read", "Read design")}
      {tab("map", "Design map")}
    </nav>
  )
}

const TreeRow = (props: { id: string; reference: boolean }) => {
  const app = useApp()
  const model = app.model
  const n = () => model.nodes.get(props.id)!
  const children = createMemo(() => model.treeChildren.get(props.id)!.filter((e) => app.visible().has(e.to)))
  const isOpen = () => app.expanded().has(props.id) || Boolean(app.query())
  const selected = () => app.selected() === props.id
  const toggle = () => {
    const next = new Set(app.expanded())
    if (next.has(props.id)) next.delete(props.id)
    else next.add(props.id)
    app.setExpanded(next)
  }
  return (
    <li>
      <div class={["tree-row", { selected: selected() }]} data-node-id={props.id}>
        <Show when={children().length && !props.reference} fallback={<span class="spacer" />}>
          <button class="toggle" aria-label={(isOpen() ? "Collapse " : "Expand ") + props.id} aria-expanded={pseudo(isOpen())} onClick={toggle}>
            {isOpen() ? "⌄" : "›"}
          </button>
        </Show>
        <a
          class="node-link"
          href={"#" + encodeURIComponent(props.id)}
          title={n().gloss || n().statement || props.id}
          aria-current={selected() ? "true" : undefined}
        >
          <span class={"dot " + model.state(n())} />
          <span class="tree-copy">
            <strong>{(props.reference ? "↗ " : "") + model.name(n())}</strong>
            <small class="mono">{props.id + " · " + (model.observedOnly(n()) ? "observed-only" : model.state(n()))}</small>
          </span>
        </a>
      </div>
      <Show when={children().length && isOpen() && !props.reference}>
        <ul>
          <For each={children()}>{(edge) => <TreeRow id={edge.to} reference={edge.reference} />}</For>
        </ul>
      </Show>
    </li>
  )
}

export const Outline = () => {
  const app = useApp()
  const model = app.model
  const count = () => (app.query() || app.reviewFilter() !== "all" ? app.matches().size + " matches" : model.nodes.size + " nodes")
  const roots = createMemo(() => model.forest.filter((root) => app.visible().has(root)))
  let searchInput: HTMLInputElement | undefined
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(app.baseline(), null, 2)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "stepwise-review.json"
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const upload = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      app.importBaseline(JSON.parse(await file.text()))
    } catch (err) {
      app.setReviewMessage((err as Error).message)
    }
    input.value = ""
  }
  return (
    <aside class={["outline", { "hidden-mobile": app.outlineHidden() }]} id="outline" aria-label="Design outline">
      <div class="panel-heading">
        <h2>OUTLINE</h2>
        <small id="node-count">{count()}</small>
      </div>
      <div class="search-wrap">
        <label class="sr-only" for="search">Search nodes, contracts, and code</label>
        <input
          id="search"
          type="search"
          placeholder="Search nodes, contracts, code…"
          autocomplete="off"
          ref={(el) => { searchInput = el }}
          onInput={(e) => app.setQuery((e.target as HTMLInputElement).value.trim().toLowerCase())}
        />
      </div>
      <div class="tree-controls">
        <button id="expand-all" onClick={() => app.setExpanded(new Set(model.nodes.keys()))}>Expand all</button>
        <button id="collapse-all" onClick={() => app.setExpanded(new Set())}>Collapse all</button>
        <button
          id="clear-search"
          hidden={!app.query()}
          onClick={() => {
            if (searchInput) searchInput.value = ""
            app.setQuery("")
            searchInput?.focus()
          }}
        >
          Clear search
        </button>
      </div>
      <div class="review-tools">
        <label class="sr-only" for="review-filter">Filter nodes</label>
        <select id="review-filter" onChange={(e) => app.setReviewFilter((e.target as HTMLSelectElement).value)}>
          <option value="all">All nodes</option>
          <option value="changed">Changed / unreviewed</option>
          <option value="stale">Stale or failed</option>
          <option value="agent">Agent-chosen decisions</option>
          <option value="open">Open design work</option>
          <option value="sources">Implementation changed / uninspected</option>
          <option value="differences">Contract differences</option>
        </select>
        <button id="review-all" onClick={() => app.markReviewed([...model.nodes.keys()], true)}>Mark all reviewed</button>
        <button id="review-download" onClick={download}>Save review file</button>
        <label class="upload">
          Load review file
          <input id="review-upload" type="file" accept="application/json" class="sr-only" onChange={upload} />
        </label>
      </div>
      <p id="review-message" class="review-message" aria-live="polite">{app.reviewMessage()}</p>
      <nav class="tree" id="tree" aria-label="Refinement tree">
        <Show when={app.matches().size} fallback={<div class="empty">No matching nodes. Try another search or review filter.</div>}>
          <ul>
            <For each={roots()}>{(root) => <TreeRow id={root} reference={false} />}</For>
          </ul>
        </Show>
      </nav>
      <div class="outline-footer">
        Select any operation to read its contract.
        <br />
        Shared references link to the same node.
      </div>
    </aside>
  )
}

export { NodeLink }
