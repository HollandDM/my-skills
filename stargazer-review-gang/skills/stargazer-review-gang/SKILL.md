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
2. **YOU DO NOT READ DIFFS, SOURCE FILES, OR SUB-AGENT INSTRUCTION FILES.** Do NOT run
   `git diff` or `git merge-base`. Do NOT use the Read tool on any `.md` file in this skill.
   The orchestrator determines the diff ref itself from the user's review scope.
   **Exception:** You MAY run `git log --oneline` and `git status` (short form) in Step 3 to
   gather branch/history context for the orchestrator prompt — but do NOT analyze the output
   yourself; just pass it to the orchestrator.
3. **NO STOP CONDITION FOR PR SIZE.** Handle all PRs regardless of file count or line count.

## Workflow

1. Ask user for context
2. **Discover tools** — scan available plugins for tools reviewers can use (e.g. LSP for Scala)
3. Spawn **routing orchestrator** → get back file list, depth, and routing plan (JSON)
4. Spawn **reviewer agents** in parallel based on routing plan
5. **Aggregate** (validates + deduplicates + filters) and present report
6. Offer **auto-fix**

---

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

Before spawning sub-agents, scan available plugins/skills for tools that reviewers can leverage
(e.g. an LSP server with Scala support for go-to-definition, find-references, type info).

### Discovery Process

1. **Read the root marketplace file** at `../../.claude-plugin/marketplace.json` (relative to this
   skill's directory) to get the list of installed plugins.
2. **For each plugin**, read its `plugin.json` (at `<source>/.claude-plugin/plugin.json`) and look
   for a `tools` array. Each tool entry should have at minimum `name` and `description`.
3. **Filter for relevant tools**: keep tools whose `keywords` or `description` mention any of:
   `lsp`, `language-server`, `scala`, `metals`, `goto-definition`, `find-references`, `type-info`,
   `diagnostics`, `completions`.
4. **Build a tool manifest** — a JSON array of discovered tools:

```json
[
  {
    "plugin": "<plugin name>",
    "tool": "<tool name>",
    "description": "<what the tool does>",
    "capabilities": ["<matched keywords>"]
  }
]
```

5. If **no tools are found**, set the manifest to `[]` and proceed — tool availability is optional.

Store the manifest as `discovered_tools` for use in subsequent steps.

---

## Step 3: Spawn Routing Orchestrator

Spawn a **single agent** with this prompt (do NOT read the orchestrator file yourself).
Use `model: "sonnet"` — the orchestrator interprets the review scope, determines diff refs, reads all diffs, and routes files.

**Pass the user's review scope verbatim** — do NOT interpret it into base/head refs. The
orchestrator determines the correct git diff strategy itself. **Add surrounding context** (branch
name, recent commit summaries, number of files) to help the orchestrator orient quickly, but keep
the user's words intact as the primary scope.

```
You are the routing orchestrator for the stargazer-review-gang code review system.
Your ONLY job is to classify changed files and produce a JSON routing plan.

CRITICAL: Do NOT invoke the Skill tool — you are already inside the stargazer-review-gang
workflow. Re-triggering it would cause infinite recursion.

Read your full instructions from: agents/orchestrator.md (relative to this skill's directory)

## Review Scope
<user's exact words describing what to review, word for word>

## Branch & Recent History
<current branch name, last 3-5 commit summaries, dirty/clean status — gathered by the main agent
from git log/status BEFORE spawning this orchestrator>

## Context
<user-provided context from Step 1, or "None">

## Available Tools
<discovered_tools JSON from Step 2, or "[]" if none found>
```

The orchestrator determines the diff ref, finds changed files, reads diffs, routes, and returns JSON:

```json
{
  "diff_ref": "abc123..def456",
  "total_files": 12,
  "total_changes": 2982,
  "depth": "heavy",
  "routing": {"path/to/File.scala": ["1", "2", "3"]},
  "workload": {"1": {"changes": 850}, "2": {"changes": 3200, "split": [...]}}
}
```

Use the returned `diff_ref` when spawning reviewers and aggregators.

**Wait for the orchestrator to complete before proceeding.**

---

## Step 4: Spawn Reviewer Agents

> **ROUTING IS FINAL.** Spawn exactly the reviewers the orchestrator assigned — no more, no less.

Using the routing output, determine the **union of all reviewer IDs** across all files.

### Workload Splits

From `workload`:
- **≤4000 +/-:** One reviewer agent per ID.
- **>4000 +/- with split:** Spawn sub-reviewers (2a, 2b, etc.) with focused scope.
  Prepend: `> FOCUSED REVIEW: You are sub-reviewer {id}. Review ONLY: {focus}`

### Model Override by Depth

- `lite`: use roster defaults (all reviewers are standard minimum — no haiku for semantic review)
- `medium`: use roster defaults
- `heavy`: `model: "opus"` for all reviewers

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
| 9 | scalajs-react | `reviewers/09-react.md` | standard |
| 10 | Observability | `reviewers/10-observability.md` | haiku |
| 11 | Testing | `reviewers/11-testing.md` | standard |

### Reviewer Prompt Template

For each reviewer, spawn an agent with this prompt (do NOT read checklist files yourself):

```
You are a code reviewer sub-agent. Do NOT invoke any skills or the Skill tool.
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

## Available Tools
<discovered_tools JSON from Step 2, or "[]" if none found>
If tools are available, use them to enrich your review (e.g. LSP for type checking,
go-to-definition, find-references). Tools are optional — proceed without them if empty.

## Gather Your Own Context
For each file above:
1. Get diff: git diff -U3 <diff_ref> -- <file>
2. Read full file (Read tool)
3. Blame changed lines: git blame -L <start>,<end> HEAD -- <file>
4. Recent history: git log --oneline -3 -- <file>
5. If LSP or similar tools are available: use them for type info, references, or diagnostics
   on changed lines to strengthen your findings.
Then review ONLY changed lines.
```

Spawn all reviewers in a **single message** for maximum parallelism.

---

## Step 5: Aggregate, Validate, and Filter

Each aggregator now **validates** BLOCKER/SUGGESTION findings against actual code before
deduplicating. No separate validation step needed.

Count **all** reviewer agents that responded — including those that reported "Clean — no issues
found" (sub-reviewers like 1a, 1b count separately). Every reviewer response counts as one output.

- **≤4 outputs:** Spawn **one aggregator agent**.
- **>4 outputs:** Split into batches of ≤4 and spawn **one aggregator per batch**. Group related
  reviewers together (e.g., FDB + ZIO + Temporal). After all aggregators complete, spawn one
  **final aggregator** to merge their reports and do a cross-group dedup pass.

Use the same depth-based model override as reviewers:
- `lite`: `model: "sonnet"` (aggregator default — no haiku for semantic work)
- `medium`: `model: "sonnet"` (aggregator default)
- `heavy`: `model: "opus"`

For each aggregator, spawn an agent with the depth-appropriate model and this prompt (do NOT read the aggregator file yourself):

```
You are a review aggregator sub-agent. Do NOT invoke any skills or the Skill tool.
Read your instructions from: agents/aggregator.md (relative to this skill's directory)

Diff ref: <diff_ref from orchestrator output>

## Findings to Aggregate
[paste all findings from the assigned reviewer batch]
```

Pass the `diff_ref` so the aggregator can check diffs during validation.

The aggregator returns the final report. Present it to the user as-is.

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

Apply fixes file-by-file, blockers first.
After fixing, tell user to run `checkStyleDirty` on affected modules.
