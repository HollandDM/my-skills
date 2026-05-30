---
name: feedback-intent-over-tool-calls
description: Skill wording should express intent, not platform-specific exact tool calls (keep team-of-agents skills portable, not OpenCode-bound)
metadata:
  type: feedback
---

These multi-agent skills (`prove`, `stargazer-subagent-dev`, `stargazer-batch-dev`, `stargazer-review-gang`) must read as *intent*, not as OpenCode Ensemble API calls. Avoid literal tool/param syntax: `team_name:`/`name:`/`description:`/`model:`/`mode: "read-only"` blocks, `Spawn parameters:` headers, `{"type":"shutdown_request"}` to `"*"`, and "send a team message".

Instead say what should happen: "spawn X into the <team> team, named …, using a high-capability model, in a read-only role", "message the reviewer directly", "ask every teammate to wind down". Keep the generic coordination vocabulary (team, teammate, team lead, spawn, message) — that *is* the intent and the user uses it themselves.

**Why:** The repo should stay portable across agent-team platforms, not bound to one tool's API. Reads as instruction, not a hardcoded call.

**How to apply:** When editing/adding these skills, describe the goal of each agent action; only keep concrete identifiers (team names, agent names, capability tiers like fast-lightweight/balanced-capability/high-capability). The 2026-05-30 refactor converted all four skills this way. Related: [[feedback-no-haiku-reviewers]].
