/** Small shared building blocks: sections, lists, links, badges, and the algorithm card. */
import { For, Show } from "solid-js"
import type { JSX } from "@solidjs/web"
import { txt, type BodyLine, type DesignNode } from "./model"
import { useApp } from "./state"

export const Section = (props: { title: string; subtitle?: string; children: JSX.Element }) => (
  <section class="section">
    <div class="section-title">
      <h3>{props.title}</h3>
      <Show when={props.subtitle}>
        <small>{props.subtitle}</small>
      </Show>
    </div>
    {props.children}
  </section>
)

export const List = (props: { items: unknown[] }) => (
  <ul class="prose-list card">
    <For each={props.items}>{(item) => <li>{txt(item)}</li>}</For>
  </ul>
)

export const NodeLink = (props: { id: string; label: string; class?: string; title?: string; onClick?: (event: MouseEvent) => void }) => (
  <a class={props.class ?? "chip"} href={"#" + encodeURIComponent(props.id)} title={props.title} onClick={props.onClick}>
    {props.label}
  </a>
)

export const StatusBadge = (props: { node: DesignNode }) => {
  const app = useApp()
  return <span class={"badge " + app.model.state(props.node)}>{app.model.state(props.node)}</span>
}

const KEYWORD = /^(end (?:procedure|function|if|while|for|upon|atomic|parallel)|else if|for each|parallel for each|procedure|function|return|if|else|while|for|repeat|until|assert|invariant|upon|atomic|await|raise|break|continue)\b/iu

/** Source content always enters the document as inert text. */
export const AlgorithmCode = (props: { raw: string }) => {
  const app = useApp()
  const value = () => app.model.displayCode(props.raw)
  const keyword = () => KEYWORD.exec(value())?.[0]
  return (
    <code>
      <Show when={keyword()} fallback={value()}>
        <strong class="algorithm-keyword">{keyword()}</strong>
        {value().slice(keyword()!.length)}
      </Show>
    </code>
  )
}

const CONTRACT_HEADINGS: Record<string, string> = { pre: "Require", post: "Ensure", input: "Input", output: "Output" }

export interface CodeCardProps {
  node: DesignNode
  body?: BodyLine[]
  historical?: boolean
  caption?: string | null
  onReference?: (target: string) => void
  /** When set, the card is a focusable jump target inside the pseudocode tab. */
  procedure?: string
}

const CodeLine = (props: { raw: string; index: number; indent: number; line: BodyLine; onReference?: (target: string) => void }) => {
  const app = useApp()
  const target = () => props.line.child || props.line.reuse
  const note = () => props.line.gloss || (target() && app.model.nodes.get(target()!)?.gloss) || props.line.note
  return (
    <div class="code-line">
      <span class="line-no">{props.index}</span>
      <div class="line-content" style={{ "--indent": Math.min(Math.max(props.indent, 0), 80) * 7 + "px" }}>
        <AlgorithmCode raw={props.raw} />
        <Show when={note()}>
          <div class="line-note">{"▷ " + txt(note())}</div>
        </Show>
        <Show when={props.line.target}>
          <div class="line-note">{"▷ " + props.line.target}</div>
        </Show>
      </div>
      <Show when={target() && app.model.nodes.has(target()!)}>
        <NodeLink
          id={target()!}
          label={(props.line.reuse ? "↗ " : "") + target()}
          class="code-ref"
          onClick={props.onReference ? (event) => { event.preventDefault(); props.onReference!(target()!) } : undefined}
        />
      </Show>
    </div>
  )
}

export const CodeCard = (props: CodeCardProps) => {
  const app = useApp()
  const body = () => props.body ?? props.node.body ?? []
  const caption = () => props.caption || (props.historical ? "Superseded body" : app.model.state(props.node) === "approved" ? "Approved refinement" : "Unapproved refinement")
  const showMeta = () => !props.historical && !props.caption && props.node.contract && Object.keys(props.node.contract).length > 0
  return (
    <div class="card code-card algorithm-card" data-procedure={props.procedure} tabindex={props.procedure !== undefined ? -1 : undefined}>
      <div class="code-bar">
        <span>ALGORITHM</span>
        <span>{caption()}</span>
      </div>
      <div class="algorithm-title">{`Algorithm ${props.node.id} · ${props.node.gloss || app.model.name(props.node)}`}</div>
      <Show when={showMeta()}>
        <dl class="algorithm-meta">
          <For each={Object.entries(props.node.contract ?? {})}>
            {([key, value]) => (
              <>
                <dt>{CONTRACT_HEADINGS[key] || key[0].toUpperCase() + key.slice(1)}</dt>
                <dd>{txt(value)}</dd>
              </>
            )}
          </For>
        </dl>
      </Show>
      <CodeLine raw={"procedure " + app.model.algorithmSignature(props.node.statement || props.node.id)} index={1} indent={0} line={{}} />
      <For each={body()}>
        {(line, i) => <CodeLine raw={line.code || ""} index={i() + 2} indent={2 + (Number(line.indent) || 0)} line={line} onReference={props.onReference} />}
      </For>
      <CodeLine raw="end procedure" index={body().length + 2} indent={0} line={{}} />
    </div>
  )
}
