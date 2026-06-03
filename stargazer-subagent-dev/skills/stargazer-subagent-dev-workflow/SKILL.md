---
name: stargazer-subagent-dev-workflow
description: >
  Build and run a deterministic Workflow (via the Workflow tool) that implements the Stargazer
  subagent-driven plan-execution pipeline — group plan tasks into dependency phases, run implementers in
  parallel per phase, drive a bounded implementer↔reviewer fix loop, then compile/test/checkStyle once and do
  a final cross-task review — as a single background orchestration script instead of live per-task teammates.
  Use when the user says "execute the plan with a workflow", "run the subagent dev workflow", or wants
  phase-by-phase plan execution as a resumable background run. For the interactive (live SendMessage
  implementer↔reviewer) version use the `stargazer-subagent-dev` skill instead.
---

# Stargazer Subagent-Dev (Workflow edition)

This skill tells you HOW to author and launch a **Workflow** script that reproduces the
`stargazer-subagent-dev` execution model deterministically. The classic skill spawns paired implementer +
reviewer teammates per phase that talk over `SendMessage`; this version compiles phase scheduling, parallel
implementation, the review/fix loop, and the single build step into one `Workflow(...)` call.

## Prerequisite: the Workflow tool (with fallback)

This skill **requires the `Workflow` tool**. Confirm it is available first. If the `Workflow` tool is **not**
present, do NOT emulate it — **fall back to the sibling base skill `stargazer-subagent-dev`** (live team), which
runs the same phase/review logic interactively. Say so, invoke that skill, and stop.

## Prerequisite: Scala code intelligence

Verify `scala-code-intelligence` MCP tools are available (invoke that skill). Else check `which cellar`
(definitions/listings only — no references/diagnostics). Else fall back to grep/glob and warn the user. Pass
the resulting tool-availability note into every agent prompt.

## Critical concurrency facts (same as batch-dev)

- **Parallel implementers mutate files** → run each with `isolation: 'worktree'`; reconcile in a build stage.
  Drop isolation only for provably disjoint-file phases with user consent.
- **Only ONE `./mill` runs at a time** → compile/test/checkStyle happen once, in a single dedicated stage after
  all phases, never inside parallel fan-out. Phases run strictly sequentially (dependents after dependencies).
- **No live implementer↔reviewer messaging** → replaced by a bounded (≤3 round) review→fix loop the script drives.

## Resource files (symlinked locally)

The base skill's prompt templates are symlinked into this skill dir — reference them locally:
`${SKILL_DIR}/implementer-prompt.md` and `${SKILL_DIR}/code-quality-reviewer-prompt.md` (the latter also holds the
domain→checklist routing table). Pass `${SKILL_DIR}` as `skillDir` in `args`.

## What you do

1. **Get the plan file path** (require it; if absent, tell the user to write a plan first — do not proceed).
2. **Read the plan inline** (hybrid): extract all tasks with full text, note cross-task dependencies, read the
   **Domains** header (+ per-task **Domain** tags) to pick reviewer checklists, and group tasks into
   dependency **phases**.
3. **Author the script** from the template, embedding each task's FULL text, dependency context, the matched
   checklists per phase, the working directory, and the Scala-tools note.
4. **Launch** with the `Workflow` tool, passing `{ phases, workdir, scalaTools, checklists, skillDir }` via `args`.
5. **On completion**, present the build result + final review, then wrap up the branch (review changes, offer
   merge / PR / cleanup via `AskUserQuestion`).

## Script template (adapt)

