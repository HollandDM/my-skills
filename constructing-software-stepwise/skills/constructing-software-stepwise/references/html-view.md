# Interactive HTML reader

Use when the user wants to browse or share a Stepwise design visually.

```sh
node <skill>/dist/stepwise.mjs html docs/design/<topic>
```

The command writes `docs/design/<topic>/DESIGN.html` and prints its absolute path. Link that file for the user to open in a browser. For another destination:

```sh
node <skill>/dist/stepwise.mjs html docs/design/<topic> --output /path/to/design-reader.html
```

A relative `--output` is relative to the working directory. The output must end in `.html`; a previous export at that destination is replaced.

The HTML is a self-contained snapshot: no server, CDN, network requests, or browser installation is needed to export it. It embeds the ledger and available ADR text, including context, decisions, and evidence. Share it only with readers intended to see that design information. Regenerate after changes; ordinary ledger writes do not refresh it. Export does not change the ledger, Markdown views, approval state, or audit log, and it can render incomplete designs without requiring lint to pass.

## Navigation

The body has two workspace tabs: **Read design** shows the outline and pseudocode-first reader; **Design map** gives the chart the full width. Selection is shared. Use **Read selected node** from the map to return to the reader. Pseudocode is the default detail tab for both intended and observed-only nodes.

- **Outline:** search IDs, statements, contracts, or code; expand and collapse branches. Shared operations appear as references to the same node. Drag the divider to resize the desktop TOC. Focus the divider and use Left/Right arrows (Shift for larger steps), Home/End for limits, or double-click to reset. Width is saved locally when browser storage is available. The divider is hidden in the map and mobile stacked layout.
- **Contract & code:** read one operation at a time, with separate contract clauses, indented pseudocode, linked child calls, concrete targets, adaptation, and composition arguments.
- **Observed code:** inspect source-backed claims, inferred intent, unknowns, whole-file SHA-256 versions, Git context, implementation history, and comparisons with the intended contract. Source-change and contract-difference filters expose pending reconciliation. Observed-only nodes default to observed pseudocode; inspection metadata stays in this supporting tab.
- **Context / Evidence & history:** inspect shared terminology, facts, scenarios, ADRs, verification records, and superseded refinements.
- **Design map:** select a node in the SVG diagram, zoom, fit the graph, or focus the selected operation. Solid edges represent refinement, dashed edges reuse, and dotted edges dependencies. Scroll the panel to explore larger graphs.
- **Review:** filter stale/failed nodes, open work, agent-chosen decisions, or changed/unreviewed nodes. The Changes tab compares the selected node and its relevant context with the last marked review. Mark one node or the whole design reviewed; save/load the review JSON to carry the baseline across browsers or file locations. Browser storage can be unavailable for local files, so use the review file when persistence matters. Reviews never alter ledger approval or evidence.
- **Behavior charts:** choose State transitions or Interaction sequence in the chart panel. Choose Intended behavior or Observed behavior to render the corresponding explicit model on the selected node, with linked operations where provided.
- **Deep links:** selected node IDs appear in the URL fragment. Pseudocode links use `#D-NNN/pseudocode/observed` or `#D-NNN/pseudocode/intended`; browser Back/Forward and reload preserve both destination and algorithm source. Plain `#D-NNN` links remain supported. Source binding links open `#D-NNN/observed` for implementation inspection details.

On narrow screens, the outline stacks above the reader in Read design; Design map remains a separate full-width view. The Outline button toggles navigation in the reader. Draft, stale, retired, superseded, and uncreated nodes remain visibly distinct. The export derives verification and shows current clause coverage. It does not establish the truth or adequacy of the evidence. Implementation-ready leaves remain distinct from implemented code.

## Recording behavior

Set `behavior` on a draft node (reopen approved content first). State and sequence models are independent; include either or both. Node references are optional and become dependencies.

```json
{
  "behavior": {
    "states": [
      {"id":"queued","label":"Queued","initial":true},
      {"id":"done","label":"Completed","terminal":true}
    ],
    "transitions": [
      {"from":"queued","to":"done","event":"finish","guard":"result is durable","action":"publish outcome"}
    ],
    "participants": [
      {"id":"caller","label":"Caller"},
      {"id":"worker","label":"Worker","node":"D-001"}
    ],
    "messages": [
      {"from":"caller","to":"worker","label":"Start job","node":"D-001"},
      {"from":"worker","to":"caller","label":"Return outcome","kind":"return"}
    ]
  }
}
```

State and participant IDs must be unique within their respective arrays; transitions and messages must refer to recorded endpoints. States may have `initial` and `terminal` booleans. Transition text uses `event`, optional `guard`, and optional `action`; sequence messages use `label`, with optional `kind: "return"` for a dashed return arrow. A state, participant, transition, or message may name an existing design node using `node`.

Choose models that expose the relevant ordering, ownership, failure, and progress obligations. Do not invent runtime behavior merely to fill a chart. The diagram is part of the approved design and is preserved when that design is reopened.

## Maintaining the renderer

The reader is a SolidJS 2 application under `viewer/`. `pnpm run build:viewer` compiles it into the single-file template `dist/design-view.html`; the CLI (`src/html.ts`) embeds a JSON snapshot by replacing the template's `__STEPWISE_DATA__` marker once. Both `dist/stepwise.mjs` and `dist/design-view.html` are committed so the skill works without installing dependencies. Ledger content is inserted as DOM text, never executable HTML.

Renderer development needs Node.js 22+ and pnpm. From the skill directory:

```sh
pnpm install
pnpm run typecheck      # backend and viewer
pnpm run build          # dist/stepwise.mjs and dist/design-view.html
pnpm test               # vitest: CLI, ledger, export, and Python-parity golden fixtures
pnpm run test:browser   # Playwright against the built reader
```

Browser checks use an installed Chromium or Chrome. Set `STEPWISE_CHROMIUM` if the executable is not `/usr/sbin/chromium`. These dependencies are for development only; rebuild and commit `dist/` after changing `src/` or `viewer/`.

## Algorithm presentation

The node reader opens Pseudocode first and keeps Contract available separately. Pseudocode displays the selected procedure and every procedure reachable below it as separate blocks, with shared procedures shown once. The entire explicitly referenced call line is a native, keyboard-accessible link to the target procedure's own pseudocode. Browser Back returns to the caller. The procedure index supports quick scrolling within the current listing. Iterative traversal follows child/reuse and node dependencies for intended design, or observed-body references and observed children for observed implementation. Cycles terminate through deduplication. Missing bodies and terminal targets remain visible as explicit entries.

Each procedure shows its purpose alongside the algorithm. Observed source drift and unresolved assumptions remain visible near the affected code. A collapsible implementation mapping lists concrete targets and bound source paths, symbols, and line locators; source links open the inspection details. The reader does not guess connections from similar procedure names, and it does not make control-flow or inline primitive lines look like navigable procedures. Missing explicit references are authoring gaps: use the algorithm audit to repair them in the ledger.

Choose Intended design or Observed implementation independently. Observed listings use only observed pseudocode; missing observations never fall back to intended bodies. Historical bodies stay under Evidence & history and are not combined with today's descendants.

Code cards use the paper-style notation in [pseudocode.md](pseudocode.md), with an algorithm caption, Require/Ensure headers from the recorded contract, numbered procedure lines, emphasized keywords, and clickable refinement references. Source text remains inert. Historical and observed code cards do not borrow the current intended contract. Regenerate existing HTML snapshots to apply the new presentation; the dark theme and separate Design map tab remain available.
