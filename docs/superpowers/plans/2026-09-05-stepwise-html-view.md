# Stepwise HTML View Implementation Plan

> Execute inline in this session under the user's request to add the command.

**Goal:** Add `stepwise.py html <dir> [--output FILE]` to export an interactive design reader with a tree, contract/pseudocode reader, and diagram panel.

**Architecture:** A separate Python renderer serializes a snapshot of ledger nodes, references, and context into a bundled HTML template. The template contains all CSS and JavaScript, uses DOM text insertion for ledger content, and opens directly from disk. Export does not mutate the ledger, Markdown views, or command log.

**Tech Stack:** Python standard library; vanilla JavaScript, CSS, and SVG. Browser checks use an isolated Playwright environment with installed Chromium.

**Spec:** User request: render pseudocode as an HTML tree with competent visual UI and a chart panel, allowing navigation through contracts and pseudocode.

## Global Constraints

- Preserve existing ledger commands, schema, and generated Markdown behavior.
- Embed all resources; no server, external requests, or runtime dependencies.
- Render untrusted ledger strings as text, including strings containing HTML/script syntax.
- Support drafts, stale/retired/superseded nodes, missing children, reuse, dependency links, cycles, empty designs, and narrow screens.
- Export is an explicitly regenerated snapshot; design acceptance and verification remain separate visible states.

## Task 1: Export command and readable snapshot

Files: `scripts/stepwise.py`, new `scripts/stepwise_html.py`, new `assets/design-view.html` under the Stepwise skill.

Interface: `render_html(ledger: dict, *, title: str, exported_at: str, adrs: list[dict]) -> str`. The CLI gathers data without writing it, resolves the requested output path, requires `.html`, and prints the resulting path.

- [x] Add command parsing and read-only export dispatch; avoid recording an export as a ledger mutation.
- [x] Build searchable collapsible outline, selectable SVG relationship diagram with fit/zoom controls, status counts, and responsive detail pane.
- [x] Detail pane shows contract clauses, indented pseudocode with linked child calls, targets/adaptation, decisions, context, evidence, and history. Hash navigation supports deep links and browser back/forward.
- [x] Use cycle-safe traversal and one graph node per ID; label uncreated references without claiming completion.

## Task 2: Behavioral validation and documentation

Files: new `scripts/test_stepwise_html.py`, update skill entrypoint and CLI reference.

- [x] Test CLI export in a temporary design and compare source files before/after to assert no ledger/view/log mutation.
- [x] Test safe embedding of `</script>` and markup, inclusion of reference states and context, and invalid output paths.
- [x] Run existing CLI self-check and new export tests.
- [x] Open an exported fixture in Chromium via Playwright: select through outline, diagram and code; search; collapse; use hash history, zoom, and mobile layout; assert no script execution or browser errors.
- [x] Inspect a screenshot of a populated design and adjust visual defects found.
- [x] Document command, snapshot semantics, output, and how to navigate the view. Validate skill and patch whitespace.

Validation: the existing CLI self-check, export integrity tests, browser navigation tests, skill validator, and patch whitespace checks passed. Desktop and mobile screenshots were inspected using the fixture exported under `/tmp/stepwise-html-preview/`.
