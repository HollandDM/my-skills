# My Skills

Custom coding-agent skills for software design and the Stargazer codebase. Stepwise supports both Claude Code and Codex; the other plugins currently use the Claude Code marketplace.

## Skills

### [stargazer-review-gang](./stargazer-review-gang/) `v1.1.0`

Multi-perspective code review swarm. A fast router agent reads each file's diff to decide which reviewers are relevant, then spawns up to 10 specialized reviewer agents in parallel — each focused on a different quality dimension — and aggregates findings into one actionable report.

**Reviewers:**

| # | Reviewer | Focus |
|---|---------|-------|
| 1 | Scala Quality | Banned syntax, Scala 3 idioms, type design, opaque types, given/using, performance |
| 2 | ZIO Patterns, Perf & Streams | Effects, error handling, retry, parallelism, fibers, caching, ZStream chunking/backpressure |
| 3 | Architecture & Serialization | Module deps, layer violations, code placement, custom codecs, runtime-breaking issues |
| 5 | FDB Patterns & Performance | Store providers, RecordIO, transactions, N+1 queries, unbounded scans, tx splitting |
| 6 | Temporal Workflows | Activity attributes, CDC, async endpoints, batch actions, pattern selection |
| 7 | Tapir Endpoints | Server auth/security, client error handling, loading state, base class bypass |
| 8 | Frontend | Laminar/Airstream reactivity, split operators, memory leaks, Tailwind DSL, design system |
| 9 | scalajs-react | Legacy flagging, Callback correctness, React-Laminar bridge, lifecycle cleanup |
| 10 | Observability & Logging | Structured logging, metrics, tracing, sensitive data, action logging |
| 11 | Testing Quality | Assertions, test isolation, cleanup, flakiness, shared state, negative tests |

**Features:**
- Content-aware routing — a fast router agent reads diffs and spawns only relevant reviewers
- Adaptive depth — model strength scales with PR size (lite=fast-lightweight, standard=default, deep=high-capability)
- Confidence scoring — every finding self-assessed 0–100, filtered at threshold 70
- Built-in validation — aggregators verify each blocker/suggestion against actual code before reporting
- Git blame context — authorship and recency data for smarter false positive filtering
- Change context — optional user-provided intent ("refactor", "bugfix") shapes reviewer focus
- Explicit false positive categories — concrete negative constraints reduce noise
- Diff-bound rule — only flags issues on changed lines, not pre-existing code
- Triage tags — `[BLOCKER]` / `[SUGGESTION]` / `[NITPICK]`
- Deduplication and noise filtering in the aggregation step

### [prove](./prove/)

Adversarial verification skill. Spawns prover and disprover agents that argue from opposing sides, then synthesizes a verdict. Enters a combat loop if undecided. Use for verifying code properties, architectural claims, runtime behavior, or any technical assertion.

### [stargazer-batch-dev](./stargazer-batch-dev/) `v1.0.0`

Batch-parallel plan execution for the Stargazer codebase. Lighter alternative to `stargazer-subagent-dev` — groups independent tasks into batches, spawns one advisor (high-capability) + one implementer (balanced-capability) per task per batch, loops autonomously through all batches without stopping. Team lead handles all `./mill` commands after each batch completes.

**Key behaviors:**
- No user questions (except once for plan file path)
- Implementers communicate with advisor for complex problems
- Compile errors fed back to implementers — team lead never touches code
- Reformat + batch-done commit after each clean compile

### [constructing-software-stepwise](./constructing-software-stepwise/)

Contract-based stepwise refinement for complex stateful designs. Interviewed mode reviews one node at a time; explicit auto-approval advances coherent batches of related nodes, records agent decisions, and continues to the agreed completion boundary. A Python CLI maintains the design ledger, generated views, dependency invalidation, and evidence records. The `html` command exports a standalone reader with a searchable tree, linked pseudocode and contracts, and an interactive diagram. Mode-specific procedures and ledger details load only when needed.

### [mixed-agent-sdd](./mixed-agent-sdd/)

Claude Code plugin for executing a complete implementation plan through one controller and a mixed Claude/Codex/OpenCode roster. It requires OpenCode CLI and the OpenAI Codex Claude plugin, balances implementers across backends, reviews and repairs complete batches, and hands final cross-vendor findings to a human.

## Installation

### Codex — Stepwise

From a local checkout of this repository, register its marketplace and install Stepwise:

```sh
codex plugin marketplace add .
codex plugin add constructing-software-stepwise@HollandDM-Skills
```

Start a new Codex session and ask it to use Stepwise, for example:

```text
Use Stepwise to design this system. Auto-approve your recommendations and refine in batches.
```

The Codex catalog is `.agents/plugins/marketplace.json`, and the plugin manifest is `constructing-software-stepwise/.codex-plugin/plugin.json`. Both Codex and Claude Code load the same skill, CLI, references, and HTML assets.

Once these changes are published to GitHub, users without a local checkout can register the repository with `codex plugin marketplace add HollandDM/my-skills`, then run the same install command. See the [official plugin packaging documentation](https://developers.openai.com/plugins/build/plugins) for marketplace configuration.

### Claude Code

Add the marketplace, then install individual plugins:

```
/plugin marketplace add git@github.com:HollandDM/my-skills.git
/plugin install stargazer-review-gang@HollandDM-Skills
/plugin install stargazer-batch-dev@HollandDM-Skills
/plugin install prove@HollandDM-Skills
/plugin install mixed-agent-sdd@HollandDM-Skills
/plugin install constructing-software-stepwise@HollandDM-Skills
```
