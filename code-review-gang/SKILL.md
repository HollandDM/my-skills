---
name: code-review-gang
description: >
  Multi-perspective code review for the Stargazer codebase. Spawns a gang of specialized
  reviewer agents in parallel - each focused on a different quality dimension (ZIO patterns,
  security, performance, FDB, Temporal, Laminar, styling, architecture, etc.). Automatically
  detects whether code is frontend (js/), backend (jvm/), or shared, and only spawns relevant
  reviewers. Use this skill whenever the user asks for a thorough code review, says "review my
  changes", "review this PR", "code review gang", or wants multi-angle feedback on their code.
  Also trigger when the user wants to check code quality before pushing or submitting a PR.
---

# Code Review Gang

You are orchestrating a **gang of specialized code reviewers** for the Stargazer codebase. Each
reviewer is an agent that focuses on one quality dimension. Your job is to:

1. Figure out what code needs reviewing and gather context
2. Spawn the **router agent** to classify each file and decide which reviewers to run
3. Spawn the right reviewers in parallel based on the router's output
4. Aggregate, deduplicate, and filter their findings into one actionable report

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

### Gather full context for reviewers

Reviewers need **both** the diff and the full file to make good judgments. A 50-line diff without
surrounding context leads to false positives and missed issues.

For each changed file:
1. **Get the diff** (what changed): `git diff HEAD~1 -- <file>` or `git diff -- <file>`
2. **Read the full file** (surrounding context): read the entire file content

Pass both to each reviewer — the diff tells them *what* to review, the full file tells them *how*
it fits into the surrounding code.

### Diff & File Format

For each changed file, prepare the reviewer input in this format:

1. **File path header**: `## File: path/to/file.scala`
2. **Unified diff** with 3-line context: `git diff -U3 HEAD~1 -- path/to/file` (or equivalent)
3. **Full file content** with line numbers for reference (so reviewers can cite exact lines)

When multiple files are reviewed, concatenate them with clear `## File:` separators.

### The Diff-Bound Rule

Instruct every reviewer: **only flag issues on lines that were added or modified in the diff.**
Do not critique pre-existing code that the author didn't touch. If a pre-existing pattern is
genuinely dangerous (security hole, data loss risk), mention it as a `[NOTE]` but not as a blocker.

---

## Step 2: Route Files to Reviewers

Spawn the **router agent** to decide which reviewers each file needs. The router is a fast, lean
agent (haiku model) that reads each file's diff and classifies it based on actual content — not
just file path.

Read `reviewers/00-router.md` for the router's instructions, then spawn it with:

```
[Contents of reviewers/00-router.md]

---

## Files to Route

[For each changed file: file path + its unified diff]
```

The router returns a JSON mapping of file → reviewer IDs. Wait for it to complete before
proceeding to Step 3.

---

## Step 3: Spawn Reviewer Agents

Using the router's output, determine the **union of all reviewer IDs** across all files. For each
unique reviewer ID, spawn one reviewer agent that reviews **all files assigned to it**.

Each reviewer has a dedicated checklist in the `reviewers/` directory relative to this skill.

### Reviewer Roster

| ID | Reviewer | Checklist file | Model | Focus |
|----|----------|---------------|-------|-------|
| 1a | Scala Style & Formatting | `reviewers/01a-scala-style.md` | **haiku** | Banned syntax, formatting, naming, imports (mechanical) |
| 1b | Scala 3 Code Quality | `reviewers/01b-scala-code.md` | **standard** | Scala 3 idioms, service patterns, error design (semantic) |
| 2a | ZIO & Async Patterns | `reviewers/02-zio-async.md` | standard | Effects, error handling, retry, resources |
| 2b | ZStream Patterns | `reviewers/02b-zstream.md` | standard | Chunking, unbounded collection, backpressure |
| 2c | ZIO Performance | `reviewers/02c-zio-performance.md` | standard | Blocking, parallelism, Ref, caching, fibers |
| 3 | Architecture & Boundaries | `reviewers/03-architecture.md` | **haiku** | Module deps, layer violations, code placement (lightweight) |
| 4 | Serialization & Codecs | `reviewers/04-serialization.md` | **haiku** | Custom codec detection, runtime-breaking codec issues |
| 5a | FDB Coding Patterns | `reviewers/05a-fdb-coding.md` | standard | Store providers, operations, IDs, transaction types, RecordIO |
| 5b | FDB Performance | `reviewers/05b-fdb-performance.md` | standard | N+1 queries, unbounded scans, tx splitting, timeout risks |
| 6 | Temporal Workflows | `reviewers/06-temporal.md` | standard | Activity attributes, CDC, async endpoints, batch actions, pattern selection |
| 7 | Tapir Server Security | `reviewers/07-tapir-security.md` | standard | Unconventional server patterns, auth bypass, handler selection |
| 8 | Tapir Client Patterns | `reviewers/08-tapir-client.md` | standard | Unconventional client patterns, base class bypass, error/loading gaps |
| 9 | Laminar & Airstream | `reviewers/09-laminar-airstream.md` | standard | Framework choice, split operators, stream flattening, memory leaks, reactivity |
| 10 | UI & Styling | `reviewers/10-ui-styling.md` | **haiku** | Tailwind DSL, design system components, layout |
| 11 | scalajs-react | `reviewers/11-react.md` | standard | Legacy framework flagging, Callback correctness, React-Laminar bridge, lifecycle cleanup |

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

