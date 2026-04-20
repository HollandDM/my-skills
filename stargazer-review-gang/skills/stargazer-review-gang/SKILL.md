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

**Proceed immediately to Step 1.** Do NOT gather diffs. Do NOT read files. Do NOT do anything else before Step 1.

## Constraints

1. **NO BUILD COMMANDS.** You and all team members FORBIDDEN from running `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or any build/lint command.
2. **DO NOT READ DIFFS, SOURCE FILES, OR AGENT INSTRUCTION FILES.** Do NOT run `git diff` or `git merge-base`. Do NOT use Read tool on any `.md` file in this skill. Orchestrator determines diff ref itself from user's review scope.
   **Exception:** MAY run `git log --oneline` and `git status` (short form) in Step 3 for branch/history context — do NOT analyze output yourself; pass it to orchestrator.
3. **NO STOP CONDITION FOR PR SIZE.** Handle all PRs regardless of file count or line count.

## Step 1: Gather Session Context

Do NOT ask user for context. Infer from current session:
- Use conversation history to understand what user has been working on
- Note files edited, features built, or bugs fixed
- Becomes `user_context` passed to orchestrator and reviewers

## Step 2: Verify Scala Code Intelligence

Invoke `scala-code-intelligence` skill to check if IntelliJ-powered MCP tools available.
If not, check for `cellar` CLI (`which cellar`). Build short tool availability note:

- **MCP available:** `"scala-code-intelligence MCP tools available (definition, references, hover, etc.)"`
- **cellar only:** `"cellar CLI available (cellar search/get/list -m <module>). No references/diagnostics."`
- **neither:** `"No Scala intelligence tools. Use grep/glob only."`

Pass note to orchestrator and all reviewers.

---

## Step 3: Spawn Routing Orchestrator

Spawn **single plain agent** (not team member) using exact prompt template below.
Use `model: "sonnet"` — orchestrator interprets scope, determines diff refs, reads all diffs, routes files. One-shot job, no persistence needed.

**Pass user's scope verbatim** — do NOT interpret into base/head refs. Orchestrator determines correct git diff strategy. **Add surrounding context** (branch name, recent commit summaries, file count) to orient orchestrator quickly, but keep user's words intact as primary scope.

**Prompt template** (fill bracketed sections):

```
You are a subagent dispatched to execute a specific routing task.
Do NOT invoke the Skill tool or any skills — you are already inside a workflow.

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

### 4a. Create Review Team

Use **TeamCreate**:

```
team_name: "review-gang"
description: "Stargazer code review session"
```

### 4b. Determine Reviewer Set

From routing output, determine **union of all reviewer group IDs** (A/B/C/D) across all files.

#### Workload Splits

From `workload`:
- **≤4000 +/-:** One reviewer agent per group ID (A/B/C/D).
- **>4000 +/- with split:** Spawn sub-reviewers (Aa, Ab, etc.) with focused scope.
  Prepend: `> FOCUSED REVIEW: You are sub-reviewer {id}. Review ONLY the following checklist sections: {focus}`
  Split across group's checklists — assign whole checklist files to each sub-reviewer.

#### Model Selection — Per-Reviewer Workload

Use each reviewer's **own workload** from orchestrator's `workload` output to pick model.
Reviewer D (Frontend) always `haiku` regardless of workload.

| Reviewer's +/- | Model |
|----------------|-------|
| ≤100 | `model: "haiku"` |
| 101–3000 | roster default |
| >3000 | `model: "opus"` |

### Reviewer Roster

Each reviewer covers multiple checklists. **Spawn at most 4 reviewers total.**
Each agent reads all assigned checklists and applies all checks.

