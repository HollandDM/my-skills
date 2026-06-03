---
name: stargazer-review-gang
description: >
  Trigger when user says "stargazer review gang", "review my changes", "review this PR",
  or wants multi-angle feedback before pushing. Spawns a team of specialized reviewer agents
  for the Stargazer codebase.
---

# Stargazer Review Gang

## Execution mode — check this FIRST

This skill runs in one of two modes depending on tooling. **Capture this skill's base directory** from the "Base directory for this skill:" line above; store it as `SKILL_DIR`. It applies to whichever mode file you read.

Check whether the **Workflow tool** is available in this environment, then read the matching mode file and follow it:

- **Workflow tool present** → read `${SKILL_DIR}/workflow-mode.md` and follow it (deterministic background orchestration — route → parallel reviewers → opus validator).
- **Workflow tool absent** → read `${SKILL_DIR}/team-mode.md` and follow it (live orchestrator + reviewer team via TeamCreate/SendMessage).

Both files implement the same multi-angle review logic; only the orchestration mechanism differs. Read only the one for the selected mode — do not read both.
