# Stargazer Batch-Parallel Plan Execution — Workflow Mode

Use this when the **Workflow tool** is available. Author one `Workflow(...)` script: per-batch parallel implementers → review/fix loop → single mill build+commit.

### Critical concurrency facts

- Parallel implementers mutate files → run each with `isolation: 'worktree'`; a build stage reconciles commits onto the main tree. Drop isolation only for provably disjoint-file batches with user consent.
- Only ONE `./mill` runs at a time → compile/reformat in a single dedicated stage at the END of each batch, never inside the parallel fan-out. Batches run sequentially.
- No live advisor → replaced by a self-contained implementer prompt + a per-batch review agent driving a bounded fix loop.

### What you do

1. Get plan file path (ask once if missing).
2. Read plan inline, build batch schedule (independent tasks → same batch; dependents → later).
3. Author script (template), embedding each task's FULL text + working dir. Launch via `Workflow`, passing `{ batches, workdir }` in `args`.
4. On completion, summarize every task + per-batch commit/compile results.

### Script template (adapt)

```javascript
export const meta = {
  name: 'stargazer-batch-exec',
  description: 'Per-batch: parallel implementers (worktree) → review/fix loop → single mill compile + commit',
  phases: [{ title: 'Implement' }, { title: 'Review' }, { title: 'Build' }],
}

const { batches, workdir } = args   // batches: [{ name, tasks: [{ id, text }] }], dependency-ordered

const RULES = [
  '`final case class` always', 'No var/null/return/while/println/.asInstanceOf/.isInstanceOf',
  'No ZIO.foreachPar (use ZIOUtils.foreachPar)', 'ZIO.attemptBlocking for I/O (not ZIO.attempt)',
  'Pair .tapError with .tapDefect', 'Every .scala starts with: // Copyright (C) 2014-2026 Anduin Transactions Inc.',
  'Use given/using not implicit',
].map(r => `- ${r}`).join('\n')

const REPORT = { type: 'object', properties: {
  taskId: { type: 'string' }, summary: { type: 'string' },
  filesChanged: { type: 'array', items: { type: 'string' } }, commit: { type: 'string' }, concerns: { type: 'string' } },
  required: ['taskId', 'summary', 'filesChanged'] }
const REVIEW = { type: 'object', properties: {
  approved: { type: 'boolean' },
  fixes: { type: 'array', items: { type: 'object', properties: {
    taskId: { type: 'string' }, file: { type: 'string' }, issue: { type: 'string' }, fix: { type: 'string' } },
    required: ['taskId', 'issue'] } } },
  required: ['approved'] }

const results = []
for (const batch of batches) {                 // SEQUENTIAL (dependencies)
  phase('Implement')
  let reports = (await parallel(batch.tasks.map(t => () => agent(
    `You are the implementer for this task. Implement it EXACTLY as specified.\n` +
    `## Task\n${t.text}\n## Working directory\n${workdir}\n## Stargazer coding rules\n${RULES}\n` +
    `Use the diagnostics MCP tool after edits. Do NOT run ./mill. When done, COMMIT with a descriptive message and report.`,
    { label: `impl:${t.id}`, phase: 'Implement', model: 'sonnet', isolation: 'worktree', schema: REPORT }
  )))).filter(Boolean)

  phase('Review')
  let round = 0
  while (round < 3) {
    const review = await agent(
      `You are the batch advisor (read-only). Review these implementer commits against task specs and rules:\n${RULES}\n\n` +
      `Tasks:\n${batch.tasks.map(t => `### ${t.id}\n${t.text}`).join('\n\n')}\n\nReports:\n${JSON.stringify(reports, null, 2)}\n` +
      `Do NOT run ./mill. Return approved=true if all good, else per-task fixes.`,
      { label: `review:${batch.name}:r${round}`, phase: 'Review', model: 'opus', schema: REVIEW, agentType: 'Explore' }
    )
    if (review.approved || !review.fixes?.length) break
    const byTask = {}
    for (const f of review.fixes) (byTask[f.taskId] ||= []).push(f)
    reports = (await parallel(Object.entries(byTask).map(([taskId, fixes]) => () => agent(
      `Apply these review fixes to task ${taskId}, re-commit, and report.\nWorking dir: ${workdir}\nRules:\n${RULES}\n` +
      `Fixes:\n${JSON.stringify(fixes, null, 2)}`,
      { label: `fix:${taskId}:r${round}`, phase: 'Review', model: 'sonnet', isolation: 'worktree', schema: REPORT }
    )))).filter(Boolean)
    round++
  }

  phase('Build')
  const build = await agent(
    `You are the build agent and the ONLY agent allowed to run ./mill. Working dir: ${workdir}\n` +
    `1. Merge/cherry-pick each implementer worktree commit onto the main tree.\n` +
    `2. ./mill __.compile — fix compile errors, recompile until clean.\n` +
    `3. ./mill __.reformat. 4. git add -A && git commit --allow-empty -m "batch ${batch.name} complete: <summary>".\n` +
    `Report final commit hash + compile status.`,
    { label: `build:${batch.name}`, phase: 'Build', model: 'sonnet' }
  )
  results.push({ batch: batch.name, tasks: batch.tasks.map(t => t.id), build })
}

return { batches: results }
```

### Caveats

- Worktree isolation is the safe default; Build stage reconciles on the single main tree.
- Single mill, end of batch, sequential batches — never parallelize `./mill`.
- No live advisor Q&A — self-contained implementer prompt + bounded (≤3) review/fix loop.
- No mid-run user questions. Resume: identical script + `args` replays completed batches.
