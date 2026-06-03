---
name: stargazer-review-gang-workflow
description: >
  Build and run a deterministic Workflow (via the Workflow tool) that implements the Stargazer multi-angle
  code review pipeline — route the diff to specialized reviewer groups, fan out reviewers in parallel, then
  one opus validator dedups/validates into a final report — as a single background orchestration script
  instead of live TeamCreate/SendMessage reviewers. Use when the user says "review my changes with a workflow",
  "run the review gang workflow", or wants the review pipeline as an unattended parallel background run. For
  the interactive (live-team, auto-fix-via-SendMessage) version use the `stargazer-review-gang` skill instead.
---

# Stargazer Review Gang (Workflow edition)

This skill tells you HOW to author and launch a **Workflow** script that reproduces the
`stargazer-review-gang` review pipeline deterministically. The classic skill spawns a live review team that
re-queries each other via `SendMessage`; this version compiles routing → parallel review → validation into one
`Workflow(...)` call.

## Prerequisite: the Workflow tool (with fallback)

This skill **requires the `Workflow` tool**. Confirm it is available before doing anything else.
If the `Workflow` tool is **not** present, do NOT emulate it — **fall back to the sibling base skill
`stargazer-review-gang`** (live team-of-agents), which runs the same review logic interactively. Say so, invoke
that skill, and stop.

## Constraints carried over from the base skill

- **NO BUILD COMMANDS** anywhere — you and every agent are forbidden from `./mill`, `compile`, `test`,
  `checkStyle*`, `reformat`, `checkUnused`. Read-only review.
- **Diff-bound**: reviewers only flag changed lines.
- **No PR-size stop**: handle any diff.
- Reviewer + agent checklists are symlinked into this skill dir: `reviewers/` (→ base `reviewers/`) and
  `agents/` (→ base `agents/`). Reference locally as `${SKILL_DIR}/reviewers/NN-*.md` and `${SKILL_DIR}/agents/*.md`.

## Translation rules (live team → workflow)

| Live mechanism | Workflow equivalent |
|---|---|
| Routing orchestrator agent (returns JSON) | first `agent()` call, `schema`'d routing plan (`diff_ref`, `routing`, `workload`, `depth`) |
| `TeamCreate` + reviewers as teammates | `parallel()` of reviewer `agent()` calls, one per assigned reviewer ID |
| Validator `SendMessage`-re-queries reviewers (live) | **no live re-query** — the single validator agent re-reads the actual code itself to confirm each finding |
| Auto-fix dispatched back to reviewers via `SendMessage` | **after** the workflow returns: main thread `AskUserQuestion`, then dispatch fixes (workflow stays read-only) |

## What you do

1. **Gather session context** (`user_context`) from the conversation — files edited, features, bugs fixed.
   Determine the user's review **scope** verbatim. (Pre-launch, inline — the workflow can't ask.)
2. **Note Scala tool availability**: invoke `scala-code-intelligence` to check MCP tools; else `which cellar`;
   else grep/glob. Pass this note to every agent.
3. **Author the script** from the template, filling scope, context, tool note, and `${SKILL_DIR}`.
4. **Launch** with the `Workflow` tool, passing those via `args`.
5. **On completion**, present the validator's final report **verbatim** (keep severity emoji 🔴🟡🔵, code
   blocks, confidence scores, reviewer attributions — the report IS the deliverable). Then, if more than
   nitpicks, `AskUserQuestion` (Fix all / Fix blockers only / Skip) and apply fixes yourself or via the base skill.

## Script template (adapt)

