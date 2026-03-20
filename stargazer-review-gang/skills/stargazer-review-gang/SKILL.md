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

> **CRITICAL CONSTRAINT — READ-ONLY REVIEW**
> You and ALL reviewer agents are FORBIDDEN from running `./mill`, `mill`, `compile`, `test`,
> `checkStyle`, `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or ANY build/lint/compile
> command. This applies to the Bash tool — do NOT use it for compilation or linting. Reviewers
> analyze code **by reading files only**. Violation of this rule wastes significant time and resources.

> **CRITICAL CONSTRAINT — ROUTER IS MANDATORY FOR DEEP REVIEWS**
> For `deep` (>500 lines) reviews, you MUST spawn the router agent (Step 2). Do NOT skip the
> router and assign reviewers yourself. The router reads every diff for content-aware classification
> — you cannot replicate this by glancing at file paths on large PRs. For `lite` and `standard`
> reviews, you MAY route files yourself if the change is small enough to classify at a glance.

**Announce at start:** "I'm using the stargazer-review-gang skill to review your code."

You are orchestrating a **gang of specialized code reviewers** for the Stargazer codebase. Each
reviewer is an agent that focuses on one quality dimension. Your job is to:

1. Gather diffs and ask user for change intent
2. Determine review depth (lite/standard/deep) and spawn the **router agent**
3. Spawn the right **reviewer agents** in parallel based on the router's output
4. **Validate** blocker/suggestion findings with independent haiku agents
5. Aggregate, deduplicate, and filter into one actionable report
6. Offer to **auto-fix** blockers and suggestions

---

## Step 1: Identify the Code and Gather Context

### Get the diff

Determine what changed. In order of preference:

- If the user specified files, use those
- If the user said "my changes" or "this PR", get the diff:
  ```bash
  git diff --name-only HEAD~1   # last commit
  git diff --name-only          # unstaged changes
  git diff --name-only --cached # staged changes
  ```
- If unclear, ask the user

### Stay lightweight — delegate reads to sub-agents

The main agent only needs the **list of changed file paths** and the **total changed line count**
(for determining review depth). Do NOT run `git diff -U3`, `git diff -p`, or any command that
outputs diff content. You do not need diffs — sub-agents read them.

1. **Get changed file paths**: `git diff --name-only HEAD~1` (or unstaged/staged as appropriate)
2. **Get total changed line count**: `git diff --stat HEAD~1` (for depth calculation)

**Stop. That is all you read.** The router, reviewers, and validators each gather their own diffs,
full files, and git blame in parallel. Do NOT read diffs "to pass to the router" — the router runs
`git diff` itself.

### The Diff-Bound Rule

Instruct every reviewer: **only flag issues on lines that were added or modified in the diff.**
Do not critique pre-existing code that the author didn't touch. If a pre-existing pattern is
genuinely dangerous (security hole, data loss risk), mention it as a `[NOTE]` but not as a blocker.

### The No-Compile Rule (MANDATORY)

**Reviewers must NEVER run build commands.** This includes but is not limited to: `./mill compile`,
`./mill checkStyle`, `./mill checkStyleDirty`, `./mill reformat`, `./mill checkUnused`,
`./mill WarnUnusedCode`, `./mill test`, or **any** `./mill` command whatsoever. Do NOT use the Bash
tool for any compilation, linting, formatting, or style-checking purpose.

Compilation and linting are the programmer's responsibility and are always done before review.
Reviewers analyze code **by reading files only** — no compilation, no execution, no build tools.

If a reviewer is **unsure** whether something compiles or is correct, it should report the finding
as a `[NITPICK]`, not a `[BLOCKER]` or `[SUGGESTION]`. Uncertainty is not grounds for blocking.

### Ask for Change Context

Before proceeding, **ask the user** for optional context about the changes:

> "I found N changed files. Want to add context before I review?
>
> 1. **Skip** — start reviewing now
> 2. **Add context** — tell me what these changes are about (e.g., refactor, bugfix, new feature)
>
> Reply 1 or 2 (or just type your context directly):"

- **User replies 1 or skips:** Proceed immediately without context.
- **User replies 2:** **Stop and wait.** Do NOT proceed until the user provides their context in a
  follow-up message. Once received, continue from Step 2.
- **User types context directly:** Use it and proceed.

Include user-provided context in every reviewer's prompt as a `## Change Context` section (see Step 3)
— helps reviewers skip false flags on refactors, focus on correctness for bugfixes, and understand
domain intent.

