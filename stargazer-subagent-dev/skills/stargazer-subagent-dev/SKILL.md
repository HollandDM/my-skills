---
name: stargazer-subagent-dev
description: >
  Plan and execute implementations for the Stargazer codebase. Phase 1 writes a detailed
  implementation plan with Stargazer-specific task structure. Phase 2 executes it by
  dispatching team-based agents per task with two-stage review (spec compliance then code
  quality). Use when the user wants to implement a feature, fix a bug, or build something
  in the Stargazer repo — whether they have a plan already or need one written first.
  Triggers on: "execute plan", "implement plan", "subagent dev", "stargazer implement",
  "build this feature", "implement this", or when the user has a spec/requirements and
  wants to start building. Also trigger when the user has an approved plan ready for
  execution. This skill is specific to the Stargazer Scala/ZIO/FoundationDB codebase —
  for non-Stargazer work, this skill is not applicable.
---

# Stargazer Subagent-Driven Development

Plan and execute implementations for the Stargazer codebase.

**Two phases:**
- **Phase 1: Write the Plan** — research the codebase, design tasks, get plan reviewed
- **Phase 2: Execute the Plan** — dispatch team members per task with two-stage review

---

## Step 0: Start Scala LSP

Start the LSP daemon before anything else — it's needed for both plan writing (codebase
research) and implementation (agents use it extensively).

```bash
/home/hoangdinh/OSS/intellij-scala-lsp/launcher/launch-lsp.sh --daemon
```

Verify it's up:
```bash
kill -0 $(cat ~/.cache/intellij-scala-lsp/daemon.pid) 2>/dev/null && echo "LSP running on port $(cat ~/.cache/intellij-scala-lsp/daemon.port)" || echo "LSP failed to start"
```

If it fails to start, warn the user but proceed — LSP is helpful but not blocking.

## Entry Point: Ask the User

Use **AskUserQuestion** to determine the workflow:

```
question: "How would you like to proceed?"
header: "Stargazer Development"
options:
  - label: "Execute approved plan"
    description: "I already have a plan ready — skip to implementation"
  - label: "Draft a plan"
    description: "Research the codebase and write an implementation plan first"
```

- **"Execute approved plan":** Ask the user for the plan file path, then skip to **Phase 2**.
- **"Draft a plan":** Continue with **Phase 1** below.

---

# Phase 1: Writing the Plan

## 1.1 Understand the Requirements

Before writing anything, understand what needs to be built. Sources:
- User's description / spec / ticket
- Existing code in the area (use LSP and grep to explore)

If the spec covers multiple independent subsystems, suggest breaking into separate plans —
one per subsystem. Each plan should produce working, testable software on its own.

## 1.2 Research the Codebase

Use LSP and codebase exploration to understand:
- **Existing patterns** in the area you'll be working in — find similar implementations
- **File structure** — where new files should go, what naming conventions exist
- **Dependencies** — what modules/services already exist that the feature needs
- **Test patterns** — how similar features are tested (base classes, fixtures, utilities)

This research directly informs the plan. Don't write tasks in a vacuum.

## 1.3 Design File Structure

Before defining tasks, map out which files will be created or modified:

- Each file should have one clear responsibility with a well-defined interface
- Prefer smaller, focused files over large ones
- Files that change together should live together
- Follow established Stargazer patterns (Endpoint -> Service -> Store layers,
  `shared/src/` for models, `jvm/src/` for backend, `js/src/` for frontend)
- In existing codebases, follow the patterns already there

This structure drives the task decomposition.

## 1.4 Write the Plan

Save to: `/tmp/YYYY-MM-DD-<feature-name>-plan.md`

### Plan Header

Every plan starts with:

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** This plan is designed for stargazer-subagent-dev execution.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key Stargazer technologies involved — e.g., ZIO, FDB, Temporal, Tapir, Laminar]

**Domains:** [Which review domains apply — e.g., scala-quality, zio-patterns, fdb-patterns, testing]

