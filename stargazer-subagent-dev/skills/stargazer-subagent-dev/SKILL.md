---
name: stargazer-subagent-dev
description: >
  Execute implementation plans for Stargazer codebase by dispatching team-based agents
  per task with code quality review. Use when user has approved plan ready for execution.
  Triggers: "execute plan", "implement plan", "subagent dev", "stargazer implement",
  or when user has plan and wants to start building. Specific to Stargazer Scala/ZIO/FoundationDB
  codebase — not applicable for non-Stargazer work. If user has no plan, tell them to
  create one first (e.g., using writing-plans skill or plan mode).
---

# Stargazer Subagent-Driven Development

**Capture skill base directory** from "Base directory for this skill:" line above.
Store as `SKILL_DIR` — all file references below relative to it.

Execute implementation plans for Stargazer codebase.

---

## Step 0: Verify Scala Code Intelligence

Skill depends on `scala-code-intelligence` skill — provides IntelliJ-powered
MCP tools (`definition`, `references`, `implementations`, `hover`, `workspace_symbols`,
`document_symbols`, `diagnostics`, `rename_symbol`, `format`, `organize_imports`, etc.).

Verify MCP tools available by invoking `scala-code-intelligence` skill. If unavailable,
check `cellar` CLI (`which cellar`). `cellar` = fallback for symbol lookup when MCP unavailable:

- `cellar search -m <module> <query>` — substring search for symbol names
- `cellar get -m <module> <fully-qualified-symbol>` — fetch symbol info (signature, type)
- `cellar list -m <module> <fully-qualified-symbol>` — list members of package/class
- `cellar get-source <maven-coordinate> <fully-qualified-symbol>` — read source of external deps

`cellar` requires `-m <module>` flag for project symbols (e.g., `-m fundsub.jvm`).
Works from bytecode — no running LSP needed. Cannot find references, implementations, or diagnostics — only definitions and symbol listings.

If neither available, warn user but proceed — fall back to grep/glob for code navigation.

## Entry Point: Get the Plan

Requires existing, approved implementation plan. Ask user for plan file path.

If user has no plan yet, tell them:

> "This skill executes existing plans — it doesn't write them. Please create a plan first
> (e.g., using plan mode or the writing-plans skill), then come back with the plan file path."

Do **not** proceed without a plan.

---

# Executing the Plan

## Overview

You = **controller**. Never write implementation code yourself. You:
1. Read plan, extract all tasks
2. Create team for session
3. Per task: dispatch implementer -> quality reviewer
4. After all tasks: final review, then finish branch

Scala code intelligence MCP tools available from Step 0.

Each team member scoped to single task — created when task starts, shutdown when review cycle completes.

## Step 1: Read Plan and Create Tasks

1. Read plan file once, extract **all tasks with full text**
2. Note cross-task dependencies and shared context
3. Create TodoWrite checklist with all tasks
4. Read **Domains** field from plan header — determines which quality review checklists each task's reviewer loads
5. If tasks have **Domain** tags, use for per-task routing

## Step 2: Create Team

Use **TeamCreate** to create session team:

```
team_name: "stargazer-dev"
description: "Stargazer plan execution session"
```

Team persists entire plan execution. Members join and leave per task.

## Step 3: Execute Phases

Work organized into **phases** — groups of independent tasks that run in parallel.
Dependent tasks go into later phases. Each phase: implementers -> reviewer -> next phase.

### 3a. Group Tasks into Phases

Identify blocking dependencies, group tasks:
- **Phase 1**: No-dependency tasks (run in parallel)
- **Phase 2**: Depends on Phase 1 outputs
- **Phase N**: Depends on Phase N-1 outputs

### 3b. Dispatch Phase (Implementers + Reviewer in Parallel)

Spawn all implementers **and** phase reviewer simultaneously:

**Implementers:** Use template in `${SKILL_DIR}/implementer-prompt.md`.
- `team_name: "stargazer-dev"`, `name: "implementer-N"`
- Tell each implementer reviewer = `"phase-P-reviewer"` — message reviewer directly when done, respond to feedback directly.