```javascript
export const meta = {
  name: 'stargazer-review',
  description: 'Route diff to reviewer groups, fan out reviewers, validate into one report',
  phases: [{ title: 'Route' }, { title: 'Review' }, { title: 'Validate' }],
}

const { scope, userContext, scalaTools, skillDir } = args

// 8 reviewer groups (single merged checklist each) — same roster as base skill
const ROSTER = [
  { id: 1, group: 'Scala Quality',        file: '01-scala-quality.md',  model: 'sonnet' },
  { id: 2, group: 'ZIO & Observability',  file: '02-zio-patterns.md',   model: 'sonnet' },
  { id: 3, group: 'Architecture',         file: '03-foundations.md',    model: 'haiku'  },
  { id: 4, group: 'FDB',                  file: '05-fdb-patterns.md',   model: 'sonnet' },
  { id: 5, group: 'Temporal',             file: '06-temporal.md',       model: 'sonnet' },
  { id: 6, group: 'Tapir',                file: '07-tapir-endpoints.md',model: 'sonnet' },
  { id: 7, group: 'Frontend',             file: '08-frontend.md',       model: 'haiku'  },
  { id: 8, group: 'Testing',              file: '11-testing.md',        model: 'sonnet' },
]

// ---- Phase: Route (orchestrator determines diff ref + which reviewers see which files) ----
phase('Route')
const ROUTE_SCHEMA = {
  type: 'object',
  properties: {
    diff_ref: { type: 'string' },
    routing: { type: 'array', items: { type: 'object', properties: {
      reviewerId: { type: 'number' }, files: { type: 'array', items: { type: 'string' } },
      workload: { type: 'number' } }, required: ['reviewerId', 'files', 'workload'] } },
  },
  required: ['diff_ref', 'routing'],
}
const plan = await agent(
  `First invoke the caveman:caveman skill. Read your full instructions from ${skillDir}/agents/orchestrator.md.\n` +
  `Determine the git diff strategy yourself from this scope (do NOT assume base/head):\nScope: ${scope}\n` +
  `User context: ${userContext}\nScala tools: ${scalaTools}\n` +
  `Return the routing plan: diff_ref, and per-reviewer file assignments + workload (+/- lines).`,
  { label: 'orchestrator', phase: 'Route', model: 'sonnet', schema: ROUTE_SCHEMA }
)

// Per-reviewer model: ≤100 → haiku, 101–1500 → roster default, >1500 → opus
const modelFor = (r, wl) => wl <= 100 ? 'haiku' : wl > 1500 ? 'opus' : r.model

// ---- Phase: Review (one agent per assigned reviewer, in parallel) ----
phase('Review')
const FINDINGS = { type: 'object', properties: {
  reviewerId: { type: 'number' },
  findings: { type: 'array', items: { type: 'object', properties: {
    file: { type: 'string' }, line: { type: 'number' }, severity: { enum: ['blocker','suggestion','nitpick'] },
    issue: { type: 'string' }, fix: { type: 'string' }, confidence: { type: 'number' } },
    required: ['file','severity','issue'] } } },
  required: ['reviewerId','findings'] }

const assigned = plan.routing.filter(a => a.files.length)
const reviews = (await parallel(assigned.map(a => {
  const r = ROSTER.find(x => x.id === a.reviewerId)
  return () => agent(
    `First invoke the caveman:caveman skill, then invoke NO other skills.\n` +
    `Read your checklist from ${skillDir}/reviewers/${r.file}.\n` +
    `Diff ref: ${plan.diff_ref}\nFiles: ${a.files.join(', ')}\nUser context: ${userContext}\nScala tools: ${scalaTools}\n` +
    `NO build commands. Diff-bound — only flag changed lines. Per file: git diff -U3 ${plan.diff_ref} -- <file>, ` +
    `read full file, blame changed lines. Follow the checklist's own output format + triage rules.`,
    { label: `reviewer-${r.id}`, phase: 'Review', model: modelFor(r, a.workload), schema: FINDINGS }
  )
}))).filter(Boolean)

// ---- Phase: Validate (single ALWAYS-opus validator; re-reads code, dedups, filters) ----
phase('Validate')
const allFindings = reviews.flatMap(r => r.findings.map(f => ({ ...f, reviewerId: r.reviewerId })))
const report = await agent(
  `First invoke the caveman:caveman skill. Read your instructions from ${skillDir}/agents/validator.md.\n` +
  `Diff ref: ${plan.diff_ref}\nValidate each finding against the ACTUAL code (re-read it — no back-channel to ` +
  `reviewers is available). Deduplicate, filter false positives, and produce the final report with severity ` +
  `emoji, code blocks, confidence scores, and reviewer attributions.\n\nFindings to validate:\n` +
  JSON.stringify(allFindings, null, 2),
  { label: 'validator', phase: 'Validate', model: 'opus' }   // no schema: keep the rich formatted report verbatim
)

return { diff_ref: plan.diff_ref, reviewerCount: assigned.length, report }
```

## After the workflow returns

- Present `report` **verbatim** — never summarize, never reduce a finding to a one-liner; the code blocks ARE
  the report. Applies even when everything is a nitpick.
- If there are blockers/suggestions, `AskUserQuestion` (Fix all / Fix blockers only / Skip). To apply fixes,
  either edit directly or hand the findings to the base `stargazer-review-gang` skill's auto-fix step, then tell
  the user to run `checkStyleDirty` on affected modules.

## Notes / caveats

- **No live validator↔reviewer re-query.** The validator re-reads code itself instead.
- **Read-only by design** — the workflow never builds, never fixes; fixes happen after, with user consent.
- **Resume:** identical script + `args` replays cached routing/reviews; only changed `agent()` calls re-run.