### Stop Conditions

**Stop and ask the user** instead of proceeding when:
- **Too many files (>20)** — ask which files to prioritize, or whether to review all
- **No diff found** — no unstaged, staged, or committed changes to review
- **Unclear scope** — user said "review my changes" but there are changes across unrelated branches
- **Non-Scala files only** — if all changed files are config, docs, or non-code, skip the gang and
  review manually (the reviewers are Scala-specific)

### Determine Review Depth

After gathering diffs, count **total changed lines** (additions + deletions across all files).
This determines the **depth level**, which controls the model strength for each reviewer:

| Total changed lines | Depth | Reviewer model override | Rationale |
|---------------------|-------|------------------------|-----------|
| **< 50 lines** | `lite` | All reviewers use **haiku** (including those normally on standard) | Small change — a fast pass catches obvious issues without burning tokens on deep analysis |
| **50–500 lines** | `standard` | Use each reviewer's **default model** from the roster table | Normal review — balanced cost vs thoroughness |
| **> 500 lines** | `deep` | All standard reviewers upgrade to **opus** | Large/complex change — worth the extra cost for deeper reasoning and fewer false negatives |

When spawning reviewer agents in Step 3, use the `model` parameter on the Agent tool to override:
- `lite` depth: `model: "haiku"` for every reviewer
- `standard` depth: omit model override (use roster defaults)
- `deep` depth: `model: "opus"` for reviewers that are normally `standard`; haiku reviewers stay haiku

**Announce the depth:** After Step 1, tell the user: *"Found N changed files (M lines). Review depth: [lite/standard/deep]."*

---

## Step 2: Route Files to Reviewers

> **MANDATORY for deep depth (>500 lines):** You MUST spawn the router agent for `deep` reviews.
> Do NOT route files yourself — large PRs require content-aware routing across every diff, which
> the main agent must not shortcut. Skipping the router on large PRs leads to wrong reviewer
> assignments and wasted work.
>
> For `lite` and `standard` reviews, you MAY route files yourself without spawning the router,
> since the change is small enough to classify at a glance.

Spawn the **router agent** (haiku model) to decide which reviewers each file needs. The router
reads diffs itself — do NOT read or pass diffs to it. Only pass the file paths.

Read `reviewers/00-router.md` for the router's full instructions. Spawn a **single haiku agent**
with this prompt:

```
[Full contents of reviewers/00-router.md]

---

## Files to Route

[List of changed file paths ONLY — one per line. Do NOT include diffs here. The router runs
git diff on each file itself.]
```

The router returns a JSON object with `routing` (file → reviewer IDs) and `workload` (reviewer ID →
line count + optional split info):

```json
{
  "routing": {
    "path/to/Service.scala": ["1", "2", "3", "5"],
    "path/to/Page.scala": ["1", "3", "8"]
  },
  "workload": {
    "1": {"lines": 850},
    "2": {"lines": 3200, "split": [
      {"id": "2a", "focus": "Sections 1-9: Error handling, resources, parallelism, state, composition, fibers, caching, rate limiting, ZIOUtils"},
      {"id": "2b", "focus": "Sections 10-18: Layer & runtime, endpoint errors, chunking, collections, parallel streams, backpressure, retry, resource-safe, construction"}
    ]},
    "3": {"lines": 900}
  }
}
```

**Wait for the router to complete before proceeding to Step 3.**

---

## Step 3: Spawn Reviewer Agents

