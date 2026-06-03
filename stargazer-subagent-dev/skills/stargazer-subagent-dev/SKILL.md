---
name: stargazer-subagent-dev
description: >
  Execute implementation plans for Stargazer codebase by dispatching team-based agents
  per task with code quality review. Use when user has approved plan ready for execution.
  Triggers: "execute plan", "implement plan", "subagent dev", "stargazer implement",
  or when user has plan and wants to start building. Specific to Stargazer Scala/ZIO/FoundationDB
  codebase — not applicable for non-Stargazer work. If user has no plan, tell them to
  create one first (e.g., using writing-plans skill or plan mode).
---

# Stargazer Subagent-Driven Development

## Execution mode — check this FIRST

This skill runs in one of two modes depending on tooling. **Capture this skill's base directory** from the "Base directory for this skill:" line above; store it as `SKILL_DIR`. It applies to whichever mode file you read.

Check whether the **Workflow tool** is available in this environment, then read the matching mode file and follow it:

- **Workflow tool present** → read `${SKILL_DIR}/workflow-mode.md` and follow it (deterministic background orchestration — per-phase implementers → bounded review/fix loop → single build → final review).
- **Workflow tool absent** → read `${SKILL_DIR}/subagent-mode.md` and follow it (live per-task implementer + reviewer via TeamCreate/SendMessage).

Both files implement the same phase-by-phase execution logic; only the orchestration mechanism differs. Read only the one for the selected mode — do not read both.
