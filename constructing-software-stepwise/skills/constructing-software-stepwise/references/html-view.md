# Interactive HTML reader

Use when the user wants to browse or share a Stepwise design visually.

```sh
python3 <skill>/scripts/stepwise.py html docs/design/<topic>
```

The command writes `docs/design/<topic>/DESIGN.html` and prints its absolute path. Link that file for the user to open in a browser. For another destination:

```sh
python3 <skill>/scripts/stepwise.py html docs/design/<topic> --output /path/to/design-reader.html
```

A relative `--output` is relative to the working directory. The output must end in `.html`; a previous export at that destination is replaced.

The HTML is a self-contained snapshot: no server, CDN, network requests, or browser installation is needed to export it. It embeds the ledger and available ADR text, including context, decisions, and evidence. Share it only with readers intended to see that design information. Regenerate after changes; ordinary ledger writes do not refresh it. Export does not change the ledger, Markdown views, approval state, or audit log, and it can render incomplete designs without requiring lint to pass.

## Navigation

The body has two workspace tabs: **Read design** shows the outline and contract/pseudocode reader; **Design map** gives the chart the full width. Selection is shared. Use **Read selected node** from the map to return to its contract.

- **Outline:** search IDs, statements, contracts, or code; expand and collapse branches. Shared operations appear as references to the same node.
- **Contract & code:** read one operation at a time, with separate contract clauses, indented pseudocode, linked child calls, concrete targets, adaptation, and composition arguments.
- **Observed code:** inspect source-backed claims, inferred intent, unknowns, whole-file SHA-256 versions, Git context, implementation history, and comparisons with the intended contract. Source-change and contract-difference filters expose pending reconciliation. Observed-only nodes open this tab by default.
- **Context / Evidence & history:** inspect shared terminology, facts, scenarios, ADRs, verification records, and superseded refinements.
- **Design map:** select a node in the SVG diagram, zoom, fit the graph, or focus the selected operation. Solid edges represent refinement, dashed edges reuse, and dotted edges dependencies. Scroll the panel to explore larger graphs.
- **Review:** filter stale/failed nodes, open work, agent-chosen decisions, or changed/unreviewed nodes. The Changes tab compares the selected node and its relevant context with the last marked review. Mark one node or the whole design reviewed; save/load the review JSON to carry the baseline across browsers or file locations. Browser storage can be unavailable for local files, so use the review file when persistence matters. Reviews never alter ledger approval or evidence.
- **Behavior charts:** choose State transitions or Interaction sequence in the chart panel. Choose Intended behavior or Observed behavior to render the corresponding explicit model on the selected node, with linked operations where provided.
- **Deep links:** selected node IDs appear in the URL fragment. Browser back/forward restores the selected node.

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

`scripts/stepwise_html.py` embeds a JSON snapshot in `assets/design-view.html`; the template and its `review-ui.js`, `behavior-ui.js`, and `existing-ui.js` assets are embedded into one HTML file. Keep them bundled with the CLI. Ledger content is inserted as DOM text, never executable HTML.

Core checks (standard library only):

```sh
python3 <skill>/scripts/test_stepwise_html.py
python3 <skill>/scripts/test_stepwise.py
```

Optional browser checks use Playwright and an installed Chromium or Chrome. Set `STEPWISE_CHROMIUM` if the executable is elsewhere. With `uv` available:

```sh
uv run --with playwright python <skill>/scripts/test_stepwise_html_browser.py
```

If no system browser is available, install Playwright's Chromium with `uv run --with playwright python -m playwright install chromium`, then run the browser checks. These dependencies are for renderer development only.
