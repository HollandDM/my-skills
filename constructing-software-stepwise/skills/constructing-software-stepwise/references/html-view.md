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

- **Outline:** search IDs, statements, contracts, or code; expand and collapse branches. Shared operations appear as references to the same node.
- **Contract & code:** read one operation at a time, with separate contract clauses, indented pseudocode, linked child calls, concrete targets, adaptation, and composition arguments.
- **Context / Evidence & history:** inspect shared terminology, facts, scenarios, ADRs, verification records, and superseded refinements.
- **Design map:** select a node in the SVG diagram, zoom, fit the graph, or focus the selected operation. Solid edges represent refinement, dashed edges reuse, and dotted edges dependencies. Scroll the panel to explore larger graphs.
- **Deep links:** selected node IDs appear in the URL fragment. Browser back/forward restores the selected node.

On narrow screens, the outline and chart stack around the reader. The Outline button toggles navigation. Draft, stale, retired, superseded, and uncreated nodes remain visibly distinct. The export displays recorded verification status; it does not establish evidence coverage or correctness.

## Maintaining the renderer

`scripts/stepwise_html.py` embeds a JSON snapshot in `assets/design-view.html`; the template contains the complete CSS and JavaScript. Keep them bundled with the CLI. Ledger content is inserted as DOM text, never executable HTML.

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
