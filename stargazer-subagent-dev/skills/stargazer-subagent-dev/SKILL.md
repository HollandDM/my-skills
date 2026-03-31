---
name: stargazer-subagent-dev
description: >
  Execute implementation plans for the Stargazer codebase by dispatching team-based agents
  per task with code quality review. Use when the user has
  an approved plan ready for execution. Triggers on: "execute plan", "implement plan",
  "subagent dev", "stargazer implement", or when the user has a plan and wants to start
  building. This skill is specific to the Stargazer Scala/ZIO/FoundationDB codebase —
  for non-Stargazer work, this skill is not applicable. If the user does not have a plan,
  tell them to create one first (e.g., using the writing-plans skill or plan mode).
---

# Stargazer Subagent-Driven Development

**Capture the skill base directory** from the "Base directory for this skill:" line above.
Store it as `SKILL_DIR` — all file references below are relative to it.

Execute implementation plans for the Stargazer codebase.

---

## Step 0: Verify Scala Code Intelligence

This skill depends on the `scala-code-intelligence` skill which provides IntelliJ-powered
MCP tools (`definition`, `references`, `implementations`, `hover`, `workspace_symbols`,
`document_symbols`, `diagnostics`, `rename_symbol`, `format`, `organize_imports`, etc.).

Before proceeding, verify the MCP tools are available by invoking the `scala-code-intelligence`
skill. If the MCP tools are not available, check whether the `cellar` CLI is installed
(`which cellar`). `cellar` is a fallback for symbol lookup when the MCP tools are unavailable:

- `cellar search -m <module> <query>` — substring search for symbol names
- `cellar get -m <module> <fully-qualified-symbol>` — fetch symbol info (signature, type)
- `cellar list -m <module> <fully-qualified-symbol>` — list members of a package/class
- `cellar get-source <maven-coordinate> <fully-qualified-symbol>` — read source of external deps

`cellar` requires a `-m <module>` flag for project symbols (e.g., `-m fundsub.jvm`).
It works from bytecode so it doesn't need a running LSP, but it cannot find references,
implementations, or diagnostics — only definitions and symbol listings.

If neither MCP tools nor `cellar` are available, warn the user but proceed — fall back to
grep/glob for code navigation.

## Entry Point: Get the Plan

This skill requires an existing, approved implementation plan. Ask the user for the plan
file path.

If the user does not have a plan yet, tell them:

> "This skill executes existing plans — it doesn't write them. Please create a plan first
> (e.g., using plan mode or the writing-plans skill), then come back with the plan file path."

Do **not** proceed without a plan.

---

# Executing the Plan

## Overview

You are the **controller**. You never write implementation code yourself. You:
1. Read the plan and extract all tasks
2. Create a team for the session
3. For each task: dispatch implementer -> quality reviewer
4. After all tasks: final review, then finish the branch

Scala code intelligence MCP tools are available from Step 0.

Each team member is scoped to a single task — created when the task starts, shutdown when
the task's review cycle completes.

## Step 1: Read Plan and Create Tasks

1. Read the plan file once, extract **all tasks with full text**
2. Note cross-task dependencies and shared context
3. Create a TodoWrite checklist with all tasks
4. Read the **Domains** field from the plan header — this determines which quality review
   checklists each task's reviewer will load
5. If tasks have individual **Domain** tags, use those for per-task routing

## Step 2: Create Team

Use **TeamCreate** to create a session team:

```
team_name: "stargazer-dev"
description: "Stargazer plan execution session"
```

This team persists for the entire plan execution. Members join and leave per task.

## Step 3: Execute Phases

Work is organized into **phases** — groups of independent tasks that can run in parallel.
Dependent tasks go into later phases. Each phase follows: implementers -> reviewer -> next phase.

### 3a. Group Tasks into Phases

From the plan, identify blocking dependencies and group tasks:
- **Phase 1**: Tasks with no dependencies (can all run in parallel)
- **Phase 2**: Tasks that depend on Phase 1 outputs
- **Phase N**: Tasks that depend on Phase N-1 outputs

### 3b. Dispatch Phase (Implementers + Reviewer in Parallel)

Spawn all implementers **and** the phase reviewer simultaneously:

**Implementers:** Use the template in `${SKILL_DIR}/implementer-prompt.md`.
- `team_name: "stargazer-dev"`, `name: "implementer-N"`
- Tell each implementer their reviewer is `"phase-P-reviewer"` — they message the
  reviewer directly when done and respond to reviewer feedback directly.

