---
name: stargazer-review-gang
description: >
  Trigger when user says "stargazer review gang", "review my changes", "review this PR",
  or wants multi-angle feedback before pushing. Spawns a team of specialized reviewer agents
  for the Stargazer codebase.
---

# Stargazer Review Gang

**Capture skill base directory** from "Base directory for this skill:" line above.
Store as `SKILL_DIR` — all file refs below (agents/, reviewers/) relative to it.

**Say exactly:** "Starting the stargazer-review-gang."

**Then immediately go to Step 1.** No diff gather. No file read. Nothing else before Step 1.

## Constraints

1. **NO BUILD COMMANDS.** You + all team members FORBIDDEN from running `./mill`, `compile`,
   `test`, `checkStyle`, `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or any
   build/lint command.
2. **YOU DO NOT READ DIFFS, SOURCE FILES, OR AGENT INSTRUCTION FILES.** No
   `git diff` or `git merge-base`. No Read tool on any `.md` file in this skill.
   Orchestrator determine diff ref from user's review scope.
   **Exception:** MAY run `git log --oneline` and `git status` (short form) in Step 3 for
   branch/history context for orchestrator prompt — but no analysis yourself; pass to orchestrator.
3. **NO STOP CONDITION FOR PR SIZE.** Handle all PRs regardless of file/line count.

## Step 1: Gather Session Context

No ask user for context. Infer from current session:
- Use conversation history to understand user's work
- Note files edited, features built, bugs fixed
- Becomes `user_context` passed to orchestrator + reviewers

## Step 2: Verify Scala Code Intelligence

Invoke `scala-code-intelligence` skill to check IntelliJ-powered MCP tools available.
If not, check for `cellar` CLI (`which cellar`). Build short tool availability note:

- **MCP available:** `"scala-code-intelligence MCP tools available (definition, references, hover, etc.)"`
- **cellar only:** `"cellar CLI available (cellar search/get/list -m <module>). No references/diagnostics."`
- **neither:** `"No Scala intelligence tools. Use grep/glob only."`

Pass note to orchestrator + all reviewers so they know available tools.

---

## Step 3: Spawn Routing Orchestrator

Spawn **single plain agent** (not team member) using exact prompt template below.
Use `model: "sonnet"` — orchestrator interpret scope, determine diff refs, read
all diffs, route files. One-shot job, no persistence needed.

**Pass user's scope verbatim** — no interpret into base/head refs. Orchestrator
determine correct git diff strategy itself. **Add surrounding context** (branch
name, recent commit summaries, file count) to help orchestrator orient quickly, but keep
user's words intact as primary scope.

**Prompt template** (fill bracketed sections):

```
You are a subagent dispatched to execute a specific routing task.
First, invoke the `caveman:caveman` skill via the Skill tool to enable caveman output mode.
After invoking caveman, do NOT invoke any other skills — you are already inside a workflow.

Read your full instructions from: ${SKILL_DIR}/agents/orchestrator.md