> **ROUTER DECISIONS ARE FINAL.** Spawn exactly the reviewers the router assigned — no more, no less.
> Do NOT add reviewers you think are relevant. Do NOT skip reviewers the router included. The router
> made content-aware decisions by reading every diff. Trust its output. If you bypassed the router
> (lite/standard depth), your own routing decisions are final — same rule applies, don't second-guess.

Using the router's output, determine the **union of all reviewer IDs** across all files.

### Handling Workload Splits

Check the `workload` object from the router. For each reviewer:

- **No split** (≤2000 lines): Spawn **one** reviewer agent that reviews all files assigned to it.
- **Split present** (>2000 lines): Spawn **multiple sub-reviewer agents** (e.g., `2a`, `2b`, `2c`),
  each getting the **same files** but with an additional instruction to focus only on specific sections
  of the checklist. The router provides the `focus` field for each sub-reviewer.
  Scale: ~2000–3000 lines per sub-reviewer, **maximum 5 sub-reviewers per scope**.

When spawning a split sub-reviewer, prepend this to the reviewer's checklist in the prompt:

```
> **FOCUSED REVIEW:** You are sub-reviewer {id}. Review ONLY the following sections from your
> checklist: {focus}. Skip all other sections — another sub-reviewer handles them.
```

Each sub-reviewer runs as a fully independent agent with the same files and diff. They gather their
own full file contents and blame context (same as regular reviewers). The only difference is the
narrowed checklist scope.

Each reviewer has a dedicated checklist in the `reviewers/` directory relative to this skill.

### Reviewer Roster

| ID | Reviewer | Checklist file | Model | Focus |
|----|----------|---------------|-------|-------|
| 1 | Scala Quality | `reviewers/01-scala-quality.md` | standard | Banned syntax, Scala 3 idioms, type design, opaque types, given/using, performance patterns |
| 2 | ZIO Patterns, Perf & Streams | `reviewers/02-zio-patterns.md` | standard | Effects, error handling, retry, resources, parallelism, fibers, caching, ZStream chunking/backpressure |
| 3 | Architecture & Serialization | `reviewers/03-foundations.md` | **haiku** | Module deps, layer violations, code placement, custom codec detection, runtime-breaking codec issues |
| 5 | FDB Patterns & Performance | `reviewers/05-fdb-patterns.md` | standard | Store providers, operations, RecordIO, N+1 queries, unbounded scans, tx splitting, timeout risks |
| 6 | Temporal Workflows | `reviewers/06-temporal.md` | standard | Activity attributes, CDC, async endpoints, batch actions, pattern selection |
| 7 | Tapir Endpoints | `reviewers/07-tapir-endpoints.md` | standard | Server auth/security, client error handling, loading state, base class bypass |
| 8 | Frontend | `reviewers/08-frontend.md` | standard | Laminar/Airstream reactivity, split operators, memory leaks, Tailwind DSL, design system components |
| 9 | scalajs-react | `reviewers/11-react.md` | standard | Legacy framework flagging, Callback correctness, React-Laminar bridge, lifecycle cleanup |
| 10 | Observability & Logging | `reviewers/12-observability.md` | **haiku** | Structured logging, metrics, tracing, sensitive data, action logging |
| 11 | Testing Quality | `reviewers/13-testing.md` | standard | Assertions, test isolation, cleanup, flakiness, shared state, negative tests |

### How to Spawn Each Reviewer

For each reviewer ID present in the router's output, collect all files assigned to that reviewer.
Read the reviewer's checklist file, then spawn an agent with this prompt structure:

```
[Contents of the reviewer's checklist file]

---

## Review Rules

1. **Diff-bound**: Only flag issues on lines added or modified in the diff below. Do NOT critique
   pre-existing code the author didn't touch. If pre-existing code has a genuine safety issue,
   mention it as a [NOTE] only.

2. **FORBIDDEN — No compiling or running tools**: Do NOT run `./mill`, `compile`, `test`, `checkStyle`,
   `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or ANY build/lint/compile command.
   Do NOT use the Bash tool for compilation or linting. Analyze code by reading files only. If you are
   unsure whether something is correct, report it as a [NITPICK], not a [BLOCKER].

