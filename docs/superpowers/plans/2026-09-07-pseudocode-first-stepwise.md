# Pseudocode-first Stepwise implementation plan

> Execute inline in the `stepwise-pseudocode` worktree. The user wants a reusable improvement to both forward design and reconstruction. Existing bbox documentation is a validation case, not the specification of the feature.

**Goal:** Let a reader reason about a system from its high-level algorithms, follow each substantial operation into its procedure, and reach the implementation boundary without guessing connections.

**Architecture:** Strengthen the authoring discipline, add an algorithm audit independent of source freshness, and make pseudocode the reader's default surface. Keep explicit references in canonical bodies. Native call-line links preserve the chosen source basis and browser history. Implementation mappings and source locators sit beside each algorithm; they do not replace the algorithm's explanation.

**Tech stack:** TypeScript, Effect 4 CLI, SolidJS 2 viewer, Vitest, Playwright, CLI-managed JSON/Markdown.

## Quality contract

Every substantial operation has a meaningful interface and explains its outcome. Composite pseudocode exposes decisions, data flow, ownership, ordering, failures, and progress at one coherent abstraction level. A substantial helper either links to another modeled procedure or names a concrete implementation boundary. Small operations can be explained inline. Source hashes establish provenance, not explanatory adequacy. Observed behavior never acquires intended guarantees merely through inspection.

A reader must be able to answer: What does this procedure do? What does each step consume and produce? Where does difficult work happen? What happens when it fails? Where can I inspect the implementation? Unknown answers remain visible and assigned to an owning responsibility.

## 1. Reusable authoring workflow

Files under `constructing-software-stepwise/skills/constructing-software-stepwise/`: `SKILL.md`, `references/pseudocode.md`, `references/existing-work.md`, and `references/design-ledger.md`.

- [x] Define the algorithm quality contract for both design and reconstruction.
- [x] Explain procedure interfaces, semantic steps, inline operations, explicit refinement links, and terminal implementation mappings with a domain-neutral worked example.
- [x] Require a top-down reading pass and a source-correspondence pass. Expose assumptions, scenarios, accepted-decision differences, and unresolved obligations at their owners.
- [x] State that hierarchy metadata and source coverage cannot substitute for connected, explanatory pseudocode.

## 2. Pseudocode-first reader

Files: `viewer/src/state.tsx`, `viewer/src/reader.tsx`, `viewer/src/parts.tsx`, `viewer/src/styles.css`, and `test/browser/reader.spec.ts`.

- [x] Open Pseudocode by default and put it first among detail tabs.
- [x] Render the complete explicitly linked call line as a native anchor. Control-flow and inline primitive lines remain ordinary selectable text.
- [x] Route to `#D-NNN/pseudocode/observed` or `#D-NNN/pseudocode/intended`. Preserve plain node routes, keyboard activation, back/forward, reload, and the selected source basis.
- [x] Preserve separate procedure scopes, deduplication, recursion handling, and explicit missing-body entries.
- [x] Show algorithm purpose and unresolved observation assumptions near the code. Expose per-procedure implementation targets, bound source paths/symbols, and access to inspection details.
- [x] Test whole-line click, keyboard activation, browser history, deep links, source separation, mobile layout, and inert source text with domain-neutral fixtures.
- [x] Make the Read design TOC resizable with pointer and keyboard controls, persisted desktop width, bounded pane sizes, and a mobile stacked layout.

## 3. Reusable algorithm audit

Files: new `src/algorithm-audit.ts` and `test/algorithm-audit.test.ts`; update `src/check.ts`, `src/existing.ts`, `src/args.ts`, `src/verbs.ts`, and CLI regressions.

- [x] Audit intended and observed algorithms without mutating either.
- [x] Report missing algorithm explanations, unlinked helper calls (including predicates), missing destinations, and observed hierarchy relationships absent from both algorithms and interaction diagrams.
- [x] Respect explicit implementation targets, intentional inline operations, recursion, and asynchronous diagram links. Never invent calls from hierarchy metadata or ambiguous names.
- [x] Add structured `pseudocode` results to source scans, distinct from `coverage` and conformance. Provide `check --strict-pseudocode` as the completed-artifact gate.
- [x] Explain that structural completeness does not establish semantic correctness, useful abstraction, or implementation conformance.

## 4. Verification and real-model exercise

- [x] Run typecheck, build, unit/CLI tests, and browser tests. Save logs under `/tmp/opencode/` and inspect failures before rerunning.
- [x] Rebuild the committed `dist/stepwise.mjs` and `dist/design-view.html` artifacts.
- [x] Exercise the generic audit and reader against the existing bbox reconstruction. Confirm that its previously hidden gaps are reported accurately rather than patched around in the renderer.
- [x] Validate ordinary `observe` repair through a source-backed CLI regression: source coverage stays current while an unlinked algorithm fails the strict gate; recording explicit links clears it without approving any contract. Keep the real model exercise read-only under the clarified reusable-tooling scope.
- [x] Document CLI audit output, navigation, completion boundaries, and validation results. Link the generic implementation and regenerated review previews.

## Validation record

- The browser suite passes 15 scenarios, including whole-line navigation, source-preserving history, stored TOC width, and a 50-descendant tree that keeps its selected algorithm above the fold.
- A browser regression exposed a real batched-signal persistence bug: keyboard resize initially saved the previous width. Persisting the computed width fixes it.
- The bbox audit reports 209 unlinked-operation lines and 55 unexplained relationships. It also detects seven source-stale nodes at the time of the final real-model scan. These are findings in the existing model, not claims that application behavior was changed or repaired.
- Preview artifacts: `/tmp/opencode/stepwise-pseudocode-example.html` (connected generic fixture), `/tmp/opencode/stepwise-pseudocode-bbox-preview.html` (real-model layout and drift visibility), and `/tmp/opencode/stepwise-bbox-algorithm-audit.json` (structured findings).
