/** The reader column: crumbs, heading, notices, detail tabs and their panels. */
import { For, Show, Switch, Match, createMemo, createSignal } from "solid-js"
import { pseudo, txt, type BodyLine, type DesignNode } from "./model"
import { CodeCard, List, NodeLink, Section, StatusBadge } from "./parts"
import { useApp, type DetailTab } from "./state"

// ----------------------------------------------------------------------------- Contract

const Overview = (props: { node: DesignNode }) => {
  const app = useApp()
  const model = app.model
  const n = props.node
  const clauses = Object.entries(n.contract || {})
  const pending = (model.ledger.ambiguities || []).filter((a) => a.resolves_at === n.id || model.outgoing.get(n.id)!.some((e) => e.to === a.resolves_at))
  const deps = n.depends || []
  const fields: Array<[keyof DesignNode, string]> = [["adaptation", "Contract → construct"], ["composition", "Why the refinement holds"], ["decisions", "Decisions"], ["deferred", "Deferred decisions"]]
  return (
    <>
      <Show when={n.implementation_plan}>
        <Section title="Implementation-ready">
          <List items={["Approach: " + n.implementation_plan!.approach, "Validation: " + n.implementation_plan!.validation]} />
        </Section>
      </Show>
      <Section title="Contract" subtitle={clauses.length + " clauses"}>
        <div class="card">
          <Show
            when={clauses.length}
            fallback={
              <div class="empty">
                {n.placeholder
                  ? "This operation has not been refined. No contract has been recorded yet."
                  : model.observedOnly(n)
                    ? "No intended contract is recorded. See Observed code for the inspected implementation."
                    : "No contract has been recorded."}
              </div>
            }
          >
            <For each={clauses}>
              {([label, value]) => (
                <div class="clause">
                  <div class="clause-label">{label}</div>
                  <p>{value}</p>
                </div>
              )}
            </For>
          </Show>
        </div>
      </Section>
      <For each={n.walkthrough || []}>{(text) => <p class="lead">{text}</p>}</For>
      <Show when={n.target}>
        <Section title="Concrete target">
          <div class="card code-card">
            <div class="code-bar">REALIZATION TARGET</div>
            <div class="signature mono">{n.target}</div>
          </div>
        </Section>
      </Show>
      <For each={fields.filter(([field]) => (n[field] as unknown[] | undefined)?.length)}>
        {([field, title]) => (
          <Section title={title}>
            <List items={n[field] as unknown[]} />
          </Section>
        )}
      </For>
      <Show when={pending.length}>
        <Section title="Open questions">
          <List items={pending.map((a) => a.claim + " — " + a.conflict + " → " + a.resolves_at)} />
        </Section>
      </Show>
      <Show when={deps.length}>
        <Section title="Depends on">
          <div class="chips">
            <For each={deps}>
              {(id) => (
                <Show when={model.nodes.has(id)} fallback={<button class="chip" onClick={() => app.setTab("context")}>{id}</button>}>
                  <NodeLink id={id} label={id} />
                </Show>
              )}
            </For>
          </div>
        </Section>
      </Show>
      <Show when={n.superseded_by && model.nodes.has(n.superseded_by)}>
        <Section title="Replacement">
          <NodeLink id={n.superseded_by!} label={n.superseded_by!} />
        </Section>
      </Show>
    </>
  )
}

// ----------------------------------------------------------------------------- Pseudocode