3. **Triage every finding** into exactly one category:
   - `[BLOCKER]` — Must fix before merge. Security holes, data loss, crash bugs, broken contracts.
   - `[SUGGESTION]` — Should fix. Pattern violations, missing error handling, performance issues.
   - `[NITPICK]` — Nice to have. Style, naming, minor convention deviations.

4. **Score confidence 0–100 for every finding.** Ask yourself: how sure am I this is a real bug
   and not a false positive?
   - **90–100**: You see the exact broken pattern in the diff. No ambiguity.
   - **70–89**: Strong signal but you can't see the full picture (e.g., missing callers, unclear intent).
   - **50–69**: Suspicious but could be intentional. You'd want to ask the author.
   - **< 50**: Gut feeling only. Do not report.

   Use git blame context to calibrate: if the same author wrote it 2 days ago, lower your
   confidence that it's unintentional. If untouched code from 2 years ago is now being modified,
   raise your confidence that context may be misunderstood.

   Format: `[BLOCKER] (confidence: 85) Brief title — file:line`

5. **Do NOT report these — they are false positives:**
   - Pre-existing issues not introduced in this diff (use `[NOTE]` only if dangerous)
   - Code that looks wrong but is intentional (check git blame — same author, recent commit = deliberate)
   - Issues that scalafix, scalafmt, or the compiler will already catch
   - Pedantic style preferences not explicitly in your checklist
   - Issues that require context outside the diff + full file to validate
   - Code with `// scalafix:off` suppression comments that includes an explanation

6. **Every finding MUST include**: file path, line number, confidence score, what's wrong,
   a fenced code block showing the **current code**, and a fenced code block showing the **suggested fix**.
   If you cannot provide a specific fix with code, do not report the finding.

7. If you find nothing wrong, report: "Clean — no issues found."

---

## Change Context

[If the user provided context, include it here. Otherwise omit this section entirely.]

---

## Your Files

[List of file paths assigned to this reviewer]

## Instructions: Gather Your Own Context

For each file listed above, you MUST gather context yourself before reviewing:
1. **Get the diff**: `git diff -U3 HEAD~1 -- <file>`
2. **Read the full file** with line numbers (use the Read tool)
3. **Get git blame on changed lines**: `git blame -L <start>,<end> HEAD -- <file>` for each hunk
4. **Get recent file history**: `git log --oneline -3 -- <file>`

Use blame to calibrate confidence: same author + recent commit = likely intentional. Old untouched
code being modified = higher risk of misunderstanding context.

Then review ONLY the changed lines from the diff.
```

Spawn all applicable reviewers in a single message to maximize parallelism.

### Progress Updates

Keep the user informed as the review progresses:

1. After Step 1: **"Found N changed files (M lines). Review depth: [lite/standard/deep]. Sending to router..."**
2. After Step 2: **"Router assigned N reviewers. Spawning: [list of reviewer names]..."**
3. As reviewers complete: **"N/M reviewers done."** (update at natural milestones, not every single one)
4. After all complete: **"All reviewers done. Aggregating findings..."**

---

## Step 3.5: Validate Findings

After all reviewers complete, validate `[BLOCKER]` and `[SUGGESTION]` findings to eliminate
false positives. Nitpicks skip validation — they're informational and not worth the cost.

### How Validation Works

1. **Collect** all `[BLOCKER]` and `[SUGGESTION]` findings from all reviewers.
2. **Group** findings by file (so each validator reads a file once).
3. **Spawn haiku validation agents** in parallel — one per file that has findings.
4. Each validator independently checks every finding against the actual code.
5. Findings that fail validation are dropped before the report.

### Validator Prompt

For each file with findings, spawn a **haiku** agent with:

```
You are a code review validator. Verify whether each finding is real by reading the code fresh.

## Findings to Validate
[For each: ID, Severity (confidence), Reviewer, Claim, Line, Suggested fix]

## The Code
[unified diff for this file, change context if any]

Read the full file contents and run git blame yourself to verify each claim.

