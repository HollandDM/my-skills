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

You are orchestrating a **gang of specialized code reviewers** for the Stargazer codebase. Each
reviewer is an agent that focuses on one quality dimension. Your job is to:

1. Gather context (diff, full files, git blame) and ask user for change intent
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

### Gather context for each changed file

Reviewers need the **diff**, the **full file**, and **git blame context** to make good judgments.
For each changed file:

1. **Get the unified diff**: `git diff -U3 HEAD~1 -- <file>` (or `git diff -U3 -- <file>`)
2. **Read the full file content** with line numbers (so reviewers can cite exact lines)
3. **Get git blame on changed lines**: For each hunk in the diff, run
   `git blame -L <start>,<end> HEAD -- <file>` to get authorship and recency of surrounding code.
   Also run `git log --oneline -3 -- <file>` for recent file history.

The diff goes to both the **router** (Step 2) and the **reviewers** (Step 3). The full file and
blame context go only to reviewers — the router only needs diffs to classify files.

### Git Blame Context

Include blame output in a `## Git Context` section when sending files to reviewers:

```
## Git Context

Recent history:
  a1b2c3d 2 days ago — refactor: extract validation logic
  d4e5f6g 1 week ago — feat: add batch processing

Blame on changed lines:
  a1b2c3d (author 2025-03-18) line 42: val result = service.process(input)
  f7g8h9i (author 2024-01-15) line 43: val config = loadConfig()  // untouched, 14 months old
```

This helps reviewers:
- **Avoid false positives** on intentional patterns (same author, recent commit = probably deliberate)
- **Calibrate confidence** (old untouched code nearby = higher risk of misunderstanding context)
- **Spot risky patterns** (code last touched 2 years ago being modified = check carefully)

### The Diff-Bound Rule

Instruct every reviewer: **only flag issues on lines that were added or modified in the diff.**
Do not critique pre-existing code that the author didn't touch. If a pre-existing pattern is
genuinely dangerous (security hole, data loss risk), mention it as a `[NOTE]` but not as a blocker.

### The No-Compile Rule

**Reviewers must NEVER run build commands** (`./mill compile`, `./mill checkStyle`, `./mill reformat`,
or any `./mill` command). Compilation and linting are the programmer's responsibility and are always
done before review. Reviewers analyze code by reading only — no compilation, no execution.

If a reviewer is **unsure** whether something compiles or is correct, it should report the finding
as a `[NITPICK]`, not a `[BLOCKER]` or `[SUGGESTION]`. Uncertainty is not grounds for blocking.

### Ask for Change Context

Before proceeding, **ask the user** for optional context about the changes:

> "I found N changed files. Before I start the review, any context you'd like to share?
> (e.g., 'this is a refactor', 'fixing a bug in subscription flow', 'new FDB store for X')
>
> Press Enter to skip, or type a brief description."

**If the user provides context**, include it in every reviewer's prompt as a `## Change Context`
section (see Step 3). This helps reviewers:
- Skip "missing tests" flags on pure refactors
- Focus on correctness for bugfixes
- Check for breaking changes on API modifications
- Understand domain intent behind non-obvious patterns

**If the user skips**, proceed without it — reviewers still have the diff and git blame for context.

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

Spawn the **router agent** (haiku model) to decide which reviewers each file needs. The router
classifies files based on **actual diff content** — not just file path. A `/shared/` file with
only case classes gets different reviewers than one importing `ZStream`.

Read `reviewers/00-router.md` for the router's full instructions. Spawn a **single haiku agent**
with this prompt:

```
[Full contents of reviewers/00-router.md]

---

## Files to Route

[For each changed file: file path + its unified diff (NOT full file — keep payload small)]
```

The router returns a JSON object mapping each file to a list of reviewer IDs:

```json
{
  "path/to/Service.scala": ["1", "2", "3", "5"],
  "path/to/Page.scala": ["1", "3", "8"]
}
```