const Pseudocode = (props: { node: DesignNode }) => {
  const app = useApp()
  const model = app.model
  const [observed, setObserved] = createSignal(model.observedOnly(props.node))
  const procedures = createMemo(() => model.reachableProcedures(props.node, observed()))
  let container: HTMLDivElement | undefined
  const jump = (id: string) => {
    const card = container?.querySelector<HTMLElement>(`[data-procedure="${id}"]`)
    if (card) {
      card.scrollIntoView({ block: "start" })
      card.focus({ preventScroll: true })
    }
  }
  return (
    <>
      <div class="pseudocode-controls">
        <select aria-label="Pseudocode source" value={observed() ? "observed" : "intended"} onChange={(e) => setObserved((e.target as HTMLSelectElement).value === "observed")}>
          <option value="intended">Intended design</option>
          <option value="observed">Observed implementation</option>
        </select>
        <span class="muted">{procedures().length + " reachable procedures"}</span>
      </div>
      <p class="muted">Selected procedure and everything reachable below it, each shown once. Follow a call to jump to its procedure.</p>
      <div class="chips pseudocode-index">
        <For each={procedures()}>{(node) => <button class="chip" onClick={() => jump(node.id)}>{node.id + " · " + model.name(node)}</button>}</For>
      </div>
      <div class="pseudocode-tree" ref={(el) => { container = el }}>
        <For each={procedures()}>
          {(node) => {
            const body = () => (observed() ? node.observation?.body || [] : node.body || [])
            return (
              <Show
                when={body().length}
                fallback={
                  <div class="card code-card algorithm-card" data-procedure={node.id} tabindex={-1}>
                    <div class="code-bar">{observed() ? "Observed implementation" : model.state(node)}</div>
                    <div class="algorithm-title">{`Algorithm ${node.id} · ${node.gloss || model.name(node)}`}</div>
                    <div class="empty">
                      {observed()
                        ? "No observed pseudocode recorded for this node."
                        : node.target
                          ? "Implementation target: " + node.target
                          : node.implementation_plan
                            ? "Implementation approach: " + node.implementation_plan.approach
                            : "No pseudocode recorded for this node."}
                    </div>
                    <Show when={!observed() && node.implementation_plan}>
                      <div class="empty">{"Validation: " + node.implementation_plan!.validation}</div>
                    </Show>
                  </div>
                }
              >
                <CodeCard node={node} body={body()} caption={observed() ? "Observed implementation" : null} onReference={jump} procedure={node.id} />
              </Show>
            )
          }}
        </For>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------------- Observed code

const Observed = (props: { node: DesignNode }) => {
  const app = useApp()
  const n = props.node
  const obs = n.observation
  const report = n.source_report || {}
  const conformance = n.conformance || report.conformance || { status: "unassessed", reason: "No intended contract is recorded." }
  const bindings = Object.entries(n.bindings || {})
  return (
    <>
      <p class="lead">This records inspected implementation behavior. It does not approve that behavior as a requirement.</p>
      <Show when={n.source_state && n.source_state !== "current"}>
        <div class="notice">{"Source inspection: " + n.source_state + " · " + (report.reason || "Reinspect this implementation before relying on its observations.")}</div>
      </Show>
      <details class="card change-record" open>
        <summary>Implementation versions</summary>
        <div class="clause-label">Current source SHA-256</div>
        <pre>{n.current_implementation_version || report.implementation_version || "No sources bound"}</pre>
        <Show when={obs}>
          <div class="clause-label">Inspected source SHA-256</div>
          <pre>{obs!.implementation_version || "Not recorded"}</pre>
        </Show>
        <Show when={n.implementation_revision}>
          <p>{"Recorded implementation revision: " + n.implementation_revision}</p>
        </Show>
        <Show when={report.commit || obs?.implementation_commit}>
          <p>{"Git context: " + (report.commit || obs!.implementation_commit) + " · Source fingerprints include working-tree edits."}</p>
        </Show>
      </details>
      <Show
        when={obs}
        fallback={<div class="empty">No behavior has been recorded yet. Bind the sources, inspect the code, and record an observation using the scan token.</div>}
      >
        <Section title="Observed effect" subtitle={"Inspection " + obs!.revision}>
          <List items={[obs!.effect]} />
        </Section>
        <Section title="Source-backed claims">
          <div class="card">
            <For each={obs!.claims || []}>
              {(claim) => (
                <div class="record">
                  <span class={"badge " + (claim.basis === "inferred" ? "inference" : "")}>{claim.basis}</span>
                  <p>{claim.text}</p>
                  <div class="chips">
                    <For each={claim.sources}>
                      {(sid) => <button class="chip" onClick={() => document.getElementById("binding-" + sid)?.scrollIntoView({ block: "center" })}>{sid}</button>}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Section>
        <Show when={obs!.body?.length}>
          <p class="muted">Read the inspected algorithm in the Pseudocode tab; select Observed implementation.</p>
        </Show>
        <Show when={obs!.unknowns?.length}>
          <Section title="Unresolved questions">
            <List items={obs!.unknowns!} />
          </Section>
        </Show>
        <p class="muted">{"Inspected " + obs!.date + " by " + obs!.by}</p>
      </Show>
      <Section title="Comparison with intended contract" subtitle="Inspection assessment, not verification">
        <div class="card">
          <div class="record">
            <h4>{conformance.status}</h4>
            <p>{conformance.reason}</p>
          </div>
          <For each={Object.entries(obs?.comparisons || {})}>
            {([clause, value]) => (
              <div class="record">
                <h4>{clause + " · " + value.status}</h4>
                <p>{value.reason}</p>
              </div>
            )}
          </For>
        </div>
      </Section>
      <Section title="Source bindings" subtitle="Whole-file fingerprints; symbols are location hints">
        <div class="card">
          <Show when={bindings.length} fallback={<div class="empty">No source bindings.</div>}>
            <For each={bindings}>
              {([sid, binding]) => {
                const current = report.bindings?.[sid]
                return (
                  <div class="record" id={"binding-" + sid}>
                    <h4>{sid + " · " + binding.path}</h4>
                    <Show when={binding.symbol}>
                      <p class="mono">{binding.symbol}</p>
                    </Show>
                    <Show when={binding.lines}>
                      <small>{"Location hint: lines " + binding.lines!.join("–")}</small>
                    </Show>
                    <Show when={current}>
                      <p>{current!.current.state + (current!.changed ? " · changed since inspection" : "")}</p>
                    </Show>
                    <pre>{current?.current?.sha256 || binding.baseline_sha256}</pre>
                  </div>
                )
              }}
            </For>
          </Show>
        </div>
      </Section>
      <Show when={n.implementation_history?.length}>
        <Section title="Implementation version history">
          <List items={[...n.implementation_history!].reverse().map((v) => "Revision " + v.revision + " · " + v.date + "\n" + v.version + (v.commit ? "\nGit context: " + v.commit : ""))} />
        </Section>
      </Show>
      <Show when={n.observation_history?.length}>
        <Section title="Previous observations">
          <div>
            <For each={[...n.observation_history!].reverse()}>
              {(previous) => (
                <details class="card change-record">
                  <summary>{"Inspection " + previous.revision + " · " + previous.date}</summary>
                  <p class="lead">{previous.effect}</p>
                  <pre>{previous.implementation_version || previous.scope_hash}</pre>
                  <List items={(previous.claims || []).map((c) => c.basis + ": " + c.text)} />
                  <Show when={previous.body?.length}>
                    <CodeCard node={n} body={previous.body} historical caption="Previous observed implementation" />
                  </Show>
                  <Show when={previous.bindings}>
                    <List items={Object.entries(previous.bindings!).map(([id, b]) => id + ": " + b.path + (b.symbol ? " · " + b.symbol : ""))} />
                  </Show>
                </details>
              )}
            </For>
          </div>
        </Section>
      </Show>
    </>
  )
}

// ----------------------------------------------------------------------------- Context

const ContextTab = (props: { node: DesignNode }) => {
  const app = useApp()
  const model = app.model
  const ledger = model.ledger
  const n = props.node
  const deps = n.depends || []
  const groups: Array<["terms" | "facts" | "scenarios", string]> = [["terms", "Vocabulary"], ["facts", "Facts & constraints"], ["scenarios", "Scenarios"]]
  const filled = groups.filter(([field]) => Object.keys(ledger[field] || {}).length)
  const empty = !ledger.scope && !ledger.nongoals?.length && !filled.length && !model.snapshot.adrs.length
  return (
    <>
      <Show when={ledger.scope}>
        <Section title="Design scope">
          <List items={[ledger.scope]} />
        </Section>
      </Show>
      <Show when={ledger.nongoals?.length}>
        <Section title="Outside this design">
          <List items={ledger.nongoals!} />
        </Section>
      </Show>
      <For each={filled}>
        {([field, title]) => {
          const entries = Object.entries(ledger[field] || {}).sort(([a], [b]) => Number(deps.includes(b)) - Number(deps.includes(a)))
          return (
            <Section title={title}>
              <div class="card">
                <For each={entries}>
                  {([id, entry]) => {
                    const related = deps.some((d) => d === id || d === entry.name)
                    const extra = ["given", "when", "then", "excludes", "example", "avoid", "not", "settles", "status"].filter((key) => (entry[key] as unknown[] | string | undefined)?.length)
                    return (
                      <div class={["record", { related }]}>
                        <h4>{(entry.name || id) + (entry.name && entry.name !== id ? " · " + id : "")}</h4>
                        <Show when={entry.definition}>
                          <p>{entry.definition}</p>
                        </Show>
                        <For each={extra}>{(key) => <p>{key + ": " + txt(entry[key])}</p>}</For>
                        <Show when={entry.source}>
                          <small>{"Source: " + entry.source}</small>
                        </Show>
                      </div>
                    )
                  }}
                </For>
              </div>
            </Section>
          )
        }}
      </For>
      <Show when={model.snapshot.adrs.length}>
        <Section title="Architecture decisions">
          <div class="card">
            <For each={model.snapshot.adrs}>
              {(adr) => (
                <div class="record">
                  <h4>{adr.id}</h4>
                  <pre>{adr.text}</pre>
                </div>
              )}
            </For>
          </div>
        </Section>
      </Show>
      <Show when={empty}>
        <div class="empty">No context entries are recorded for this design.</div>
      </Show>
    </>
  )
}

// ----------------------------------------------------------------------------- Evidence & history

const Evidence = (props: { node: DesignNode }) => {
  const n = props.node
  const records = n.evidence || []
  const s = n.superseded
  return (
    <>
      <Show when={n.coverage}>
        <div class="coverage">
          {"Covered: " + (n.coverage!.covered.join(", ") || "none") + " · Missing: " + (n.coverage!.missing.join(", ") || "none") + " · Failed: " + (n.coverage!.failed.join(", ") || "none")}
        </div>
      </Show>
      <p class="lead">Evidence is a record of checks, not a guarantee of complete coverage. Review its scope against each contract clause.</p>
      <Section title="Evidence">
        <div class="card">
          <Show when={records.length} fallback={<div class="empty">No evidence recorded. This node is not verified by this HTML export.</div>}>
            <For each={records}>
              {(ev, i) => (
                <div class={["record", { withdrawn: Boolean(ev.withdrawn) }]}>
                  <h4>{"EV-" + (i() + 1) + " · " + ev.kind + " · " + (ev.withdrawn ? "withdrawn" : ev.result)}</h4>
                  <p>{ev.ref || ""}</p>
                  <small>{ev.date || ""}</small>
                  <small>{"Clauses: " + ((ev.clauses || []).join(", ") || "unscoped") + " · Approval revision: " + (ev.revision ?? "legacy")}</small>
                  <Show when={ev.scope || ev.scenario || ev.assessment}>
                    <p>{[ev.scope && "Scope: " + ev.scope, ev.scenario && "Scenario: " + ev.scenario, ev.assessment && "Assessment: " + ev.assessment].filter(Boolean).join(" · ")}</p>
                  </Show>
                  <Show when={ev.note}>
                    <p>{ev.note}</p>
                  </Show>
                  <Show when={ev.withdrawn}>
                    <div class="notice">{"Withdrawn " + ev.withdrawn!.date + " by " + ev.withdrawn!.by + ": " + ev.withdrawn!.reason}</div>
                  </Show>
                </div>
              )}
            </For>
          </Show>
        </div>
      </Section>
      <Show when={n.history?.length}>
        <Section title="Design history">
          <List items={n.history!.map((h) => h.date + " · " + h.event + (h.reason ? " — " + h.reason : ""))} />
        </Section>
      </Show>
      <Show when={n.revisions?.length}>
        <Section title="Earlier approvals">
          <div>
            <For each={[...n.revisions!].reverse()}>
              {(rev) => {
                const old = rev.content || {}
                return (
                  <details class="card change-record">
                    <summary>{"Approval revision " + rev.revision + " · " + rev.date}</summary>
                    <p class="lead">{rev.reason || ""}</p>
                    <Show when={old.statement}>
                      <p class="mono">{old.statement}</p>
                    </Show>
                    <Show when={old.contract}>
                      <Section title="Previous contract">
                        <List items={Object.entries(old.contract as Record<string, string>).map(([k, v]) => k + ": " + v)} />
                      </Section>
                    </Show>
                    <Show when={(old.body as BodyLine[] | undefined)?.length}>
                      <CodeCard node={{ ...old, id: n.id, design: "approved" } as DesignNode} body={old.body as BodyLine[]} historical />
                    </Show>
                    <Show when={old.target}>
                      <Section title="Previous target">
                        <List items={[old.target]} />
                      </Section>
                    </Show>
                    <For each={["adaptation", "decisions", "composition"].filter((field) => (old[field] as unknown[] | undefined)?.length)}>
                      {(field) => (
                        <Section title={field}>
                          <List items={old[field] as unknown[]} />
                        </Section>
                      )}
                    </For>
                    <Show when={old.implementation_plan}>
                      <Section title="Previous implementation plan">
                        <List items={Object.entries(old.implementation_plan as Record<string, string>).map(([k, v]) => k + ": " + v)} />
                      </Section>
                    </Show>
                  </details>
                )
              }}
            </For>
          </div>
        </Section>
      </Show>
      <Show when={s}>
        <Section title="Superseded refinement">
          <p class="lead">{(s!.date || "") + " " + (s!.reason || "")}</p>
        </Section>
        <Show when={s!.body?.length}>
          <CodeCard node={n} body={s!.body} historical />
        </Show>
        <For each={(["composition", "decisions", "deferred"] as const).filter((key) => s![key]?.length)}>
          {(key) => (
            <Section title={"Superseded " + key}>
              <List items={s![key]!} />
            </Section>
          )}
        </For>
      </Show>
    </>
  )
}

// ----------------------------------------------------------------------------- Changes (review)

interface Change {
  path: string
  before: unknown
  after: unknown
}

const Review = (props: { node: DesignNode }) => {
  const app = useApp()
  const model = app.model
  const n = props.node
  const old = () => app.baseline().nodes[n.id]
  const changes = createMemo<Change[]>(() => {
    const previous = old()
    if (!previous) return []
    const out: Change[] = []
    const compare = (before: unknown, after: unknown, path: string): void => {
      if (JSON.stringify(before) === JSON.stringify(after)) return
      if (before && after && !Array.isArray(before) && !Array.isArray(after) && typeof before === "object" && typeof after === "object") {
        for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
          compare((before as Record<string, unknown>)[k], (after as Record<string, unknown>)[k], path ? path + "." + k : k)
        }
      } else out.push({ path, before, after })
    }
    compare(previous.record, model.reviewRecord(n), "")
    return out
  })
  const removed = () => Object.keys(app.baseline().nodes).filter((id) => !model.nodes.has(id))
  return (
    <>
      <p class="lead">
        {old()
          ? "Compared with your review on " + old()!.at.replace("T", " ")
          : "This operation has no review baseline yet. Mark it reviewed after reading the contract and its supporting evidence."}
      </p>
      <button onClick={() => app.markReviewed([n.id])}>Mark this node reviewed</button>
      <Show when={old()}>
        <Show when={changes().length} fallback={<p class="lead">No changes since your last review.</p>}>
          <For each={changes()}>
            {(change) => (
              <details class="card change-record">
                <summary>{change.path.replace(/^node\./u, "")}</summary>
                <div class="clause-label">Previously reviewed</div>
                <pre>{change.before === undefined ? "Not recorded" : JSON.stringify(change.before, null, 2)}</pre>
                <div class="clause-label">Current snapshot</div>
                <pre>{change.after === undefined ? "Removed" : JSON.stringify(change.after, null, 2)}</pre>
              </details>
            )}
          </For>
        </Show>
      </Show>
      <Show when={removed().length}>
        <Section title="Removed since review">
          <List items={removed().map((id) => id + " · " + ((app.baseline().nodes[id].record as { node?: { statement?: string } } | undefined)?.node?.statement || ""))} />
        </Section>
      </Show>
    </>
  )
}

// ----------------------------------------------------------------------------- Reader

const NOTICES: Record<string, string> = {
  draft: "Draft · This contract and refinement have not been approved.",
  stale: "Stale · A changed dependency or decision requires this design to be revisited.",
  retired: "Retired · This operation is retained as history and is no longer active.",
}

const NodeReader = (props: { node: DesignNode }) => {
  const app = useApp()
  const model = app.model
  const n = props.node
  const observedOnly = model.observedOnly(n)
  const detailTabs = createMemo<Array<[DetailTab, string]>>(() => [
    ["overview", "Contract"],
    ["pseudocode", "Pseudocode"],
    ...(model.hasObserved(n) ? [["observed", "Observed code"] as [DetailTab, string]] : []),
    ["context", "Context"],
    ["evidence", "Evidence & history"],
    ["review", "Changes"],
  ])
  const tab = createMemo<DetailTab>(() => (app.tab() === "observed" && !model.hasObserved(n) ? "overview" : app.tab()))
  const focusTab = (key: DetailTab) => {
    app.setTab(key)
    queueMicrotask(() => document.getElementById("tab-" + key)?.focus())
  }
  const onKey = (key: DetailTab, event: KeyboardEvent) => {
    const keys = detailTabs().map(([k]) => k)
    let index = keys.indexOf(key)
    if (event.key === "ArrowRight") index = (index + 1) % keys.length
    else if (event.key === "ArrowLeft") index = (index + keys.length - 1) % keys.length
    else if (event.key === "Home") index = 0
    else if (event.key === "End") index = keys.length - 1
    else return
    event.preventDefault()
    focusTab(keys[index])
  }
  const parents = [...new Set(model.incoming.get(n.id)!.map((e) => e.from))]
  const statuses: Array<[string, string]> = observedOnly
    ? [["Source inspection", n.source_state || "unbound"], ["Intended contract", "not specified"]]
    : [["Implementation", n.realization || "not-started"], ["Verification", n.verification || "unverified"]]
  return (
    <>
      <nav class="crumbs" aria-label="Node path">
        <For each={model.path(n.id)}>
          {(id) => (
            <>
              <NodeLink id={id} label={id} class="" />
              <span>/</span>
            </>
          )}
        </For>
        <span class="mono">{n.id}</span>
      </nav>
      <div class="node-heading">
        <span class="mono">{n.id}</span>
        <Show when={observedOnly} fallback={<StatusBadge node={n} />}>
          <span class="badge observation">observed-only</span>
        </Show>
        <Show when={n.target}>
          <span class="badge">terminal</span>
        </Show>
        <Show when={!n.target && n.body?.length && !n.body.some((l) => l.child || l.reuse)}>
          <span class="badge">collapsed leaf</span>
        </Show>
        <Show when={n.implementation_plan}>
          <span class="badge">implementation-ready</span>
        </Show>
        <Show when={app.isChanged(n.id)}>
          <span class="badge changed">{app.baseline().nodes[n.id] ? "changed since review" : "unreviewed"}</span>
        </Show>
        <Show when={n.source_state}>
          <span class="badge observation">{"sources: " + n.source_state}</span>
        </Show>
      </div>
      <h2>{model.name(n)}</h2>
      <p class="lead">{(observedOnly ? n.observation?.effect : null) || n.effect || n.gloss || n.statement || ""}</p>
      <div class="status-line">
        <For each={statuses}>
          {([label, value]) => (
            <span>
              {label + " · "}
              <strong>{value}</strong>
            </span>
          )}
        </For>
      </div>
      <Show when={n.approved}>
        <p class="muted">{"Approved: " + n.approved}</p>
      </Show>
      <Show when={n.placeholder}>
        <div class="notice">Referenced operation · This node has no recorded definition yet. It remains open design work.</div>
      </Show>
      <Show when={!n.placeholder && n.design !== "approved" && !observedOnly}>
        <div class="notice">{NOTICES[n.design ?? ""] ?? "Superseded · A replacement design has taken over this operation."}</div>
      </Show>
      <Show when={n.adr_pending}>
        <div class="notice">{"Pending ADR: " + n.adr_pending}</div>
      </Show>
      <Show when={n.stale_by?.length}>
        <div class="notice">{"Invalidated by: " + n.stale_by!.join(", ")}</div>
      </Show>
      <div class="tabs" role="tablist" aria-label="Node detail">
        <For each={detailTabs()}>
          {([key, label]) => (
            <button
              role="tab"
              id={"tab-" + key}
              aria-controls="detail-content"
              aria-selected={pseudo(tab() === key)}
              tabindex={tab() === key ? 0 : -1}
              onClick={() => focusTab(key)}
              onKeyDown={(event) => onKey(key, event)}
            >
              {label}
            </button>
          )}
        </For>
      </div>
      <div id="detail-content" role="tabpanel" aria-labelledby={"tab-" + tab()}>
        <Switch>
          <Match when={tab() === "overview"}>
            <Overview node={n} />
          </Match>
          <Match when={tab() === "pseudocode"}>
            <Pseudocode node={n} />
          </Match>
          <Match when={tab() === "observed"}>
            <Observed node={n} />
          </Match>
          <Match when={tab() === "context"}>
            <ContextTab node={n} />
          </Match>
          <Match when={tab() === "evidence"}>
            <Evidence node={n} />
          </Match>
          <Match when={tab() === "review"}>
            <Review node={n} />
          </Match>
        </Switch>
      </div>
      <Show when={parents.length}>
        <Section title="Referenced by">
          <div class="chips">
            <For each={parents}>{(id) => <NodeLink id={id} label={id} />}</For>
          </div>
        </Section>
      </Show>
    </>
  )
}

export const Reader = () => {
  const app = useApp()
  return (
    <article class="reader" id="reader" aria-label="Selected operation" ref={app.registerReader}>
      <Show when={app.model.nodes.size} fallback={<EmptyDesign />}>
        <Show when={app.selectedNode()} keyed>
          {(node) => <NodeReader node={node} />}
        </Show>
      </Show>
    </article>
  )
}

const EmptyDesign = () => (
  <>
    <h2>Your design starts here</h2>
    <p class="lead">This ledger has no nodes yet. Add a root with the Stepwise CLI, then regenerate this snapshot.</p>
  </>
)