| ID | Reviewer | Checklists (read all) | Default Model |
|----|----------|-----------------------|---------------|
| A | Scala Core | `${SKILL_DIR}/reviewers/01-scala-quality.md`, `${SKILL_DIR}/reviewers/02-zio-patterns.md`, `${SKILL_DIR}/reviewers/03-foundations.md`, `${SKILL_DIR}/reviewers/04-code-health.md` | sonnet |
| B | Backend Domain | `${SKILL_DIR}/reviewers/05-fdb-patterns.md`, `${SKILL_DIR}/reviewers/06-temporal.md`, `${SKILL_DIR}/reviewers/10-observability.md` | sonnet |
| C | API & Tests | `${SKILL_DIR}/reviewers/07-tapir-endpoints.md`, `${SKILL_DIR}/reviewers/11-testing.md` | sonnet |
| D | Frontend | `${SKILL_DIR}/reviewers/08-laminar.md`, `${SKILL_DIR}/reviewers/08-frontend.md`, `${SKILL_DIR}/reviewers/09-react.md` | haiku |

### 4c. Spawn Reviewers as Named Team Members

Name pattern: `reviewer-{ID}` (sub-reviewers: `reviewer-{ID}{letter}`).
Use `team_name: "review-gang"`. Spawn all in **single message** for parallelism.

Each reviewer prompt must start with:
```
You are a subagent dispatched to execute a specific task.
Do NOT invoke the Skill tool or any skills — you are already inside a workflow.
```

Then include:
- `Read your checklists from: [all checklist paths for this group, in order]`
- `Apply ALL checklists to the assigned files. Skip any checklist that declares its scope doesn't match (e.g., FDB checklist when no FDB code is present).`
- Diff ref, assigned file paths, session context, scala tool availability note
- **No build commands** — read only
- **Diff-bound** — only flag changed lines
- For each file: `git diff -U3 <diff_ref> -- <file>`, read full file, blame changed lines
- Checklist files define output format and triage rules — do not override them
- After initial review, stay idle for team lead fix requests

---

## Step 5: Aggregate, Validate, and Filter

Collect all reviewer outputs. **You (team lead) are aggregator — do NOT spawn aggregator agents.**

Reviewers are still active team members — message them directly for clarification. They have full file context.

### 5a. Validate Findings

For every finding (BLOCKER, SUGGESTION, NITPICK): confirm it has both **Current code** and **Suggested fix** code blocks. If missing, message reviewer to provide before proceeding.

For every BLOCKER/SUGGESTION, verify against actual source:

1. **Read file** at cited line via Read tool
2. **Check diff** — confirm flagged line added/modified: `git diff -U0 <diff_ref> -- <file>`
3. **Verdict**: CONFIRMED, FALSE_POSITIVE, or NEEDS_CLARIFICATION

Rules:
- **FALSE_POSITIVE**: line doesn't exist, wasn't changed in diff, issue already handled by surrounding code, reviewer misread logic
- **CONFIRMED**: issue real + flagged line changed in diff
- **NEEDS_CLARIFICATION**: can see code but unsure if valid, fix incomplete, description ambiguous
- **Fail-open**: can't read file → treat as CONFIRMED
- **Skip diff validation** for NITPICKs — pass through, but reject if lacking code blocks

Drop FALSE_POSITIVEs. Keep CONFIRMEDs. NEEDS_CLARIFICATION → 5b.

### 5b. Clarify with Reviewers

Message reviewers for:

| Situation | What to ask |
|-----------|------------|
| **Ambiguous finding** | "I see `<code>` at file:line. Actually a problem? Surrounding code suggests `<observation>`." |
| **Fix vague or missing** | "Finding at file:line lacks concrete fix. What code change?" |
| **Fix looks wrong** | "Fix at file:line would `<problem>`. Revise?" |
| **Borderline confidence (50-59)** | "Finding at confidence N. Strengthen with detail or concrete fix?" |
| **Contradiction between reviewers** | Ask both: "Reviewer-X flagged file:line as `<issue>` but you flagged differently. Take?" |
| **Uncertain false positive** | "Think false positive because `<reason>`. Wrong?" |

Batch questions per reviewer into one message. Wait for response before finalizing.