## Instructions
For EACH finding, return CONFIRMED or FALSE_POSITIVE. False positive categories:
- Pre-existing (not introduced in this diff)
- Intentional (git blame: same author, recent commit)
- Compiler/linter already catches it
- Requires context outside provided code
- Style preference, not correctness
- Has suppression comment with explanation

Return JSON: [{"id": 1, "verdict": "CONFIRMED"}, {"id": 2, "verdict": "FALSE_POSITIVE", "reason": "..."}]
```

### After Validation

- **Drop all `FALSE_POSITIVE` findings** — they don't appear in the report.
- **Keep all `CONFIRMED` findings** — proceed to Step 4.
- If a validator fails to return valid JSON or doesn't cover all findings, **keep those findings**
  (fail-open — better to show a potential false positive than hide a real bug).

### When to Skip Validation

Skip the validation step entirely when:
- There are 0 `[BLOCKER]` and 0 `[SUGGESTION]` findings (only nitpicks)
- Review depth is `lite` (small change — validation cost exceeds review value)

**Progress update:** After validation: *"Validated N findings — kept X, dropped Y false positives."*

---

## Step 4: Aggregate and Filter

### Sub-Aggregator Scaling

Count the total number of reviewer agents that returned findings (including sub-reviewers from
workload splits, e.g., `2a`, `2b` each count as one).

- **≤6 reviewer agents:** The main agent aggregates directly — proceed to the filtering steps below.
- **>6 reviewer agents:** Spawn **sub-aggregator agents** to distribute the load. Each sub-aggregator
  handles **at most 6** reviewer outputs and applies steps 1–3 (deduplicate, filter confidence, drop
  vague). The main agent then merges across sub-aggregator results.

**How to split into sub-aggregators:**

1. Group reviewer outputs into batches of ≤6. Try to keep related reviewers together (e.g., group
   FDB + ZIO + Temporal since they share data-correctness concerns and dedup well against each other).
2. Spawn one **sub-aggregator agent** per batch with this prompt:

```
You are a code review sub-aggregator. Apply these steps to the findings below:
1. **Deduplicate** — merge same-line findings using priority: Security > Data loss > Performance > Observability > Code quality > Testing > Style
2. **Filter** — drop confidence < 70 (keep borderline BLOCKER 60-69 marked for re-query)
3. **Drop vague** — no line number, no concrete fix, or not in diff

## Reviewer Findings
[Paste findings from assigned reviewers]

