---
name: stargazer-review-gang
description: >
  Trigger when user says "stargazer review gang", "review my changes", "review this PR",
  or wants multi-angle feedback before pushing. Spawns specialized sub-agents for the
  Stargazer codebase.
---

# Stargazer Review Gang

**Say exactly:** "Starting the stargazer-review-gang."

**Then immediately proceed to Step 1.** Do NOT gather diffs. Do NOT read files. Do NOT do
anything else before Step 1.

## Constraints

1. **NO BUILD COMMANDS.** You and all sub-agents are FORBIDDEN from running `./mill`, `compile`,
   `test`, `checkStyle`, `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or any
   build/lint command.
2. **YOU DO NOT READ DIFFS, SOURCE FILES, OR SUB-AGENT INSTRUCTION FILES.** Do NOT run any
   `git diff` commands. Do NOT use the Read tool on any `.md` file in this skill. The orchestrator
   and reviewers read everything they need themselves.
3. **NO STOP CONDITION FOR PR SIZE.** Handle all PRs regardless of file count or line count.

## Workflow

1. Ask user for context
2. Spawn **routing orchestrator** → get back file list, depth, and routing plan (JSON)
3. Spawn **reviewer agents** in parallel based on routing plan
4. **Validate** blocker/suggestion findings
5. **Aggregate** and present report
6. Offer **auto-fix**

---

## Step 1: Ask for Context

Present **exactly this prompt** as your first action (do NOT add or modify options):

> "I'm about to review your latest changes. Want to add context first?
>
> 1. **Skip** — start reviewing now
> 2. **Add context** — tell me what these changes are about
>
> Reply 1 or 2 (or type context directly):"

Do NOT run any git commands. Do NOT analyze files before asking.

- **User replies 1:** Proceed to Step 2.
- **User replies 2:** Stop and wait for context. Then proceed.
- **User types context:** Use it and proceed.

---

## Step 2: Spawn Routing Orchestrator

Spawn a **single agent** with this prompt (do NOT read the orchestrator file yourself).
Use `model: "sonnet"` — the orchestrator reads all diffs and needs reliable pattern matching.

```
You are the routing orchestrator. Read your instructions from:
agents/orchestrator.md (relative to this skill's directory)

Then route the changes (base: HEAD~1).
```

The orchestrator finds changed files, reads diffs, routes, and returns JSON:

```json
{
  "total_files": 12,
  "total_changes": 2982,
  "depth": "heavy",
  "routing": {"path/to/File.scala": ["1", "2", "3"]},
  "workload": {"1": {"changes": 850}, "2": {"changes": 3200, "split": [...]}}
}
```

**Wait for the orchestrator to complete before proceeding.**

---

## Step 3: Spawn Reviewer Agents

> **ROUTING IS FINAL.** Spawn exactly the reviewers the orchestrator assigned — no more, no less.

Using the routing output, determine the **union of all reviewer IDs** across all files.

### Workload Splits

From `workload`:
- **≤2000 +/-:** One reviewer agent per ID.
- **>2000 +/- with split:** Spawn sub-reviewers (2a, 2b, etc.) with focused scope.
  Prepend: `> FOCUSED REVIEW: You are sub-reviewer {id}. Review ONLY: {focus}`

### Model Override by Depth

- `lite`: `model: "haiku"` for all reviewers
- `medium`: use roster defaults
- `heavy`: `model: "opus"` for standard reviewers; haiku stays haiku

### Reviewer Roster

| ID | Reviewer | Checklist | Default Model |
|----|----------|-----------|---------------|
| 1 | Scala Quality | `reviewers/01-scala-quality.md` | standard |
| 2 | ZIO Patterns | `reviewers/02-zio-patterns.md` | standard |
| 3 | Architecture | `reviewers/03-foundations.md` | haiku |
| 5 | FDB Patterns | `reviewers/05-fdb-patterns.md` | standard |
| 6 | Temporal | `reviewers/06-temporal.md` | standard |
| 7 | Tapir | `reviewers/07-tapir-endpoints.md` | standard |
| 8 | Frontend | `reviewers/08-frontend.md` | standard |
| 9 | scalajs-react | `reviewers/11-react.md` | standard |
| 10 | Observability | `reviewers/12-observability.md` | haiku |
| 11 | Testing | `reviewers/13-testing.md` | standard |

### Reviewer Prompt Template

For each reviewer, spawn an agent with this prompt (do NOT read checklist files yourself):

```
Read your checklist from: [checklist file path from roster table]

---

## Review Rules

1. **Diff-bound**: Only flag issues on changed lines. Pre-existing issues → [NOTE] only.
2. **FORBIDDEN**: No ./mill, compile, test, checkStyle, or any build command. Read only.
3. **Triage**: [BLOCKER] (must fix) / [SUGGESTION] (should fix) / [NITPICK] (nice to have)
4. **Confidence 0–100**: 90+ certain, 70-89 strong signal, 50-69 suspicious, <50 don't report.
5. **False positives**: Skip pre-existing, intentional (same author), compiler-caught, pedantic.
6. **Every finding MUST include**: file:line, confidence, current code block, suggested fix block.
7. Clean → report "Clean — no issues found."

## Change Context
[user context if provided, otherwise omit]

## Your Files
[file paths assigned to this reviewer]

## Gather Your Own Context
For each file above:
1. Get diff: git diff -U3 <base> -- <file>
2. Read full file (Read tool)
3. Blame changed lines: git blame -L <start>,<end> HEAD -- <file>
4. Recent history: git log --oneline -3 -- <file>
Then review ONLY changed lines.
```

Spawn all reviewers in a **single message** for maximum parallelism.

---

## Step 3.5: Validate Findings

After all reviewers complete, validate BLOCKER and SUGGESTION findings to eliminate false positives.

- **Skip if**: only nitpicks, or depth is `lite`.
- Spawn **haiku validation agents** per file — they read code fresh and return CONFIRMED or FALSE_POSITIVE.
- Drop FALSE_POSITIVE. Keep CONFIRMED. Fail-open on validator errors.

---

## Step 4: Aggregate and Filter

Count reviewer agents that returned findings (sub-reviewers like 1a, 1b count separately).

- **≤6 outputs:** Spawn **one aggregator agent**.
- **>6 outputs:** Split into batches of ≤6 and spawn **one aggregator per batch**. Group related
  reviewers together (e.g., FDB + ZIO + Temporal). After all aggregators complete, spawn one
  **final aggregator** to merge their reports and do a cross-group dedup pass.

For each aggregator, spawn an agent with this prompt (do NOT read the aggregator file yourself):

```
Read your instructions from: agents/aggregator.md (relative to this skill's directory)

## Findings to Aggregate
[paste all findings from the assigned reviewer batch]
```

The aggregator returns the final report. Present it to the user as-is.

---

## Step 5: Auto-Fix

Offer if blockers or suggestions exist:
1. **Fix all**
2. **Fix blockers only**
3. **Skip**

If only nitpicks, do not offer. Apply fixes file-by-file, blockers first.
After fixing, tell user to run `checkStyleDirty` on affected modules.