**Implementer model selection:**
- 1-2 files, clear spec -> `model: "sonnet"`
- Multi-file coordination, integration concerns -> default (no override)
- Architectural judgment or broad codebase understanding -> `model: "opus"`

**Phase Reviewer:** Use template in `${SKILL_DIR}/code-quality-reviewer-prompt.md`.
- `team_name: "stargazer-dev"`, `name: "phase-P-reviewer"`
- Tell reviewer which implementers to expect (e.g., `implementer-1`, `implementer-2`)
- Reviewer waits for all implementers, then reviews all changes together.

**Reviewer model selection** (always lightweight — never opus):
- Few files, single checklist -> `model: "haiku"`
- Multiple files or checklists -> `model: "sonnet"`

Before dispatching reviewer, determine checklists by scanning plan tasks for domain/tech indicators — see routing table in `${SKILL_DIR}/code-quality-reviewer-prompt.md`. Pass only matching checklists.

**Key context for all prompts:**
- Full task text from plan (never make agents read plan file)
- Where task fits in overall plan
- Dependencies on previous phases and what changed
- Working directory
- Reviewer name (for implementers) / implementer names (for reviewer)

### 3c. Handle Escalations

Intervene only when agent messages team lead:

| Status | Action |
|--------|--------|
| **NEEDS_CONTEXT** | Answer questions via SendMessage, let agent continue |
| **BLOCKED** | Assess: provide context, re-dispatch with stronger model, break task down, or escalate to user |

### 3d. Wait for Phase Completion

Reviewer and implementers communicate directly:
1. Implementer finishes → messages reviewer with report
2. Reviewer waits for all implementers, reviews combined diff
3. Reviewer messages implementers with issues per-task
4. Implementers fix, message reviewer again (up to 3 rounds)
5. Reviewer sends final APPROVED/NEEDS_CHANGES to team lead

Controller only waits for reviewer's final report.

- **APPROVED**: Shutdown all phase members, mark tasks complete.
- **NEEDS_CHANGES** (after 3 fix rounds): Escalate to user.

### 3e. Complete Phase

1. Shutdown reviewer and all implementers
2. Mark all phase tasks complete
3. Proceed to next phase (go back to 3b)

## Step 4: Compile & Test

After all tasks complete, run `./mill` **once** from controller. Never run `./mill` concurrently — commands block each other.

1. Compile all affected modules: `./mill <module>.compile` (or `./mill __.compile` for all)
2. Compile fails → identify which task introduced error, dispatch fix agent (reuse implementer template, provide compile error and relevant files)
3. Clean compile → run tests: `./mill <module>.test`
4. Tests fail → dispatch fix agents for failing modules
5. Run `./mill <module>.checkStyleDirty` on all affected modules, fix violations
6. Repeat until compile + tests + checkStyle pass

Proceed to final review only after clean build.

## Step 5: Final Review

Build green → dispatch final code quality reviewer (`name: "final-reviewer"`) to review **entire implementation** across all tasks. Catches cross-task integration issues per-task reviews miss.

## Step 6: Finish

Delete team:

```
TeamDelete: team_name: "stargazer-dev"
```

Wrap up branch: review all changes, decide to merge, create PR, or clean up. Present user with options.

## Handling Cross-Task Dependencies

When task B depends on task A:
- Include task A's implementer report in task B's context
- Mention specific files/types task A created that task B should use
- If task A created new patterns, tell task B's implementer to follow them

---

## Red Flags

**Never:**
- Write implementation code yourself (you = controller)
- Start implementation on main/master without user consent
- Skip quality review stage
- Dispatch dependent phases in parallel (conflict on shared files)
- Dispatch more than one reviewer per phase
- Make implementers read plan file (provide full text)
- Ignore implementer questions or BLOCKED status
- Skip re-review loop (reviewer found issues -> fix -> review again)
- Wait for all implementers before starting any reviews
- Proceed without plan
- Let agents run `./mill` commands — only controller runs mill, once, after all tasks

**Always:**
- Verify scala-code-intelligence MCP tools (or cellar fallback) available at start
- Provide full task text and context to every agent
- Let implementers ask questions before starting
- Shutdown task members before moving to next task