2. **Triage every finding** into exactly one category:
   - `[BLOCKER]` — Must fix before merge. Security holes, data loss, crash bugs, broken contracts.
   - `[SUGGESTION]` — Should fix. Pattern violations, missing error handling, performance issues.
   - `[NITPICK]` — Nice to have. Style, naming, minor convention deviations.

3. **Every finding must include**: file path, line number, what's wrong, and a concrete fix.
   If you cannot provide a specific fix, do not report the finding.

4. If you find nothing wrong, report: "Clean — no issues found."

---

## Diff

[git diff output for the files under review]

---

## Full File Contents

[Full file contents for context — review ONLY the changed lines above]
```

Spawn all applicable reviewers in a single message to maximize parallelism.

---

## Step 4: Aggregate and Filter

Once all reviewer agents complete, apply these filters **before** presenting to the user:

### 1. Deduplicate

If multiple reviewers flag the same line for related reasons, merge into one finding. Use this
priority order to decide which reviewer's diagnosis to keep (highest priority wins):

1. **Security** (07-tapir-security) — auth bypass, data leaks
2. **Data loss / correctness** (05a/05b FDB, 06 Temporal, 02a ZIO, 02b ZStream) — silent failures, data corruption
3. **Performance** (02c ZIO perf, 05b FDB perf) — thread starvation, OOM, timeout
4. **Code quality / patterns** (01b Scala code, 02a ZIO patterns, 09 Laminar) — idiom violations, memory leaks
5. **Style / formatting** (01a Scala style, 04 serialization, 10 UI styling) — mechanical checks

When merging, keep the highest-priority finding and add a cross-reference:
`Also flagged by: [other reviewer] — [brief reason]`

Example: if the ZIO reviewer and the FDB reviewer both flag a `ZIO.foreach` inside a transaction,
keep the FDB reviewer's finding (category 2, more specific context) and cross-reference the ZIO reviewer.

### 2. Drop vague findings

Remove any finding that:
- Has no specific line number
- Has no concrete fix (just says "consider" or "be careful")
- Flags code that wasn't in the diff (unless marked as `[NOTE]`)

### 3. Present the report

```markdown
# Code Review Report

## Files Reviewed
- list of files with their platform classification

## Blockers (must fix before merge)
For each:
- **[Reviewer Name]** `file:line` — Issue description
  **Fix:** concrete code change

## Suggestions (should fix)
For each:
- **[Reviewer Name]** `file:line` — Issue description
  **Fix:** concrete code change

## Nitpicks
Collapsed/brief list:
- `file:line` — issue (fix)

## Notes on Pre-existing Code
If any reviewer flagged dangerous pre-existing patterns (not in the diff):
- `file:line` — what's concerning and why

## Summary
- X blockers, Y suggestions, Z nitpicks across N reviewers
- Which reviewers found no issues (clean bill of health)
```

**If there are 0 blockers and 0 suggestions**, keep the report brief — just list the nitpicks
(if any) and confirm the code looks good.

---

## Build-Only Changes

The router agent handles build files — it will route `build.mill`, `package.mill`, and
`dependency.mill` to only the architecture reviewer (3). If the build file changes protobuf
plugin config or codec dependencies, the router may also include the serialization reviewer (4).

The architecture reviewer should additionally check for build-only changes:
- Whether new `moduleDeps` match actual imports in the code
- Whether dependency versions are consistent with other modules
- Whether any new external dependencies are justified (not duplicating existing functionality)