```
to: "reviewer-{ID}"
message: |
  Validating findings — questions:

  1. **file:line** — [question]
  2. **file:line** — [question]

  For each: clarify with detail / revised fix, or confirm to drop.
summary: "Clarify N findings from review"
```

Reviewer clarifies → update finding. Confirms drop → drop.

### 5c. Deduplicate

Same `file:line` flagged by multiple reviewers → keep highest-priority, cross-reference: "Also flagged by: [reviewer] — [reason]"

Priority (highest wins):
1. Security (7 Tapir) — auth bypass, data leaks
2. Data loss / correctness (5 FDB, 6 Temporal, 2 ZIO) — silent failures, corruption
3. Performance (2 ZIO, 5 FDB) — thread starvation, OOM, timeout
4. Observability (10) — secrets in logs, silent errors, missing tracing
5. Code quality / patterns (1 Scala, 2 ZIO, 4 Code Health, 8 Frontend) — idiom violations, memory leaks
6. Testing (11) — flaky tests, missing assertions
7. Style / formatting (3 Architecture) — mechanical checks

### 5d. Final Filter

Reassess confidence scores — adjust up or down. Then:

1. **Drop confidence < 50** — noise.
2. **Retain everything >= 50** — keep every non-duplicate >= 50. Cannot drop, downgrade, or omit for being minor, borderline, or stylistic.
3. **Drop duplicates** — per 5c rules.
4. **Request missing code blocks** — finding >= 50 missing Current code / Suggested fix → message reviewer. Do NOT drop for vague — fix it.

### 5e. Present Report

**Preserve reviewer code blocks verbatim.** Copy Current code and Suggested fix exactly. Do NOT rewrite, summarize, shorten, or paraphrase.

Never reduce finding to one-liner. Code blocks ARE the report.

````markdown
# Code Review Report

## Files Reviewed
- file list with platform classification

## 🔴 Blockers (must fix)

### 🔴 [BLOCKER] (confidence: N) Title — `file:line`
**Reviewer:** Name
**Issue:** What's wrong and why it matters
**Current code:**
```scala
// actual code at flagged location (3-5 lines context)
```
**Suggested fix:**
```scala
// concrete replacement, copy-paste ready
```
Also flagged by: [reviewer] — [reason] *(only if deduplicated)*

## 🟡 Suggestions (should fix)

### 🟡 [SUGGESTION] (confidence: N) Title — `file:line`
**Reviewer:** Name
**Issue:** ...
**Current code:** ...
**Suggested fix:** ...

## 🔵 Nitpicks

### 🔵 [NITPICK] Title — `file:line`
**Reviewer:** Name
**Issue:** Brief explanation
**Current code:** ...
**Suggested fix:** ...

## Summary
- X blockers, Y suggestions, Z nitpicks across N reviewers
- Validated: X confirmed, Y false positives dropped
- Clarified with reviewers: X findings queried, Y strengthened, Z dropped
````

0 blockers + 0 suggestions + few nitpicks → shorter report OK, but still show code blocks per nitpick.

---

## Step 6: Auto-Fix

Only nitpicks → skip entirely. Otherwise use **AskUserQuestion** tool:

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

Dispatch to **original reviewers** who flagged issues — they have full file context, fixes more accurate.

For each reviewer with findings to fix, use **SendMessage**:

```
to: "reviewer-{ID}"
message: |
  Apply the following fixes to the files you reviewed. Use the Edit tool for each fix.
  After applying all fixes, report what you changed.

  Fixes to apply (blockers first):
  [list the specific findings from the merged report that belong to this reviewer,
   including file:line, issue description, and suggested fix]
summary: "Apply N fixes to reviewed files"
```

Wait for all dispatched reviewers to respond, then tell user to run `checkStyleDirty` on affected modules.

---

## Step 7: Shutdown Team

After review complete (after report if user skipped auto-fix, or after auto-fix applied):

1. Send shutdown requests to all active team members:
   ```
   to: "*"
   message: {"type": "shutdown_request", "reason": "Review complete"}
   ```

2. After all members shut down, use **TeamDelete** to clean up.