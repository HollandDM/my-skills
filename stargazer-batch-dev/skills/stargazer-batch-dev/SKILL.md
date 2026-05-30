---
name: stargazer-batch-dev
description: >
  Execute Stargazer Scala/ZIO plans via batch-parallel advisor-implementer model.
  Trigger: "implement the plan", "execute plan", "implement plan", "stargazer batch dev",
  or approved plan ready for execution. Batches independent tasks in parallel — one advisor
  (high-capability) per batch, one implementer (balanced-capability) per task. Loops autonomously through all batches.
  DO NOT use any other skill — follow this skill's instructions only.
---

# Stargazer Batch-Parallel Plan Execution

**Team lead.** Orchestrate only — never write implementation code, never run `./mill` until batch done, never ask user questions.

Get plan file path from user. Ask once if missing — only exception to no-questions rule.

---

## Session ID prefix (MANDATORY — avoid name conflict across concurrent sessions)

Before creating team or spawning any agent, compute short session ID once:

```bash
SID=$(git rev-parse --short HEAD 2>/dev/null || printf '%04x' $RANDOM)
```

Prefix **every** team name and agent name in this skill with `${SID}-`. Examples below show literal `<SID>-` placeholder — substitute real value. Names used between teammates MUST be fully prefixed (e.g. `<SID>-advisor`, `<SID>-implementer-1`).

---

## Step 1: Read Plan & Build Batch Schedule

Read plan once. Extract tasks, group into **batches**:
- Tasks with no interdependencies → same batch (run in parallel)
- Tasks that depend on earlier tasks → later batches

Create task checklist: all batches + tasks.

---

## The Batch Loop

Repeat until all batches complete:

### A. Setup the Team

1. Pick next incomplete batch
2. If a previous team exists, delete the `<SID>-batch-team` team
3. Create the `<SID>-batch-team` team, described as "Batch N execution"

### B. Spawn All Agents (one message, all at once)

Spawn advisor + all implementers **simultaneously** in single turn.

**Advisor** — spawn into the `<SID>-batch-team` team, named `<SID>-advisor`, using a high-capability model, in a read-only role (cannot modify files).

> The read-only role removes file modification (Edit/Write) entirely — the advisor physically cannot modify files, only read + advise.

Pass only this batch's tasks — not other batches or full plan.

```
You are the advisor for Batch N of an implementation plan. You are part of team "<SID>-batch-team".
Your role is purely reactive — do NOT read files or explore the codebase upfront. Any
knowledge you gain now will be outdated once implementers start making changes. Instead,
wait for implementers to contact you, then read only what is relevant to their question
at that moment.

## Your scope: this batch only
You are responsible for exactly the tasks listed below. You have no context about
other batches and must not attempt to review or influence anything outside this batch.

## This Batch's Tasks
[Full text of ONLY the tasks in this batch — nothing else from the plan]

## Working directory
[path]

## Your role — WAIT, then respond on demand

**Do nothing until an implementer contacts you.** There are two situations:

1. **Implementer asks for advice** — read only the files relevant to their question,
   then reply with targeted guidance directly back to them.

2. **Implementer sends a completion report** — read their changed files and commit,
   review against the task spec, then reply with approval or specific feedback.

- MUST NOT run any `./mill` commands
- When ALL implementers have been approved by you: report `BATCH_READY` directly to the team lead
```

**Implementer-N** (one per task) — spawn into the `<SID>-batch-team` team, named `<SID>-implementer-N`, using a balanced-capability model

```
You are implementer-N, responsible for Task N. You are part of team "<SID>-batch-team".

## Your Task
[Full text of the specific task]

## Working directory
[path]

## Your role
1. Implement the task exactly as specified
2. For complex problems or architectural questions, ask the advisor `<SID>-advisor`
   directly — they have the full batch context and can help
3. MUST NOT run any `./mill` commands (not even to check — the team lead handles compilation)
4. Use `diagnostics` MCP tool after edits to catch type errors locally
5. When done: commit your work with a descriptive message
6. Then send a completion report directly to "<SID>-advisor":
   - What you implemented
   - Files changed
   - Any concerns
7. Wait — the advisor may send feedback. Fix any issues and notify them again.
   Continue this loop until the advisor approves you.

## Stargazer coding rules (violations cause compile/checkStyle failures)
- `final case class` always (never non-final)
- No `var`, `null`, `return`, `while`, `println`, `.asInstanceOf`, `.isInstanceOf`
- No `ZIO.foreachPar` (use `ZIOUtils.foreachPar`)
- Use `ZIO.attemptBlocking` for I/O, not `ZIO.attempt`
- Pair `.tapError` with `.tapDefect`
- Every `.scala` file starts with: `// Copyright (C) 2014-2026 Anduin Transactions Inc.`
- Use `given`/`using` not `implicit`
```

### C. Wait for `BATCH_READY`

Block until advisor sends `BATCH_READY` to you.

### D. Compile (team lead only)

```bash
./mill __.compile
```

**If compile fails:**
- Read error, identify responsible task/implementer
- Message the implementer directly: describe exact error, file, line — do NOT fix it yourself
- Wait for implementer to confirm fix
- Re-run `./mill __.compile`
- Repeat until clean

### E. Reformat & Batch Commit

Once compile clean:

```bash
./mill __.reformat
git add -A
git commit --allow-empty -m "batch N complete: [brief summary of what was done]"
```

### F. Mark & Loop

Mark batch tasks done in task checklist. Loop to A.

---

## Done

All batches done: present summary of every task implemented.

---

## Non-Negotiable Rules

| Who | Rule |
|-----|------|
| Team lead | Never write implementation code |
| Team lead | Never run `./mill` before `BATCH_READY` |
| Team lead | Never fix compile errors — always delegate back |
| Team lead | Never stop or ask user questions (one exception: initial plan file) |
| Implementers | Never run `./mill` |
| Advisor | Never run `./mill` |
| Advisor | Never edit files (enforced by its read-only role — read-only by design) |
| All | Keep looping until every batch done |