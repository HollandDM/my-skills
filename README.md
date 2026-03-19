# My Skills

Custom Claude Code skills for the Stargazer codebase.

## Skills

### [code-review-gang](./code-review-gang/)

Multi-perspective code review swarm. Spawns 15 specialized reviewer agents in parallel — each focused on a different quality dimension — then aggregates findings into one actionable report.

**Reviewers:**

| # | Reviewer | Focus |
|---|---------|-------|
| 1a | Scala Style & Formatting | Banned syntax, naming, imports |
| 1b | Scala 3 Code Quality | Idioms, service patterns, error design |
| 2a | ZIO & Async | Effects, error handling, retry, resources |
| 2b | ZStream | Chunking, backpressure, unbounded collection |
| 2c | ZIO Performance | Blocking, parallelism, caching, fibers |
| 3 | Architecture & Boundaries | Module deps, layer violations |
| 4 | Serialization & Codecs | Custom codecs, runtime-breaking issues |
| 5a | FDB Coding Patterns | Store providers, RecordIO, transactions |
| 5b | FDB Performance | N+1 queries, unbounded scans, tx splitting |
| 6 | Temporal Workflows | Activity attributes, CDC, async endpoints, batch actions |
| 7 | Tapir Server | Auth bypass, handler selection, unconventional patterns |
| 8 | Tapir Client | Base class bypass, error/loading gaps |
| 9 | Laminar & Airstream | Split operators, stream flattening, memory leaks, reactivity |
| 10 | UI & Styling | Tailwind DSL, design system components |
| 11 | scalajs-react | Legacy flagging, Callback correctness, React-Laminar bridge |

**Features:**
- Semantic routing — only spawns relevant reviewers based on file paths (frontend/backend/shared)
- Diff-bound rule — only flags issues on changed lines, not pre-existing code
- Triage tags — `[BLOCKER]` / `[SUGGESTION]` / `[NITPICK]`
- Deduplication and noise filtering in the aggregation step

### [prove](./prove/)

Adversarial verification skill. Spawns prover and disprover agents that argue from opposing sides, then synthesizes a verdict. Enters a combat loop if undecided. Use for verifying code properties, architectural claims, runtime behavior, or any technical assertion.

## Installation

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "skills": [
    "git@github.com:HollandDM/my-skills.git"
  ]
}
```
