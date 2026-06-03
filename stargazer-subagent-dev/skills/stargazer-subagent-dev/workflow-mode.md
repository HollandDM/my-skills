# Stargazer Subagent-Driven Development — Workflow Mode

Use this when the **Workflow tool** is available. Author one `Workflow(...)` script: per-phase implementers → bounded review/fix loop → single build+test+checkStyle → final review.

### Prerequisite: Scala code intelligence

Verify `scala-code-intelligence` MCP tools (invoke that skill). Else `which cellar` (definitions only). Else grep/glob + warn. Pass the tool-availability note into every agent prompt.

### Critical concurrency facts

- Parallel implementers mutate files → run each with `isolation: 'worktree'`; reconcile in a build stage. Drop isolation only for disjoint-file phases with user consent.
- Only ONE `./mill` runs at a time → compile/test/checkStyle once, in a dedicated stage after all phases. Phases run sequentially.
- No live implementer↔reviewer messaging → bounded (≤3) review/fix loop driven by the script.

### Resource files

Prompt templates in `${SKILL_DIR}/implementer-prompt.md` and `${SKILL_DIR}/code-quality-reviewer-prompt.md` (latter holds the domain→checklist routing table). Pass `${SKILL_DIR}` as `skillDir` in `args`.

### What you do

1. Get plan file path (require it; if absent, tell user to write a plan first — do not proceed).
2. Read plan inline: tasks with full text, dependencies, Domains header (+ per-task Domain tags) → checklists, group tasks into dependency phases.
3. Author script (template), embedding each task's FULL text, dependency context, matched checklists per phase, working dir, Scala-tools note. Launch via `Workflow`, args `{ phases, workdir, scalaTools, checklists, skillDir }`.
4. On completion, present build result + final review, then wrap up the branch (review changes, offer merge / PR / cleanup via `AskUserQuestion`).

### Script template (adapt)

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

const prior = []
for (const ph of phases) {                 // SEQUENTIAL — dependents after dependencies
  const depContext = prior.length
    ? `\n## Prior phase outputs (use these types/files; follow established patterns)\n${JSON.stringify(prior, null, 2)}` : ''

  phase('Implement')
  let reports = (await parallel(ph.tasks.map(t => () => agent(
    `Read your role from ${skillDir}/implementer-prompt.md.\n` +
    `## Task\n${t.text}\n## Working directory\n${workdir}\nScala tools: ${scalaTools}${depContext}\n` +
    `Do NOT run ./mill. Use diagnostics after edits. Commit when done and report.`,
    { label: `impl:${t.id}`, phase: 'Implement', model: 'sonnet', isolation: 'worktree', schema: REPORT }
  )))).filter(Boolean)
  const stuck = reports.filter(r => r.status !== 'DONE')
  if (stuck.length) log(`Phase ${ph.name}: ${stuck.map(r => `${r.taskId}=${r.status}`).join(', ')} — review will attempt to resolve`)

  phase('Review')
  const reviewerModel = (ph.tasks.length > 1 || (ph.checklists?.length > 1)) ? 'sonnet' : 'haiku'  // never opus
  let round = 0
  while (round < 3) {
    const review = await agent(
      `Read your role from ${skillDir}/code-quality-reviewer-prompt.md.\n` +
      `Apply ONLY these checklists: ${(ph.checklists || checklists).join(', ')}.\nScala tools: ${scalaTools}\n` +
      `Review these implementer commits against task specs. Do NOT run ./mill.\n\n` +
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

phase('Build')
const build = await agent(
  `You are the build agent and the ONLY agent allowed to run ./mill. Working dir: ${workdir}\n` +
  `1. Merge each implementer worktree commit onto the main tree.\n` +
  `2. ./mill <affected>.compile (or __.compile). Fix errors, recompile until clean.\n` +
  `3. ./mill <affected>.test. Fix failures, rerun until green.\n` +
  `4. ./mill <affected>.checkStyleDirty. Fix violations.\nReport final status + commit hash.`,
  { label: 'build', phase: 'Build', model: 'sonnet' }
)

phase('Final review')
const finalReview = await agent(
  `Read your role from ${skillDir}/code-quality-reviewer-prompt.md. Review the ENTIRE implementation across all ` +
  `tasks for cross-task / integration issues. Checklists: ${checklists.join(', ')}. Scala tools: ${scalaTools}. ` +
  `Do NOT run ./mill (build already green). Report findings.`,
  { label: 'final-review', phase: 'Final review', model: 'sonnet', agentType: 'Explore' }
)

return { phases: phases.map(p => p.name), reports: prior, build, finalReview }
```

### After the workflow returns

Report build status + final review findings. Wrap up branch: review changes, then `AskUserQuestion` to merge / open PR / clean up. Never start on main/master without consent.

### Caveats

- Worktree isolation default; Build stage reconciles onto main tree.
- Single mill runner, after all phases; phases sequential.
- No live messaging — NEEDS_CONTEXT/BLOCKED logged + best-effort-resolved; stuck tasks surface in the return value.
- Plan required. Resume: identical script + `args` replays completed phases.
