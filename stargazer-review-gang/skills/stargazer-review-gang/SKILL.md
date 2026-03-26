---
name: stargazer-review-gang
description: >
  Trigger when user says "stargazer review gang", "review my changes", "review this PR",
  or wants multi-angle feedback before pushing. Spawns a team of specialized reviewer agents
  for the Stargazer codebase.
---

# Stargazer Review Gang

**Say exactly:** "Starting the stargazer-review-gang."

**Then immediately proceed to Step 1.** Do NOT gather diffs. Do NOT read files. Do NOT do
anything else before Step 1.

## Constraints

1. **NO BUILD COMMANDS.** You and all team members are FORBIDDEN from running `./mill`, `compile`,
   `test`, `checkStyle`, `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or any
   build/lint command.
2. **YOU DO NOT READ DIFFS, SOURCE FILES, OR AGENT INSTRUCTION FILES.** Do NOT run
   `git diff` or `git merge-base`. Do NOT use the Read tool on any `.md` file in this skill.
   The orchestrator determines the diff ref itself from the user's review scope.
   **Exception:** You MAY run `git log --oneline` and `git status` (short form) in Step 3 to
   gather branch/history context for the orchestrator prompt — but do NOT analyze the output
   yourself; just pass it to the orchestrator.
3. **NO STOP CONDITION FOR PR SIZE.** Handle all PRs regardless of file count or line count.

## Step 1: Ask for Context

Use the **AskUserQuestion** tool as your first action (do NOT run any git commands or analyze
files before this):

```
question: "I'm about to review your latest changes. Want to add context first?"
header: "Context"
options:
  - label: "Skip"
    description: "Start reviewing now without additional context"
  - label: "Add context"
    description: "Tell me what these changes are about before I start"
```

- **User selects "Skip":** Proceed to Step 2.
- **User selects "Add context":** Stop and wait for their context. Then proceed to Step 2.
- **User selects "Other" and types context:** Use it and proceed to Step 2.

---

## Step 2: Discover Available Tools

Scan `../../.claude-plugin/marketplace.json` for installed plugins with tools (LSP, etc.).
Build a JSON array of relevant tools (`[{"plugin", "tool", "description", "capabilities"}]`).
Set to `[]` if none found — tool availability is optional.

---

## Step 3: Spawn Routing Orchestrator

Spawn a **single plain agent** (not a team member) using the exact prompt template below.
Use `model: "sonnet"` — the orchestrator interprets the scope, determines diff refs, reads
all diffs, and routes files. It is a one-shot job that does not need to persist.

**Pass the user's scope verbatim** — do NOT interpret it into base/head refs. The
orchestrator determines the correct git diff strategy itself. **Add surrounding context** (branch
name, recent commit summaries, number of files) to help the orchestrator orient quickly, but keep
the user's words intact as the primary scope.

**Prompt template** (fill in the bracketed sections):

```
You are a subagent dispatched to execute a specific routing task.
Do NOT invoke the Skill tool or any skills — you are already inside a workflow.

Read your full instructions from: agents/orchestrator.md

