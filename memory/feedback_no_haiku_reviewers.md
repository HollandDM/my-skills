---
name: No haiku for semantic reviewers
description: All code reviewers need reasoning capability - never use haiku model for any reviewer or aggregator, even on lite PRs
type: feedback
---

Semantic reviewers (Scala Quality, ZIO, FDB, Temporal, Tapir, Frontend, React, Testing) must never use haiku — they need reasoning capability even on lite PRs. Mechanical/checklist reviewers (Architecture, Observability) can use haiku as their default since they do pattern-matching checks.

**Why:** Haiku lacks the reasoning depth to catch contextual bugs (stale reads driving writes, unnecessary DOM recreation, design coupling) that semantic reviewers need to find. But for mechanical checks (module boundary violations, logging patterns), haiku is sufficient.

**How to apply:** Never downgrade semantic reviewers to haiku via depth overrides. Architecture (03) and Observability (10) default to haiku and that's fine. Aggregators need at least sonnet for semantic dedup/validation.
