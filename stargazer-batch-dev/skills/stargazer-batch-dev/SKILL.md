---
name: stargazer-batch-dev
description: >
  Execute Stargazer Scala/ZIO plans via batch-parallel advisor-implementer model.
  Trigger: "implement the plan", "execute plan", "implement plan", "stargazer batch dev",
  or approved plan ready for execution. Batches independent tasks in parallel — one advisor
  (high-capability) per batch, one implementer (balanced-capability) per task. Loops autonomously through all batches.
  DO NOT use any other skill — follow this skill's instructions only.
---

# Stargazer Batch-Parallel Plan Execution

## Execution mode — check this FIRST

This skill runs in one of two modes depending on tooling. **Capture this skill's base directory** from the "Base directory for this skill:" line above; store it as `SKILL_DIR`. It applies to whichever mode file you read.

Check whether the **Workflow tool** is available in this environment, then read the matching mode file and follow it:

- **Workflow tool present** → read `${SKILL_DIR}/ultracode-mode.md` and follow it (deterministic background orchestration — one `Workflow(...)` script driving the batch loop).
- **Workflow tool absent** → read `${SKILL_DIR}/team-mode.md` and follow it (live advisor + implementers via TeamCreate/SendMessage).

Both files implement the same batch-parallel execution logic; only the orchestration mechanism differs. Read only the one for the selected mode — do not read both.