## Output
Return JSON array of surviving findings: {severity, confidence, reviewer, file, line, issue, current_code, suggested_fix, cross_references?, borderline_requery?}
```

3. After all sub-aggregators complete, the main agent:
   - Collects all surviving findings across sub-aggregators
   - Runs a **final cross-group dedup pass** (different sub-aggregators may have flagged the same line)
   - Handles re-queries (step 4 below) for any `borderline_requery` findings
   - Presents the report (step 5)

**Progress update:** When using sub-aggregators: *"Spawning N sub-aggregators to process M reviewer outputs..."*

---

Once validation is complete (or sub-aggregators have returned), apply these filters **before**
presenting to the user:

### 1. Deduplicate

If multiple reviewers flag the same line for related reasons, merge into one finding. Use this
priority order to decide which reviewer's diagnosis to keep (highest priority wins):

1. **Security** (7 Tapir) — auth bypass, data leaks
2. **Data loss / correctness** (5 FDB, 6 Temporal, 2 ZIO) — silent failures, data corruption
3. **Performance** (2 ZIO perf, 5 FDB perf) — thread starvation, OOM, timeout
4. **Observability** (10 Observability) — secrets in logs, silent error swallowing, missing tracing
5. **Code quality / patterns** (1 Scala, 2 ZIO, 8 Frontend) — idiom violations, memory leaks
6. **Testing** (11 Testing) — flaky tests, missing assertions, isolation bugs
7. **Style / formatting** (3 Architecture & Serialization) — mechanical checks

When merging, keep the highest-priority finding and add a cross-reference:
`Also flagged by: [other reviewer] — [brief reason]`

Example: if the ZIO reviewer and the FDB reviewer both flag a `ZIO.foreach` inside a transaction,
keep the FDB reviewer's finding (category 2, more specific context) and cross-reference the ZIO reviewer.

### 2. Filter by confidence threshold

Drop any finding with **confidence < 70**. Exceptions:
- `[BLOCKER]` findings with confidence 60–69: **re-query the reviewer once** (use the re-query
  mechanism in step 4 below) to ask for clarification. If confidence stays < 70, drop it.
- Findings with confidence < 50 should never appear (reviewers are instructed not to report them),
  but drop them if they do.

### 3. Drop vague findings

Remove any finding that:
- Has no specific line number
- Has no concrete fix (just says "consider" or "be careful")
- Flags code that wasn't in the diff (unless marked as `[NOTE]`)
- Has no confidence score (reviewer didn't follow the format — treat as low confidence)

### 4. Re-query borderline findings (once only)

If a reviewer returned a finding that is **high-severity but vague** (e.g., flags a security issue
but doesn't provide a concrete fix, or cites the wrong line number), you may re-query that
**single reviewer** once with the specific finding and ask for clarification:

```
Your finding on `file:line` — "[original finding]" — needs a concrete fix.
Please provide the exact current code and a drop-in replacement, or withdraw the finding.
```

Rules:
- **One re-query per reviewer, max.** Do not loop.
- Only re-query for `[BLOCKER]` or `[SUGGESTION]` findings — never nitpicks.
- If the re-query still returns a vague answer, drop the finding.

### 5. Present the report

> **MANDATORY:** Every single finding (BLOCKER, SUGGESTION, and NITPICK) **MUST** include fenced code
> blocks showing both the **current code** and the **suggested fix**. A finding without code blocks is
> incomplete and useless — the user must be able to see exactly what to change without jumping to files.
> Never summarize a finding as just a text description. Always show the code.

Use this template:

````markdown
# Code Review Report

## Files Reviewed
- list of files with their platform classification

## Blockers (must fix before merge)

### [BLOCKER] (confidence: N) Brief title — `file:line`
**Reviewer:** [Reviewer Name]
**Issue:** Explanation of what's wrong and why it matters.
**Current code:**
```scala
// the offending code
```
**Suggested fix:**
```scala
// drop-in replacement
```
Also flagged by: [other reviewer] — [reason] *(only if deduplicated)*

## Suggestions (should fix)
Same format as blockers — each with current code + suggested fix.

## Nitpicks
- **`file:line`** — issue description
  **Current:** `code` → **Fix:** `code` *(or use fenced blocks for multi-line)*

## Notes on Pre-existing Code
- **`file:line`** — what's concerning and the pre-existing code

## Summary
- X blockers, Y suggestions, Z nitpicks across N reviewers
- Which reviewers found no issues
````

**If there are 0 blockers and 0 suggestions**, keep the report brief — just list the nitpicks
(if any) and confirm the code looks good.

---

## Step 5: Auto-Fix Handoff

After presenting the report, **offer to fix** the findings:

- **If blockers or suggestions exist:**
  > "Found X blockers and Y suggestions. Want me to auto-fix them?"
  >
  > Options:
  > 1. **Fix all** — apply all blocker and suggestion fixes
  > 2. **Fix blockers only** — apply only blocker fixes, leave suggestions for manual review
  > 3. **Skip** — just use the report as-is

- **If only nitpicks:** Do not offer auto-fix — nitpicks are informational.

When applying fixes:
- Use the **suggested fix** code from each finding as the replacement
- Apply fixes file-by-file, in order of severity (blockers first)
- After all fixes are applied, inform the user to run `checkStyleDirty` on affected modules
- Present a summary of what was changed

---

## Build-Only Changes

The router agent handles build files — it will route `build.mill`, `package.mill`, and
`dependency.mill` to only the architecture & serialization reviewer (3).

The architecture reviewer should additionally check for build-only changes:
- Whether new `moduleDeps` match actual imports in the code
- Whether dependency versions are consistent with other modules
- Whether any new external dependencies are justified (not duplicating existing functionality)
