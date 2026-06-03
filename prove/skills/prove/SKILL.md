---
name: prove
description: Prove or disprove claim about code, architecture, behavior, or technical property. Spawns adversarial agents — provers and disprovers — argue from multiple angles, synthesizes verdict. If undecided, enters combat loop where agents attack each other's arguments until resolved. Use when user says "prove", "verify", "does this guarantee", "is it always true that", "can this ever fail", "show me this holds", or asks whether something satisfies property. Works for code properties (null-safety, termination, invariants), architectural claims ("this migration is backward-compatible"), runtime behavior ("this endpoint never takes >5s"), design reasoning ("this approach scales"), or any assertion user wants rigorously examined.
---

# Prove

## Execution mode — check this FIRST

This skill runs in one of two modes depending on tooling. **Capture this skill's base directory** from the "Base directory for this skill:" line above; store it as `SKILL_DIR`. It applies to whichever mode file you read.

Check whether the **Workflow tool** is available in this environment, then read the matching mode file and follow it:

- **Workflow tool present** → read `${SKILL_DIR}/workflow-mode.md` and follow it (deterministic background orchestration — one `Workflow(...)` script).
- **Workflow tool absent** → read `${SKILL_DIR}/team-mode.md` and follow it (live TeamCreate/Agent/SendMessage verification team).

Both files implement the same prove/disprove logic; only the orchestration mechanism differs. Read only the one for the selected mode — do not read both.