**Wait for the router to complete before proceeding to Step 3.**

---

## Step 3: Spawn Reviewer Agents

Using the router's output, determine the **union of all reviewer IDs** across all files. For each
unique reviewer ID, spawn one reviewer agent that reviews **all files assigned to it**.

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

2. **No compiling or running tools**: Do NOT run `./mill`, `compile`, `checkStyle`, `reformat`, or
   any build/lint commands. Analyze code by reading only. If you are unsure whether something is
   correct, report it as a [NITPICK], not a [BLOCKER].

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

6. **Every finding must include**: file path, line number, confidence score, what's wrong,
   and a concrete fix. If you cannot provide a specific fix, do not report the finding.

7. If you find nothing wrong, report: "Clean — no issues found."

---

## Change Context

[If the user provided context, include it here. Otherwise omit this section entirely.]

---

## Diff

[git diff output for the files under review]

---

## Full File Contents

[Full file contents for context — review ONLY the changed lines above]
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
You are a code review validator. Your ONLY job is to verify whether each finding below is real.
You have NO prior context — read the code fresh and check each claim independently.

## Findings to Validate

[For each finding on this file:]
- **ID:** [sequential number]
- **Severity:** [BLOCKER/SUGGESTION] (confidence: N)
- **Reviewer:** [name]
- **Claim:** [the finding's issue description]
- **Line:** [line number]
- **Suggested fix:** [the reviewer's fix]

## The Code

[unified diff for this file]

[full file contents]

[git blame context]

## Change Context

[user-provided context, if any]

## Instructions

For EACH finding, return exactly one verdict:

- **CONFIRMED** — The issue is real. The claimed pattern exists at the cited line.
- **FALSE_POSITIVE** — The issue is NOT real. State why in one sentence.

Check against these false positive categories:
- The issue is pre-existing and was NOT introduced in this diff
- The code looks wrong but is intentional (git blame shows same author, recent commit)
- The compiler or linter will already catch this
- The finding requires context outside the provided code to validate
- The finding is a style preference, not a correctness issue
- The code has a suppression comment with an explanation

Return a JSON array:
[
  {"id": 1, "verdict": "CONFIRMED"},
  {"id": 2, "verdict": "FALSE_POSITIVE", "reason": "This pattern is intentional — same author added it 2 days ago in the same PR"}
]
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

Once validation is complete, apply these filters **before** presenting to the user:

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

Every finding **must** include the current code and the suggested fix as fenced code blocks so
the user can see exactly what to change without jumping to files. Use this template:

````markdown
# Code Review Report

## Files Reviewed
- list of files with their platform classification

## Blockers (must fix before merge)

For each finding:

### [BLOCKER] (confidence: N) Brief title — `file:line`
**Reviewer:** [Reviewer Name]

**Issue:** Explanation of what's wrong and why it matters.

**Current code:**
```scala
// the offending code from the diff (include enough surrounding lines for context)
```

**Suggested fix:**
```scala
// the corrected code — a drop-in replacement the user can copy-paste
```

Also flagged by: [other reviewer] — [brief reason] *(only if deduplicated)*

---

## Suggestions (should fix)

Same format as blockers — each with current code + suggested fix:

### [SUGGESTION] (confidence: N) Brief title — `file:line`
**Reviewer:** [Reviewer Name]

**Issue:** Explanation.

**Current code:**
```scala
...
```

**Suggested fix:**
```scala
...
```

---

## Nitpicks

Nitpicks use a compact format — code blocks only when the fix isn't obvious:

- **`file:line`** — issue description
  ```scala
  // current → suggested (one-liner or short snippet)
  ```

## Notes on Pre-existing Code

If any reviewer flagged dangerous pre-existing patterns (not in the diff):

- **`file:line`** — what's concerning and why
  ```scala
  // the pre-existing code in question
  ```

## Summary
- X blockers, Y suggestions, Z nitpicks across N reviewers
- Which reviewers found no issues (clean bill of health)
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