Scope: [user's verbatim scope]
Branch context: [branch name, recent commits, file count]
User context: [session context inferred from conversation]
Scala tools: [tool availability note from Step 2]
```

Orchestrator returns JSON routing plan with `diff_ref`, `routing`, `workload`, `depth`.
**Wait for completion before proceeding.**

---

## Step 4: Create Team and Spawn Reviewers

> **ROUTING IS FINAL.** Spawn exactly reviewers orchestrator assigned — no more, no less.

### 4a. Create the Review Team

Use **TeamCreate** for this review session:

```
team_name: "review-gang"
description: "Stargazer code review session"
```

### 4b. Determine Reviewer Set

From routing output, determine **union of all reviewer IDs** across all files.

#### Workload Splits

From `workload`:
- **≤4000 +/-:** One reviewer agent per ID.
- **>4000 +/- with split:** Spawn sub-reviewers (2a, 2b, etc.) with focused scope.
  Prepend: `> FOCUSED REVIEW: You are sub-reviewer {id}. Review ONLY: {focus}`

#### Model Selection — Per-Reviewer Workload

Use each reviewer's **own workload** from orchestrator's `workload` output to pick model.
No applying one model to all reviewers — reviewer with 50 changes shouldn't get opus
just because another reviewer has 3000.

| Reviewer's +/- | Model |
|----------------|-------|
| ≤100 | `model: "haiku"` |
| 101–1500 | roster default |
| >1500 | `model: "opus"` |

### Reviewer Roster (8 groups, single checklist each)

Each group spawned as **single agent** reading exactly **one merged checklist file**.
Related concerns merged into single file per group.

| ID | Group | Checklist | Default Model |
|----|-------|-----------|---------------|
| 1 | Scala Quality | `${SKILL_DIR}/reviewers/01-scala-quality.md` | sonnet |
| 2 | ZIO & Observability | `${SKILL_DIR}/reviewers/02-zio-patterns.md` | sonnet |
| 3 | Architecture | `${SKILL_DIR}/reviewers/03-foundations.md` | haiku |
| 4 | FDB | `${SKILL_DIR}/reviewers/05-fdb-patterns.md` | sonnet |
| 5 | Temporal | `${SKILL_DIR}/reviewers/06-temporal.md` | sonnet |
| 6 | Tapir | `${SKILL_DIR}/reviewers/07-tapir-endpoints.md` | sonnet |
| 7 | Frontend | `${SKILL_DIR}/reviewers/08-frontend.md` | haiku |
| 8 | Testing | `${SKILL_DIR}/reviewers/11-testing.md` | sonnet |

### 4c. Spawn Reviewers as Named Team Members

Name pattern: `reviewer-{ID}` (sub-reviewers: `reviewer-{ID}{letter}`).
Use `team_name: "review-gang"`. Spawn all in **single message** for parallelism.

Each reviewer prompt must start with:
```
You are a subagent dispatched to execute a specific task.
First, invoke the `caveman:caveman` skill via the Skill tool to enable caveman output mode.
After invoking caveman, do NOT invoke any other skills — you are already inside a workflow.
```

Then include:
- `Read your checklist from: [checklist path from roster]`
- Diff ref, assigned file paths, session context, scala tool availability note
- **No build commands** — read only
- **Diff-bound** — only flag changed lines
- Per file: `git diff -U3 <diff_ref> -- <file>`, read full file, blame changed lines
- Checklist files already define output format + triage rules — no override
- After initial review, stay idle for validator re-queries or team lead fix requests

---

## Step 5: Spawn Single Opus Validator

> **EXACTLY ONE VALIDATOR. ALWAYS OPUS.** No batched validators. No final merge step.

After all reviewers complete, spawn **one** validator team member:

- `team_name: "review-gang"`
- `name: "validator"`
- `model: "opus"` — **always opus regardless of workload**

Validator prompt:

```
You are a subagent dispatched to execute a specific task.
First, invoke the `caveman:caveman` skill via the Skill tool to enable caveman output mode.
After invoking caveman, do NOT invoke any other skills — you are already inside a workflow.

Read your instructions from: ${SKILL_DIR}/agents/validator.md
Diff ref: <diff_ref>
Team Members: <list of all reviewer names>
Findings to Validate: <paste all reviewer findings>
```

Validator validates findings against actual code, re-queries reviewers, deduplicates,
filters, produces final report. No additional validators after — its output final.

**Present validator's report to user verbatim.** No rewrite, reformat, summarize,
or strip — including severity emoji indicators (🔴🟡🔵), code blocks, confidence
scores, reviewer attributions. Report = deliverable; pass through.

Applies even when all findings nitpicks — still show full report with code blocks.
Never reduce finding to one-liner like "[NITPICK] description (confidence N)".
Code blocks ARE the report.

---

## Step 6: Auto-Fix

If only nitpicks, skip this step entirely. Else use **AskUserQuestion** tool:

```
question: "Would you like me to auto-fix the findings?"
header: "Auto-fix"
options:
  - label: "Fix all"
    description: "Apply fixes for all blockers and suggestions"
  - label: "Fix blockers only"
    description: "Apply fixes for blockers, skip suggestions"
  - label: "Skip"
    description: "Do not apply any fixes"
```

### Dispatch Fixes to Reviewers

Instead of applying fixes yourself, dispatch to **original reviewers** who flagged
issues. They already have full file context from their review, so fixes more accurate.

Per reviewer with findings to fix, use **SendMessage** to reviewer:

```
to: "reviewer-{ID}"
message: |
  Apply the following fixes to the files you reviewed. Use the Edit tool for each fix.
  After applying all fixes, report what you changed.

  Fixes to apply (blockers first):
  [list the specific findings from the validator report that belong to this reviewer,
   including file:line, issue description, and suggested fix]
summary: "Apply N fixes to reviewed files"
```

Wait for all dispatched reviewers to respond with changes, then tell user to run
`checkStyleDirty` on affected modules.

---

## Step 7: Shutdown Team

After review complete (either after presenting report if user skipped auto-fix, or
after auto-fix applied):

1. Send shutdown requests to all active team members:
   ```
   to: "*"
   message: {"type": "shutdown_request", "reason": "Review complete"}
   ```

2. After all members shut down, use **TeamDelete** to clean up.