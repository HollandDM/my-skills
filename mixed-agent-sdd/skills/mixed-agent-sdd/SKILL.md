---
name: mixed-agent-sdd
description: Execute an approved implementation plan through a Claude Code controller that orchestrates Claude subagents, the installed OpenAI Codex Claude plugin companion, and OpenCode CLI. Use when an executable plan needs cost-balanced mixed-agent implementation, batch review and repair, or a final human-reviewed cross-vendor audit. Require a caller-provided role roster and working Codex and OpenCode dependencies; return structured status instead of partially proceeding when prerequisites fail.
---

# Mixed-Agent Subagent-Driven Development

Act as the controller. Do not edit implementation files. Create only temporary run artifacts, dispatch and monitor agents, enforce the gates below, run verification, adjudicate findings, and create verified commits.

Read [dispatch contracts](references/dispatch-contracts.md) before creating briefs or sending an agent prompt. Use [sdd-preflight.mjs](scripts/sdd-preflight.mjs) and [run-opencode-background.sh](scripts/run-opencode-background.sh) rather than recreating their mechanics.

## Inputs and terminal statuses

Require these inputs from the caller:

- An **Executable Plan**: every task has acceptance criteria, dependencies, exclusive file/directory ownership, and verification command(s).
- A **Role Roster**: eligible backend/model/effort combinations for implementers, reviewers, fixers, and final reviewers. Use the floors: implementers medium/high; fixers medium-or-higher; batch reviewers high-or-higher; final external reviewers xhigh/max.

Return exactly one terminal status block, followed by a concise summary:

```json
{
  "sdd_status": "SDD_UNAVAILABLE | PLAN_NOT_EXECUTABLE | BATCH_BLOCKED | SDD_COMPLETE",
  "run_ledger": "/tmp/mixed-agent-sdd/<run-id>/ledger.md",
  "evidence": ["..."],
  "next_action": "..."
}
```

Do not alter global configuration, credentials, Docker state, or database state. If any is required, return `SDD_UNAVAILABLE` with the exact remediation for the caller to arrange.

## 1. Preflight and run artifacts

1. Validate the plan before dispatch. Missing acceptance criteria, dependencies, ownership, or verification commands means `PLAN_NOT_EXECUTABLE`.
2. Make a unique temporary run directory under `${TMPDIR:-/tmp}/mixed-agent-sdd/<run-id>/`. Create `ledger.md`, `constraints.md`, `briefs/`, `reports/`, `diffs/`, and `logs/` there. Never add them to the repository.
3. Record the repository `HEAD`, plan path, caller roster, and every later directive in `ledger.md` immediately.
4. Run:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/skills/mixed-agent-sdd/scripts/sdd-preflight.mjs" --opencode-model '<one configured OpenCode model>'
   ```

   The preflight checks the installed `codex` Claude plugin's companion and the nominated OpenCode model without changing their configuration. If it is not `SDD_READY`, return `SDD_UNAVAILABLE` before touching the repository.
5. Capability-check every promised roster assignment. Never promise an unavailable model. A roster revision applies only to future dispatches; let in-flight agents finish and record the revision in the ledger.

## 2. Build batches and briefs

1. Turn plan dependencies into ordered implementation batches. Pack ready independent tasks together until every normal batch contains at least three tasks, even if they are otherwise unrelated.
2. Run overlapping or uncertain ownership sequentially inside the batch. Parallel tasks must have explicitly disjoint ownership.
3. Permit a one- or two-task terminal remainder only when dependencies make a three-task batch impossible. It skips Full Batch Review and relies on controller verification plus the Final Trio.
4. For each task, create a task-specific brief in `briefs/`; never paste the full plan into an agent prompt. Create one shared `constraints.md` and one report file per dispatch.
5. Randomly balance each ready task across eligible Claude, Codex, and OpenCode implementers. Do not seed or replay choices. Record actual selections in the ledger. Codex and OpenCode are mandatory preflight dependencies but a small batch need not use all three.

## 3. Dispatch and collect

Use the contracts in the reference. Every implementation and fixing prompt points only to its brief, `constraints.md`, and report contract.

- **Claude:** dispatch a background subagent with the roster model. It may edit only its owned paths. It never stages or commits.
- **Codex:** use the discovered companion with `task --background --write --model <model> --effort <effort>`. Record its job ID, poll `status --json`, and collect `result --json`.
- **OpenCode:** start `run-opencode-background.sh` with `--write`; this supplies the approved noninteractive `--auto` mode. Record its PID and log path; monitor both before reading its report.

An agent report must state completed work, files changed, verification not run, concerns, and a proposed commit message. An incomplete report, an ownership-gate failure, or a verification failure gets at most two additional recovery attempts after the original dispatch. Switch backend after the first failed recovery. After the third failure, preserve the uncommitted edits and a patch in the run directory; return `BATCH_BLOCKED` without committing or resetting anything.

## 4. Batch gates

For each batch:

1. Wait for all implementers, enforce the **Ownership Gate**, then run the plan's verification commands as controller. Implementers and fixers may use static diagnostics only; they never run those commands or administer infrastructure.
2. Write a complete batch diff package relative to the batch's starting `HEAD` under `diffs/`.
3. For a batch of three or more tasks, dispatch exactly three high-or-higher reviewers over that same complete package: one specification reviewer and two quality reviewers, using Claude, Codex, and OpenCode once each. They are read-only and do not modify files.
4. Adjudicate all reports against the brief and actual diff. Merge duplicates and discard unsupported or out-of-scope findings. Give one fixer the complete accepted list—not individual findings. Select the fixer from the eligible medium-or-higher roster and keep it within the batch's combined ownership.
5. Run exactly one fixer wave. Then repeat the Ownership Gate and controller verification; do not re-open the reviewer trio. If clean, stage and commit only that verified batch. The controller alone commits.
6. For a permitted small terminal remainder, skip steps 3–5 when there are no controller-identified fixes; otherwise apply the same one-fixer and verification rules before committing.

## 5. Final human handoff

After all batches commit successfully:

1. Prepare a whole-branch diff package.
2. Review it concurrently as the controller and with two read-only external reviewers: Codex and OpenCode, using final-tier roster entries.
3. Compile, deduplicate, and label the findings for the human. Do not start a final fixer wave. The two external reviewers shut down after reporting.
4. Return `SDD_COMPLETE` with the ledger path, commits, verification evidence, and compiled final findings. The human decides any follow-up work.

## Non-negotiable rules

- The controller never edits implementation files and agents never commit.
- Never stage an out-of-ownership file; ask the responsible agent to revert it or obtain a recorded ownership amendment.
- Never silently replace a required dependency or unsupported roster assignment.
- Never start a partial run after failed preflight, and never clean/reset a blocked batch automatically.
- Keep the ledger in the temporary run directory until handoff; it is not project documentation.
