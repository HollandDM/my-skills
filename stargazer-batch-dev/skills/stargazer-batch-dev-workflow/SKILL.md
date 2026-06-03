---
name: stargazer-batch-dev-workflow
description: >
  Build and run a deterministic Workflow (via the Workflow tool) that implements the Stargazer batch-parallel
  plan-execution pipeline — group plan tasks into dependency batches, run implementers in parallel per batch,
  review, then compile/reformat/commit once per batch — as a single background orchestration script instead of
  a live advisor/implementer TeamCreate. Use when the user says "execute the plan with a workflow", "run the
  batch dev workflow", or wants autonomous batch execution as a resumable background run. For the interactive
  (live advisor + SendMessage) version use the `stargazer-batch-dev` skill instead.
---

# Stargazer Batch-Dev (Workflow edition)

This skill tells you HOW to author and launch a **Workflow** script that reproduces the
`stargazer-batch-dev` execution model deterministically. The classic skill spawns a live advisor (opus) +
implementers (sonnet) that talk over `SendMessage`; this version compiles batch scheduling, parallel
implementation, review, and the single mill step into one `Workflow(...)` call.

## Prerequisite: the Workflow tool (with fallback)

This skill **requires the `Workflow` tool**. Confirm it is available first. If the `Workflow` tool is **not**
present, do NOT emulate it — **fall back to the sibling base skill `stargazer-batch-dev`** (live
advisor/implementer team), which runs the same batch loop interactively. Say so, invoke that skill, and stop.

## Critical concurrency facts (read before authoring)

- **Parallel implementers mutate files** → they MUST NOT share one working tree or they corrupt each other's
  git state. Run each implementer with `isolation: 'worktree'` so it edits an isolated copy. The script then
  has a **merge stage** that applies each worktree's commit back onto the main tree before compiling.
  - If (and only if) the batch's tasks provably touch disjoint files AND the user accepts the risk, you may
    drop worktree isolation for speed — but the safe default is worktree-per-implementer.
- **Only ONE `./mill` runs at a time.** Mill commands block each other, so compile/reformat happen in a single
  dedicated stage at the **end** of each batch, never inside the parallel implementer fan-out, and batches run
  strictly sequentially.
- **No live advisor.** The base skill's reactive advisor (answer questions, review on demand via SendMessage)
  becomes: (a) a richer self-contained implementer prompt, and (b) a per-batch **review agent** that reads the
  batch's commits and returns approval or required fixes, driving a bounded fix loop.

## What you do

1. **Get the plan file path** (ask once if missing — the only pre-launch question).
2. **Read the plan, build the batch schedule inline** (hybrid): group tasks so independent tasks share a batch
   and dependents go to later batches. This is cheap and lets you pass a concrete batch list into the workflow.
3. **Author the script** from the template, embedding each task's FULL text (never make agents read the plan)
   and the working directory.
4. **Launch** with the `Workflow` tool, passing `{ batches, workdir }` via `args`.
5. **On completion**, present a summary of every task implemented and the per-batch commit/compile results.

## Script template (adapt)

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

for (const batch of batches) {            // batches are SEQUENTIAL (dependencies)
  // ---- Implement: one worktree-isolated implementer per task, in parallel ----
  phase('Implement')
  let reports = (await parallel(batch.tasks.map(t => () => agent(
    `You are the implementer for this task. Implement it EXACTLY as specified.\n` +
    `## Task\n${t.text}\n## Working directory\n${workdir}\n` +
    `## Stargazer coding rules (violations break compile/checkStyle)\n${RULES}\n` +
    `Use the diagnostics MCP tool after edits to catch type errors locally. Do NOT run ./mill.\n` +
    `When done, COMMIT your work with a descriptive message and report what you changed.`,
    { label: `impl:${t.id}`, phase: 'Implement', model: 'sonnet', isolation: 'worktree', schema: REPORT }
  )))).filter(Boolean)

  // ---- Review + bounded fix loop (replaces the live advisor) ----
  phase('Review')
  let round = 0
  while (round < 3) {
    const review = await agent(
      `You are the batch advisor (read-only). Review these implementer commits against their task specs.\n` +
      `Do NOT run ./mill. Read the changed files and judge correctness + adherence to the rules:\n${RULES}\n\n` +
      `Batch tasks:\n${batch.tasks.map(t => `### ${t.id}\n${t.text}`).join('\n\n')}\n\n` +
      `Implementer reports:\n${JSON.stringify(reports, null, 2)}\n` +
      `Return approved=true if all good, else list specific per-task fixes.`,
      { label: `review:${batch.name}:r${round}`, phase: 'Review', model: 'opus', schema: REVIEW, agentType: 'Explore' }
    )
    if (review.approved || !review.fixes?.length) break
    // dispatch fixes back to per-task implementers (worktree) in parallel
    const byTask = {}
    for (const f of review.fixes) (byTask[f.taskId] ||= []).push(f)
    reports = (await parallel(Object.entries(byTask).map(([taskId, fixes]) => () => agent(
      `Apply these review fixes to task ${taskId}, then re-commit and report.\n` +
      `Working directory: ${workdir}\nRules:\n${RULES}\nFixes:\n${JSON.stringify(fixes, null, 2)}`,
      { label: `fix:${taskId}:r${round}`, phase: 'Review', model: 'sonnet', isolation: 'worktree', schema: REPORT }
    )))).filter(Boolean)
    round++
  }

  // ---- Build: merge worktrees → single mill compile + reformat + commit ----
  phase('Build')
  const build = await agent(
    `You are the build agent. Tasks for batch "${batch.name}" were implemented in isolated worktrees.\n` +
    `1. Merge/cherry-pick each implementer's commit onto the main working tree at ${workdir}.\n` +
    `2. Run ./mill __.compile. If it fails, fix the specific compile errors (you may edit), then recompile until clean.\n` +
    `3. Run ./mill __.reformat. 4. git add -A && git commit --allow-empty -m "batch ${batch.name} complete: <summary>".\n` +
    `Report the final commit hash and compile status. You are the ONLY agent allowed to run ./mill.`,
    { label: `build:${batch.name}`, phase: 'Build', model: 'sonnet' }
  )
  results.push({ batch: batch.name, tasks: batch.tasks.map(t => t.id), build })
}

return { batches: results }
```

## Notes / caveats

- **Worktree isolation is the safe default** for parallel file-mutating implementers; the Build stage
  reconciles them on the single main tree. Document if you drop it for disjoint-file batches.
- **Single mill, end of batch, sequential batches** — never parallelize `./mill`.
- **No live advisor Q&A** — replaced by a self-contained implementer prompt + a bounded (≤3 round)
  review→fix loop per batch.
- **No mid-run user questions.** Get the plan path up front; summarize after.
- **Resume:** identical script + `args` replays completed batches from cache; only changed `agent()` calls re-run.