---
```

The **Domains** field tells Phase 2 which quality review checklists to load.

### Task Structure

Each task is a self-contained unit of work that produces a compilable, testable increment.

````markdown
### Task N: [Component Name]

**Domain:** [fdb | temporal | tapir | frontend | zio | general]

**Files:**
- Create: `exact/path/to/file.scala`
- Modify: `exact/path/to/existing.scala:123-145`
- Test: `tests/exact/path/to/TestSpec.scala`

**Context:**
[What the implementer needs to know — which existing patterns to follow, which types to
use, how this connects to other tasks. Reference specific files and line numbers.]

- [ ] **Step 1: Write the failing test**

```scala
// In tests/exact/path/to/TestSpec.scala
test("specific behavior description") {
  for {
    result <- service.method(input)
  } yield assertTrue(
    result.field == expectedValue
  )
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./mill module.test -- -t "specific behavior description"`
Expected: FAIL — method not defined

- [ ] **Step 3: Write minimal implementation**

```scala
// In exact/path/to/file.scala
// Copyright (C) 2014-2026 Anduin Transactions Inc.

// ... implementation code
```

- [ ] **Step 4: Compile and run tests**

Run: `./mill module.compile && ./mill module.test`
Expected: PASS

- [ ] **Step 5: Run checkStyle**

Run: `./mill module.checkStyleDirty`
Expected: No violations

- [ ] **Step 6: Commit**

```bash
git add <specific files>
git commit -m "feat(module): add specific feature"
```
````

### Writing Guidelines

- **Exact file paths** — always. Use LSP to verify paths exist.
- **Complete code** — not "add validation here". Show the actual code.
- **Exact commands** — with expected output so the implementer can verify.
- **Stargazer patterns** — reference existing implementations by file path.
  "Follow the pattern in `modules/fundsub/jvm/src/.../FundSubService.scala:45-80`"
- **TDD** — test first, implement second, always.
- **Bite-sized steps** — each step is one action (2-5 minutes).
- **DRY, YAGNI** — don't over-build. Only what the spec requires.
- **Copyright header** — every new `.scala` file needs it.
- **Domain tag** — each task gets a domain tag for quality review routing.

## 1.5 Plan Review

After writing the complete plan, dispatch a plan reviewer subagent using
`./plan-reviewer-prompt.md`. This is a one-shot agent (not a team member).

- If **Issues Found**: fix the issues, re-dispatch reviewer
- If **Approved**: proceed to Phase 2
- If loop exceeds 3 iterations: surface to user for guidance

## 1.6 Confirm with User

Present the plan and ask:

> "Plan written and saved to `/tmp/<filename>.md`.
> Ready to start execution (Phase 2)?"

Wait for user confirmation before proceeding.

---

# Phase 2: Executing the Plan

## Overview

You are the **controller**. You never write implementation code yourself. You:
1. Read the plan and extract all tasks
2. Create a team for the session
3. For each task: dispatch implementer -> spec reviewer -> quality reviewer
4. After all tasks: final review, then finish the branch

LSP is already running from Step 0.

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

## Step 3: Dispatch and Review Tasks

### Parallelism Strategy

Tasks run in parallel where possible. **As soon as an implementer finishes, immediately
dispatch its spec reviewer** — don't wait for other implementers to finish.

- **Independent tasks** (no shared files, no dependency): dispatch implementers in parallel
- **Dependent tasks** (task B needs task A's output): dispatch B only after A's full review
  cycle completes
- Review chains are always sequential per task: implementer → spec reviewer → quality reviewer

### 3a. Dispatch Implementers

For each task (or batch of independent tasks), spawn implementer agents as **named team
members** using the template in `./implementer-prompt.md`. Use `team_name: "stargazer-dev"`
and `name: "implementer-N"` (where N is the task number).

**Model selection:**
- Touches 1-2 files with clear spec -> `model: "sonnet"`
- Multi-file coordination, integration concerns -> default (no override)
- Requires architectural judgment or broad codebase understanding -> `model: "opus"`

**Key context to include in the prompt:**
- Full task text from the plan (never make the implementer read the plan file)
- Where this task fits in the overall plan
- Dependencies on previous tasks and what changed
- The working directory
- Which domain skills are relevant (e.g., `zio-skill`, `tapir-endpoint`, `foundationdb`)

### 3b. Handle Implementer Status

As each implementer reports back, handle it immediately:

| Status | Action |
|--------|--------|
| **DONE** | Immediately dispatch spec reviewer for this task |
| **DONE_WITH_CONCERNS** | Read concerns. If correctness/scope, address before review. If observations, note and proceed to spec review |
| **NEEDS_CONTEXT** | Answer questions via SendMessage, let implementer continue |
| **BLOCKED** | Assess: provide context, re-dispatch with stronger model, break task down, or escalate to user |

When using **SendMessage** to answer questions or provide context:

```
to: "implementer-N"
message: <answer to their question with full context>
summary: "Providing context for [topic]"
```

### 3c. Dispatch Spec Reviewer (immediately when implementer finishes)

As soon as implementer-N reports DONE, spawn a spec reviewer as a team member using
`./spec-reviewer-prompt.md`. Use `name: "spec-reviewer-N"`.

**Always use `model: "sonnet"`** — spec compliance is a focused comparison task.

Pass:
- Full task requirements (from plan)
- Implementer's report (what they claim they built)

The spec reviewer messages the implementer directly to fix issues and re-verifies.
This loop runs autonomously — you don't need to mediate. Wait for the spec reviewer's
final report (PASS or FAIL).

### 3d. Dispatch Code Quality Reviewer (immediately when spec passes)

As soon as spec reviewer-N reports PASS, spawn a code quality reviewer as a team member
using `./code-quality-reviewer-prompt.md`. Use `name: "quality-reviewer-N"`.

**Always use `model: "sonnet"`** — code quality review is checklist-driven.

**Before dispatching**, determine which checklists apply by scanning the diff
(`git diff <base>..<head>`) for trigger patterns — see the routing table in
`./code-quality-reviewer-prompt.md`. Only pass checklists that match actual file content.

Pass:
- Task summary
- Implementer's report
- Git SHAs (base and head) for the task's changes
- Which checklist files to load (determined by file-content routing, not domain tags)

The quality reviewer messages the implementer directly to fix blockers/suggestions and
re-reviews. This loop runs autonomously — you don't need to mediate. Wait for the quality
reviewer's final report (APPROVED or NEEDS_CHANGES).

### 3e. Shutdown Task Members

After a task's full review cycle completes (quality reviewer reports):

```
to: "spec-reviewer-N"
message: {"type": "shutdown_request", "reason": "Task N review complete"}

to: "quality-reviewer-N"
message: {"type": "shutdown_request", "reason": "Task N review complete"}

to: "implementer-N"
message: {"type": "shutdown_request", "reason": "Task N complete"}
```

Mark the task complete in TodoWrite. Other tasks may still be running their cycles.

## Step 4: Final Review

After all tasks complete, dispatch a final code quality reviewer (`name: "final-reviewer"`)
that reviews the **entire implementation** across all tasks. This catches cross-task
integration issues that per-task reviews miss.

## Step 5: Finish

Delete the team:

```
TeamDelete: team_name: "stargazer-dev"
```

Wrap up the development branch: review all changes, decide whether to merge, create a PR,
or clean up. Present the user with options.

**Last action — stop the Scala LSP daemon:**

```bash
/home/hoangdinh/OSS/intellij-scala-lsp/launcher/launch-lsp.sh --stop
```

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
- Skip either review stage (spec compliance AND code quality are both required)
- Dispatch dependent implementers in parallel (they'll conflict on shared files)
- Make implementers read the plan file (provide full text)
- Ignore implementer questions or BLOCKED status
- Accept spec non-compliance ("close enough" = not done)
- Start quality review before spec review passes
- Skip the re-review loop (reviewer found issues -> fix -> review again)
- Wait for all implementers before starting any reviews
- Write a plan without researching the codebase first

**Always:**
- Research existing patterns before writing the plan
- Include exact file paths and complete code in the plan
- Start LSP at the beginning, stop it when done
- Provide full task text and context to every agent
- Let implementers ask questions before starting
- Shutdown task members before moving to next task