Scope: [user's verbatim scope]
Branch context: [branch name, recent commits, file count]
User context: [user-provided context or "none"]
Available tools: [discovered tools JSON]
```

The orchestrator returns a JSON routing plan with `diff_ref`, `routing`, `workload`, and `depth`.
**Wait for completion before proceeding.**

---

## Step 4: Create Team and Spawn Reviewers

> **ROUTING IS FINAL.** Spawn exactly the reviewers the orchestrator assigned — no more, no less.

### 4a. Create the Review Team

Use **TeamCreate** to create a team for this review session:

```
team_name: "review-gang"
description: "Stargazer code review session"
```

### 4b. Determine Reviewer Set

Using the routing output, determine the **union of all reviewer IDs** across all files.

#### Workload Splits

From `workload`:
- **≤4000 +/-:** One reviewer agent per ID.
- **>4000 +/- with split:** Spawn sub-reviewers (2a, 2b, etc.) with focused scope.
  Prepend: `> FOCUSED REVIEW: You are sub-reviewer {id}. Review ONLY: {focus}`

#### Model Selection — Per-Reviewer Workload

Use each reviewer's **own workload** from the orchestrator's `workload` output to pick its model.
Do NOT apply one model to all reviewers — a reviewer with 50 changes shouldn't get opus just
because another reviewer has 3000.

| Reviewer's +/- | Model |
|----------------|-------|
| ≤100 | `model: "haiku"` |
| 101–1500 | roster default |
| >1500 | `model: "opus"` |

### Reviewer Roster

| ID | Reviewer | Checklist | Default Model |
|----|----------|-----------|---------------|
| 1 | Scala Quality | `reviewers/01-scala-quality.md` | standard |
| 2 | ZIO Patterns | `reviewers/02-zio-patterns.md` | standard |
| 3 | Architecture | `reviewers/03-foundations.md` | haiku |
| 5 | FDB Patterns | `reviewers/05-fdb-patterns.md` | standard |
| 6 | Temporal | `reviewers/06-temporal.md` | standard |
| 7 | Tapir | `reviewers/07-tapir-endpoints.md` | standard |
| 8a | Laminar | `reviewers/08-laminar.md` | standard |
| 8b | Frontend Styling | `reviewers/08-frontend.md` | haiku |
| 9 | scalajs-react | `reviewers/09-react.md` | standard |
| 10 | Observability | `reviewers/10-observability.md` | haiku |
| 11 | Testing | `reviewers/11-testing.md` | standard |

### 4c. Spawn Reviewers as Named Team Members

Name pattern: `reviewer-{ID}` (sub-reviewers: `reviewer-{ID}{letter}`).
Use `team_name: "review-gang"`. Spawn all in a **single message** for parallelism.

Each reviewer prompt must start with:
```
You are a subagent dispatched to execute a specific task.
Do NOT invoke the Skill tool or any skills — you are already inside a workflow.
```

Then include:
- `Read your checklist from: [checklist path from roster]`
- Diff ref, assigned file paths, user context, discovered tools JSON
- **No build commands** — read only
- **Diff-bound** — only flag changed lines
- For each file: `git diff -U3 <diff_ref> -- <file>`, read full file, blame changed lines
- Checklist files already define the output format and triage rules — do not override them
- After initial review, stay idle for aggregator re-queries or team lead fix requests

---

## Step 5: Aggregate, Validate, and Filter

Count **all** reviewer agents that responded — including those that reported "Clean — no issues
found" (sub-reviewers like 1a, 1b count separately). Every reviewer response counts as one output.

- **≤4 outputs:** Spawn **one aggregator** as a team member.
- **>4 outputs:** Split into batches of ≤4 and spawn **one aggregator per batch** as team members.
  Group related reviewers together (e.g., FDB + ZIO + Temporal). After all batch aggregators
  complete, spawn **exactly one** final merge aggregator.

**Model selection:**
- **Per-batch aggregators** (`aggregator-1`, `aggregator-2`, etc.): always `model: "sonnet"`
- **Final merge aggregator** (`aggregator-final`): always `model: "haiku"`

Use `team_name: "review-gang"` for all.

### Per-batch aggregator prompt

Each batch aggregator reads and follows `agents/aggregator.md` — it validates findings, re-queries
reviewers, filters, and produces a report.

```
You are a subagent dispatched to execute a specific task.
Do NOT invoke the Skill tool or any skills — you are already inside a workflow.

Read your instructions from: agents/aggregator.md
Diff ref: <diff_ref>
Team Members: <list of reviewer names in this batch>
Findings to Aggregate: <paste findings>
```

### Final merge aggregator prompt

The final merge aggregator does **NOT** read `agents/aggregator.md`. It does **NOT** validate,
re-query, or filter. It only concatenates batch reports and deduplicates across batches.
Spawn **exactly one** — never spawn additional aggregators after this.

```
You are a subagent dispatched to execute a specific task.
Do NOT invoke the Skill tool or any skills — you are already inside a workflow.

You are the final merge aggregator. Your name is "aggregator-final".
Do NOT read agents/aggregator.md — you are NOT a validation aggregator.

Your ONLY job:
1. Concatenate the batch reports below into one report
2. Deduplicate: if the same file:line appears in multiple batches, keep the highest-priority one
3. Preserve all code blocks, emoji indicators, and formatting verbatim
4. Do NOT re-validate, re-query reviewers, or drop any findings

Batch reports:
<paste all batch aggregator reports>
```

**Present the aggregator's report to the user verbatim.** Do NOT rewrite, reformat, summarize,
or strip any part of it — including severity emoji indicators (🔴🟡🔵), code blocks, confidence
scores, and reviewer attributions. The report is the deliverable; your job is to pass it through.

This applies even when all findings are nitpicks — still show the full report with code blocks.
Never reduce a finding to a one-liner summary like "[NITPICK] description (confidence N)".
The code blocks ARE the report.

---

## Step 6: Auto-Fix

If only nitpicks, skip this step entirely. Otherwise, use the **AskUserQuestion** tool:

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

Instead of applying fixes yourself, dispatch them to the **original reviewers** who flagged the
issues. They already have full file context from their review, making their fixes more accurate.

For each reviewer that has findings to fix, use **SendMessage** to the reviewer:

```
to: "reviewer-{ID}"
message: |
  Apply the following fixes to the files you reviewed. Use the Edit tool for each fix.
  After applying all fixes, report what you changed.

  Fixes to apply (blockers first):
  [list the specific findings from the aggregator report that belong to this reviewer,
   including file:line, issue description, and suggested fix]
summary: "Apply N fixes to reviewed files"
```

Wait for all dispatched reviewers to respond with their changes, then tell the user to run
`checkStyleDirty` on affected modules.

---

## Step 7: Shutdown Team

After the review is complete (either after presenting the report if user skipped auto-fix, or
after auto-fix is applied):

1. Send shutdown requests to all active team members:
   ```
   to: "*"
   message: {"type": "shutdown_request", "reason": "Review complete"}
   ```

2. After all members have shut down, use **TeamDelete** to clean up.
