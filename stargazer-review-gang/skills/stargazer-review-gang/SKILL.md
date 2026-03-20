---
name: stargazer-review-gang
description: >
  Multi-perspective code review for the Stargazer codebase. Spawns a gang of specialized
  reviewer agents in parallel - each focused on a different quality dimension (ZIO patterns,
  security, performance, FDB, Temporal, Laminar, styling, architecture, etc.). Automatically
  detects whether code is frontend (js/), backend (jvm/), or shared, and only spawns relevant
  reviewers. Use this skill whenever the user asks for a thorough code review, says "review my
  changes", "review this PR", "stargazer review gang", or wants multi-angle feedback on their code.
  Also trigger when the user wants to check code quality before pushing or submitting a PR.
---

# Stargazer Review Gang

**Announce at start:** "I'm using the stargazer-review-gang skill to review your code."

## Constraints

1. **NO BUILD COMMANDS.** You and all sub-agents are FORBIDDEN from running `./mill`, `compile`,
   `test`, `checkStyle`, `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or any
   build/lint command.
2. **YOU DO NOT READ DIFFS, SOURCE FILES, OR SUB-AGENT INSTRUCTION FILES.** You get file list
   from `git diff --name-only` and line count from `git diff --stat`. Sub-agents read their own
   instructions, diffs, and files. Do NOT use the Read tool on any `.md` file in this skill.
3. **NO STOP CONDITION FOR PR SIZE.** Handle all PRs regardless of file count or line count.

## Workflow

1. Get changed file list → ask user for context
2. Spawn **routing orchestrator** → get back routing plan (JSON)
3. Spawn **reviewer agents** in parallel based on routing plan
4. **Validate** blocker/suggestion findings
5. **Aggregate** and present report
6. Offer **auto-fix**

---

## Step 1: Get File List and Ask for Context

Run these two commands:
```bash
git diff --name-only HEAD~1
git diff --stat HEAD~1
```

Then present **exactly this prompt** (do NOT add or modify options):

> "Found N files, M lines. Depth: [lite/standard/deep].
>
> 1. **Skip** — start reviewing now
> 2. **Add context** — tell me what these changes are about
>
> Reply 1 or 2 (or type context directly):"

Do NOT add extra options. Do NOT analyze or categorize files before asking.

- **User replies 1:** Proceed to Step 2.
- **User replies 2:** Stop and wait for context. Then proceed.
- **User types context:** Use it and proceed.

### Depth Calculation

| Total changed lines | Depth | Reviewer model |
|---------------------|-------|---------------|
| < 50 | lite | All haiku |
| 50–500 | standard | Roster defaults |
| > 500 | deep | Standard → opus, haiku stays haiku |

---

## Step 2: Spawn Routing Orchestrator

Spawn a **single haiku agent** with this prompt (do NOT read the orchestrator file yourself):

```
You are the routing orchestrator. Read your instructions from:
agents/orchestrator.md (relative to this skill's directory)

Then route these files (base: HEAD~1):

[file paths from git diff --name-only, one per line]
```

That's it. The orchestrator reads its own instructions, reads diffs, and returns JSON.
Do NOT read `agents/orchestrator.md` yourself. Do NOT read any diffs.

**Wait for the orchestrator to complete.** It returns:
```json
{
  "total_files": 12,
  "total_lines": 2982,
  "routing": {"path/to/File.scala": ["1", "2", "3"]},
  "workload": {"1": {"lines": 850}, "2": {"lines": 3200, "split": [...]}}
}
```

---

## Step 3: Spawn Reviewer Agents

> **ROUTING IS FINAL.** Spawn exactly the reviewers the orchestrator assigned — no more, no less.

Using the routing output, determine the **union of all reviewer IDs** across all files.

### Workload Splits

From `workload`:
- **≤2000 lines:** One reviewer agent per ID.
- **>2000 lines with split:** Spawn sub-reviewers (2a, 2b, etc.) with focused scope.
  Prepend: `> FOCUSED REVIEW: You are sub-reviewer {id}. Review ONLY: {focus}`
- **Max 5 sub-reviewers per scope.**

### Model Override by Depth

- `lite`: `model: "haiku"` for all reviewers
- `standard`: use roster defaults
- `deep`: `model: "opus"` for standard reviewers; haiku stays haiku

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

- **Skip if**: only nitpicks, or depth is lite.
- Spawn **haiku validation agents** per file — they read code fresh and return CONFIRMED or FALSE_POSITIVE.
- Drop FALSE_POSITIVE. Keep CONFIRMED. Fail-open on validator errors.

---

## Step 4: Aggregate and Filter

### Sub-Aggregator Scaling

- **≤6 reviewer outputs:** Aggregate directly.
- **>6:** Spawn sub-aggregators (max 6 outputs each). They dedup, filter, drop vague.
  Main agent does final cross-group dedup + re-queries.

### Filters

1. **Deduplicate** same-line findings. Priority: Security > Data loss > Performance > Observability > Code quality > Testing > Style
2. **Drop confidence < 70** (BLOCKER 60-69 → re-query once)
3. **Drop vague** (no line, no fix, not in diff)
4. **Re-query** borderline findings once max per reviewer

### Report

> **MANDATORY:** Every finding MUST include current code + suggested fix as fenced code blocks.

````markdown
# Code Review Report

## Files Reviewed
- file list with platform classification

## Blockers (must fix)
### [BLOCKER] (confidence: N) Title — `file:line`
**Reviewer:** Name
**Issue:** Explanation
**Current code:**
```scala
// code
```
**Suggested fix:**
```scala
// fix
```

## Suggestions (should fix)
Same format as blockers.

## Nitpicks
- **`file:line`** — description. Current: `code` → Fix: `code`

## Summary
- X blockers, Y suggestions, Z nitpicks across N reviewers
````

If 0 blockers and 0 suggestions, keep brief.

---

## Step 5: Auto-Fix

Offer if blockers or suggestions exist:
1. **Fix all**
2. **Fix blockers only**
3. **Skip**

If only nitpicks, do not offer. Apply fixes file-by-file, blockers first.
After fixing, tell user to run `checkStyleDirty` on affected modules.