```javascript
export const meta = {
  name: 'stargazer-subagent-exec',
  description: 'Per-phase: parallel implementers (worktree) → review/fix loop; then single build + final review',
  phases: [{ title: 'Implement' }, { title: 'Review' }, { title: 'Build' }, { title: 'Final review' }],
}

const { phases, workdir, scalaTools, checklists, skillDir } = args
// phases: [{ name, checklists: [..], tasks: [{ id, text, deps }] }], dependency-ordered

const REPORT = { type: 'object', properties: {
  taskId: { type: 'string' }, summary: { type: 'string' },
  filesChanged: { type: 'array', items: { type: 'string' } }, commit: { type: 'string' },
  status: { enum: ['DONE', 'NEEDS_CONTEXT', 'BLOCKED'] }, notes: { type: 'string' } },
  required: ['taskId', 'status'] }

const REVIEW = { type: 'object', properties: {
  approved: { type: 'boolean' },
  fixes: { type: 'array', items: { type: 'object', properties: {
    taskId: { type: 'string' }, file: { type: 'string' }, issue: { type: 'string' }, fix: { type: 'string' } },
    required: ['taskId', 'issue'] } } },
  required: ['approved'] }

const prior = []                          // implementer reports from completed phases (for cross-phase context)

for (const ph of phases) {                // SEQUENTIAL — dependents after dependencies
  const depContext = prior.length
    ? `\n## Prior phase outputs (use these types/files; follow established patterns)\n${JSON.stringify(prior, null, 2)}`
    : ''

  // ---- Implement: worktree-isolated implementer per task, parallel ----
  phase('Implement')
  let reports = (await parallel(ph.tasks.map(t => () => agent(
    `Read your role from ${skillDir}/implementer-prompt.md.\n` +
    `## Task\n${t.text}\n## Working directory\n${workdir}\nScala tools: ${scalaTools}${depContext}\n` +
    `Do NOT run ./mill. Use diagnostics after edits. Commit when done and report.`,
    { label: `impl:${t.id}`, phase: 'Implement', model: 'sonnet', isolation: 'worktree', schema: REPORT }
  )))).filter(Boolean)

  // Surface BLOCKED/NEEDS_CONTEXT — workflow can't ask the user mid-run, so log and continue best-effort.
  const stuck = reports.filter(r => r.status !== 'DONE')
  if (stuck.length) log(`Phase ${ph.name}: ${stuck.map(r => `${r.taskId}=${r.status}`).join(', ')} — review will attempt to resolve`)

  // ---- Review + bounded fix loop (≤3 rounds) ----
  phase('Review')
  const reviewerModel = (ph.tasks.length > 1 || (ph.checklists?.length > 1)) ? 'sonnet' : 'haiku'  // never opus
  let round = 0
  while (round < 3) {
    const review = await agent(
      `Read your role from ${skillDir}/code-quality-reviewer-prompt.md.\n` +
      `Apply ONLY these checklists: ${(ph.checklists || checklists).join(', ')}.\nScala tools: ${scalaTools}\n` +
      `Review these implementer commits against their task specs. Do NOT run ./mill.\n\n` +
      `Tasks:\n${ph.tasks.map(t => `### ${t.id}\n${t.text}`).join('\n\n')}\n\nReports:\n${JSON.stringify(reports, null, 2)}\n` +
      `Return approved=true if all good, else specific per-task fixes.`,
      { label: `review:${ph.name}:r${round}`, phase: 'Review', model: reviewerModel, schema: REVIEW, agentType: 'Explore' }
    )
    if (review.approved || !review.fixes?.length) break
    const byTask = {}
    for (const f of review.fixes) (byTask[f.taskId] ||= []).push(f)
    reports = (await parallel(Object.entries(byTask).map(([taskId, fixes]) => () => agent(
      `Apply these review fixes to task ${taskId}, re-commit, and report. Working dir: ${workdir}\n` +
      `Scala tools: ${scalaTools}\nFixes:\n${JSON.stringify(fixes, null, 2)}`,
      { label: `fix:${taskId}:r${round}`, phase: 'Review', model: 'sonnet', isolation: 'worktree', schema: REPORT }
    )))).filter(Boolean)
    round++
  }
  prior.push(...reports)
}

// ---- Build: merge worktrees → single compile + test + checkStyle (the ONLY mill runner) ----
phase('Build')
const build = await agent(
  `You are the build agent and the ONLY agent allowed to run ./mill. Working dir: ${workdir}\n` +
  `1. Merge each implementer worktree commit onto the main tree.\n` +
  `2. ./mill <affected>.compile (or __.compile). Fix compile errors, recompile until clean.\n` +
  `3. ./mill <affected>.test. Fix failures, rerun until green.\n` +
  `4. ./mill <affected>.checkStyleDirty. Fix violations.\nReport final status + commit hash.`,
  { label: 'build', phase: 'Build', model: 'sonnet' }
)

// ---- Final cross-task review (catches integration issues per-phase reviews miss) ----
phase('Final review')
const finalReview = await agent(
  `Read your role from ${skillDir}/code-quality-reviewer-prompt.md. Review the ENTIRE implementation across all ` +
  `tasks for cross-task / integration issues. Checklists: ${checklists.join(', ')}. Scala tools: ${scalaTools}. ` +
  `Do NOT run ./mill (build already green). Report findings.`,
  { label: 'final-review', phase: 'Final review', model: 'sonnet', agentType: 'Explore' }
)

return { phases: phases.map(p => p.name), reports: prior, build, finalReview }
```

## After the workflow returns

- Report build status (compile/test/checkStyle) and the final review findings.
- Wrap up the branch: review all changes, then `AskUserQuestion` to merge / open a PR / clean up. Never start on
  main/master without consent.

## Notes / caveats

- **Worktree isolation default** for parallel implementers; the Build stage reconciles onto the main tree.
- **Single mill runner, after all phases**; phases sequential.
- **No live messaging** — `NEEDS_CONTEXT`/`BLOCKED` are logged and best-effort-resolved by the review loop;
  genuinely stuck tasks surface in the return value for the user to handle after.
- **Plan required** — refuse to proceed without one.
- **Resume:** identical script + `args` replays completed phases from cache; only changed `agent()` calls re-run.
