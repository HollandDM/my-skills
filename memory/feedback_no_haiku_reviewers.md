---
name: No fast-lightweight for semantic reviewers
description: All code reviewers need reasoning capability - never use fast-lightweight model for any reviewer or aggregator, even on lite PRs
type: feedback
---

Semantic reviewers (Scala Quality, ZIO, FDB, Temporal, Tapir, Frontend, React, Testing) must never use fast-lightweight — they need reasoning capability even on lite PRs. Mechanical/checklist reviewers (Architecture, Observability) can use fast-lightweight as their default since they do pattern-matching checks.

**Why:** Fast-lightweight models lack the reasoning depth to catch contextual bugs (stale reads driving writes, unnecessary DOM recreation, design coupling) that semantic reviewers need to find. But for mechanical checks (module boundary violations, logging patterns), fast-lightweight is sufficient.

**How to apply:** Never downgrade semantic reviewers to fast-lightweight via depth overrides. Architecture (03) and Observability (10) default to fast-lightweight and that's fine. Aggregators need at least balanced-capability for semantic dedup/validation.