**Implementer model selection:**
- Touches 1-2 files with clear spec -> `model: "sonnet"`
- Multi-file coordination, integration concerns -> default (no override)
- Requires architectural judgment or broad codebase understanding -> `model: "opus"`

**Phase Reviewer:** Use the template in `${SKILL_DIR}/code-quality-reviewer-prompt.md`.
- `team_name: "stargazer-dev"`, `name: "phase-P-reviewer"`
- Tell the reviewer which implementers to expect (e.g., `implementer-1`, `implementer-2`)
- The reviewer waits for all implementers to report, then reviews all changes together.

**Reviewer model selection** (always lightweight — never opus):
- Phase has few total files changed, single checklist -> `model: "haiku"`
- Phase has multiple files or multiple checklists -> `model: "sonnet"`

**Before dispatching the reviewer**, determine which checklists apply by scanning the
plan's tasks for domain/tech indicators — see the routing table in
`${SKILL_DIR}/code-quality-reviewer-prompt.md`. Only pass checklists that match.

**Key context to include in all prompts:**
- Full task text from the plan (never make agents read the plan file)
- Where this task fits in the overall plan
- Dependencies on previous phases and what changed
- The working directory
- The reviewer's name (for implementers) / implementer names (for reviewer)

### 3c. Handle Escalations

Only intervene when an agent messages the team lead:

| Status | Action |
|--------|--------|
| **NEEDS_CONTEXT** | Answer questions via SendMessage, let agent continue |
| **BLOCKED** | Assess: provide context, re-dispatch with stronger model, break task down, or escalate to user |

### 3d. Wait for Phase Completion

The reviewer and implementers communicate directly:
1. Each implementer finishes → messages the reviewer with their report
2. Reviewer waits for all implementers, then reviews the combined diff
3. Reviewer messages implementers directly with issues per-task
4. Implementers fix and message the reviewer again (up to 3 rounds)
5. Reviewer sends final APPROVED/NEEDS_CHANGES report to the team lead

The controller only waits for the reviewer's final report.

- **APPROVED**: Shutdown all phase members, mark tasks complete.
- **NEEDS_CHANGES** (after 3 fix rounds): Escalate to user for guidance.

### 3e. Complete Phase

1. Shutdown the reviewer and all implementers
2. Mark all phase tasks as complete
3. Proceed to the next phase (go back to 3b)

## Step 4: Compile & Test

After all tasks complete, run `./mill` **once** from the controller. Multiple agents must
never run `./mill` concurrently — mill commands block each other.

1. Compile all affected modules: `./mill <module>.compile` (or `./mill __.compile` for all)
2. If compilation fails, identify which task introduced the error and dispatch a fix agent
   (reuse the implementer template, provide the compile error and relevant files)
3. After clean compile, run tests: `./mill <module>.test`
4. If tests fail, dispatch fix agents for the failing modules
5. Run `./mill <module>.checkStyleDirty` on all affected modules and fix violations
6. Repeat until compile + tests + checkStyle all pass

Only proceed to the final review after a clean build.

## Step 5: Final Review

After the build is green, dispatch a final code quality reviewer (`name: "final-reviewer"`)
that reviews the **entire implementation** across all tasks. This catches cross-task
integration issues that per-task reviews miss.

## Step 6: Finish

Delete the team:

```
TeamDelete: team_name: "stargazer-dev"
```

Wrap up the development branch: review all changes, decide whether to merge, create a PR,
or clean up. Present the user with options.

## Handling Cross-Task Dependencies

When task B depends on task A's output:
- Include task A's implementer report in task B's context
- Mention specific files/types created by task A that task B should use
- If task A created new patterns, tell task B's implementer to follow them

---

## Red Flags

**Never:**
- Write implementation code yourself (you are the controller)
- Start implementation on main/master without user consent
- Skip the quality review stage
- Dispatch dependent phases in parallel (they'll conflict on shared files)
- Dispatch more than one reviewer per phase
- Make implementers read the plan file (provide full text)
- Ignore implementer questions or BLOCKED status
- Skip the re-review loop (reviewer found issues -> fix -> review again)
- Wait for all implementers before starting any reviews
- Proceed without a plan
- Let agents run `./mill` commands — only the controller runs mill, once, after all tasks

**Always:**
- Verify scala-code-intelligence MCP tools (or cellar fallback) are available at the start
- Provide full task text and context to every agent
- Let implementers ask questions before starting
- Shutdown task members before moving to next task
