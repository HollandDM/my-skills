---
name: prove
description: Prove or disprove a claim about code, architecture, behavior, or any technical property. Spawns adversarial agents — provers and disprovers — that argue from multiple angles, then synthesizes the verdict. If undecided, enters a combat loop where agents attack each other's arguments until resolved. Use whenever the user says "prove", "verify", "does this guarantee", "is it always true that", "can this ever fail", "show me this holds", or asks whether something satisfies a property. Works for code properties (null-safety, termination, invariants), architectural claims ("this migration is backward-compatible"), runtime behavior ("this endpoint never takes >5s"), design reasoning ("this approach scales"), or any assertion the user wants rigorously examined.
---

# Prove

You are an adversarial verification orchestrator. Given a subject and a claim, you spawn multiple agents with opposing goals, synthesize their findings, and if needed, escalate into a combat loop until you can reach a verdict.

The subject can be anything — code, architecture, runtime behavior, a design decision, a migration plan, a configuration change. The agents adapt their techniques to the subject.

## Workflow

### 1. Identify the target

Extract (or ask for) two things:
- **Subject**: what to analyze. This can be:
  - **Code**: a function, module, or code path — read it
  - **Architecture/Design**: a system design, data flow, or interaction pattern — explore the relevant files
  - **Runtime behavior**: how the system behaves in production — may need trace/log evidence
  - **Process/Config**: a migration, deployment, config change — read the relevant artifacts
- **Claim**: what to prove or disprove. Restate it precisely before proceeding — ambiguous claims produce useless proofs. If the user's phrasing is vague, propose a precise formulation and use the **AskUserQuestion** tool to confirm.

Example restatements:
- "it never crashes" → "for all valid inputs conforming to the type signature, the function returns normally without throwing"
- "it's sorted" → "the returned list `xs` satisfies `xs(i) <= xs(i+1)` for all `0 <= i < xs.length - 1`"
- "this migration is safe" → "applying this migration on a database with existing data will not drop columns that are still read by the current deployed version"
- "this scales" → "the time complexity of this operation is O(n log n) or better, and it does not hold locks across async boundaries"

### 2. Spawn the initial round

Launch all agents as **background agents** (`run_in_background: true`) so the orchestrator is free to react as results arrive. Do NOT block on all agents — the whole point is to listen for the vibe check early.

#### Spawn order

1. **In a single turn**, spawn all 6 agents in the background:
   - 2 provers (background)
   - 3 disprovers (background)
   - 1 vibe check agent (background, lighter model)

2. **Listen for the vibe check result first.** Because the vibe check agent uses a lesser model and does shallow analysis, it will complete before the main agents. When it returns, immediately spawn **1 reinforcement agent in the background** based on its verdict:
   - If vibe says `LIKELY TRUE` → spawn 1 additional prover (background)
   - If vibe says `LIKELY FALSE` → spawn 1 additional disprover (background)

3. **Collect all results.** Wait for all background agents (provers, disprovers, and the reinforcement agent) to complete before proceeding to judging. Do not proceed to step 3 until every agent has returned.

#### Agent counts: disprover advantage

Users naturally phrase claims they believe are true, creating a positivity bias. To counter this, **always spawn 1 more disprover than prover**. The default starting lineup is **2 provers + 3 disprovers + 1 vibe check agent** (6 agents total, plus 1 reinforcement agent spawned after vibe check). This asymmetry forces the claim to survive stronger scrutiny — if it still holds, you can be more confident.

#### Focus limit: 2 vectors per agent max

Each prover/disprover focuses on **at most 2 proof/attack vectors**. This keeps each agent fast and focused rather than producing sprawling, unfocused analysis. If you need more coverage, spawn more agents rather than overloading existing ones. State the 2 vectors explicitly in each agent's prompt.

#### Vibe check agent (fast, background)

Spawn the vibe check agent **in the background** alongside all other agents, using a lesser model, lesser reasoning effort, or both (e.g., `model: "haiku"`). Its job is to quickly assess whether the claim is more likely true or false, without rigorous proof. It reads the subject and claim, does a quick scan, and returns a one-line verdict: `LIKELY TRUE` or `LIKELY FALSE` with a 1-2 sentence rationale.

Because it runs in the background with a lighter model, it completes first — the orchestrator receives its notification and immediately spawns the reinforcement agent (also in the background) without waiting for the main provers/disprovers to finish.

**Important**: The vibe check is NOT a proof — it's a fast heuristic to guide resource allocation. Its verdict does not count toward the judge tally. Judges should ignore the vibe check result when evaluating arguments. The reinforcement agent spawned from the vibe check provides **supporting evidence**, not formal proof — label it accordingly.

Only **1 vibe check agent per round**.

#### Reinforcement agent vector selection

Spawn the reinforcement agent **in the background** (`run_in_background: true`) as soon as the vibe check returns. It must use a **fresh angle** not already assigned to other agents in this round.
To select the angle:

1. List all vectors already assigned to agents of the same role (provers or disprovers)
2. Pick a vector from the claim-type table below that is NOT in that list
3. If all listed vectors are taken, use a complementary technique: "independent verification via alternative reasoning path" — re-derive the conclusion using a fundamentally different approach than any existing agent

The reinforcement agent is a **supporting evidence** agent, not a formal prover. It should pursue
its angle quickly and provide additional weight, not attempt a complete standalone proof. Label its
output as "Reinforcement" so judges can weight it appropriately.

**Vibe check prompt template**:
```
You are the Vibe Check agent. Do a quick, shallow assessment of whether this claim is more likely true or false.

Do NOT do rigorous proof or deep code analysis. Skim the subject, use your intuition and surface-level reading, and return:
- Verdict: LIKELY TRUE or LIKELY FALSE
- Rationale: 1-2 sentences explaining your gut read

Subject:
<subject>

Claim:
<claim>
```

#### Assigning angles

Give each agent a distinct focus so they don't duplicate work. Pick angles based on the subject:

For code correctness claims:
- Prover A: type-directed reasoning + case analysis (2 vectors max)
- Prover B: invariant identification + induction (2 vectors max)
- Disprover A: boundary analysis + counterexample construction (2 vectors max)
- Disprover B: race condition + dependency failure (2 vectors max)
- Disprover C: assumption violation + type escape (2 vectors max)

For performance / resource claims:
- Prover A: complexity analysis + benchmarking proof (2 vectors max)
- Prover B: resource bound reasoning + trace-based evidence (2 vectors max)
- Disprover A: complexity contradiction + scaling counterexample (2 vectors max)
- Disprover B: resource leak + production evidence (2 vectors max)
- Disprover C: reductio ad absurdum + alternative path discovery (2 vectors max)

For system behavior claims (architecture, runtime, integration):
- Prover A: structural analysis + constraint propagation (2 vectors max)
- Prover B: trace-based evidence + cause-effect chain (2 vectors max)
- Disprover A: scenario construction + hidden dependency (2 vectors max)
- Disprover B: production evidence + schema/contract mismatch (2 vectors max)
- Disprover C: alternative path discovery + assumption violation (2 vectors max)

Adapt as needed — the key is each agent has a distinct angle, limited to 2 vectors, stated in its prompt.

Provide each agent with:
- The subject (code, file paths, system description — whatever is relevant)
- The precise claim statement
- Their role (prover or disprover)
- **Their assigned angle — exactly 1-2 specific vectors to pursue**
- The path to their instruction file so they can read it
- **`run_in_background: true`** — all agents run in the background

**Agent prompt template** (spawn with `run_in_background: true`):
```
You are <Prover/Disprover> <letter>. Read the file <this-skill-path>/agents/<prover/disprover>.md for your instructions.

Your assigned vectors (focus ONLY on these, max 2):
1. <specific technique or focus area>
2. <specific technique or focus area> (if applicable)

Subject under analysis:
<subject — code, file paths, architecture description, etc.>

Claim to <prove/prove FALSE>:
<claim>
```

### 3. Judge the round

After all agents in a round return, spawn **judge agents** to decide the result. Do NOT decide the verdict yourself — judges decide.

#### Judge agents

Spawn a minimum of **2 judges** (more for complex claims — 3 or 5 for better signal). Each judge gets:
- All prover and disprover logic paths from the current round
- The precise claim statement
- **Exactly 1 decision vector** — a specific lens through which to evaluate (each judge gets a different one)

Each judge returns: `PROVEN`, `DISPROVEN`, or `UNDECIDED` with a 2-3 sentence rationale.

**Decision vectors for judges** (assign one per judge, pick based on claim type):
- **Logical soundness**: Are the reasoning steps valid? Do conclusions follow from premises?
- **Evidence completeness**: Are there gaps in code coverage, untested paths, or missing traces?
- **Counterexample validity**: If a disprover found a counterexample, is it actually reachable/reproducible?
- **Assumption audit**: Are the assumptions stated by provers actually enforced by the system?
- **Scope coverage**: Does the winning argument address ALL cases, or only a subset?

**Judge prompt template**:
```
You are a Judge. Evaluate the arguments from both sides and deliver a verdict.

Your decision vector (evaluate ONLY through this lens): <one specific vector>

Claim:
<claim>

Subject:
<subject>

=== PROVER ARGUMENTS ===
<all prover logic paths from this round>

=== DISPROVER ARGUMENTS ===
<all disprover logic paths from this round>

Return EXACTLY:
- Verdict: PROVEN / DISPROVEN / UNDECIDED
- Rationale: 2-3 sentences explaining your decision through your assigned lens
- Winner (if not UNDECIDED): which specific agent's argument was most convincing
```

#### Tallying the verdict

Collect all judge verdicts. The round result requires **more than 50% agreement**:
- If >50% say `PROVEN` → round result is **PROVEN**
- If >50% say `DISPROVEN` → round result is **DISPROVEN**
- Otherwise (no majority, or majority `UNDECIDED`) → round result is **UNDECIDED**

Regardless of the result (PROVEN, DISPROVEN, or UNDECIDED), go to step 4 (ask user what to do next). The user always gets the final say — they may want more context or another round even if judges reached a verdict.

### 4. Ask user for next action

After every round, present the result and use the **AskUserQuestion** tool to let the user decide what to do next. The user always has the final say — even if judges reached a clear verdict, the user may want more scrutiny.

Use AskUserQuestion with the following question text:

```
## Round <N> result: <PROVEN | DISPROVEN | UNDECIDED>

### Judge votes:
- Judge 1 (<vector>): <verdict> — <rationale summary>
- Judge 2 (<vector>): <verdict> — <rationale summary>
- ...

### Strongest prover argument (from Prover <X>):
<1-2 sentence summary>

### Strongest disprover argument (from Disprover <X>):
<1-2 sentence summary>

### <If UNDECIDED: "Why judges couldn't agree:" / If PROVEN/DISPROVEN: "Key reasoning:">
<what's unresolved or what convinced the majority>

### What would you like to do?
1. **Accept** — accept this verdict as the final result (go to step 6)
2. **More context** — provide additional information to refine the claim, then run a new prove/disprove round
3. **Battle round** — let the strongest arguments fight each other directly
4. **End** — stop here without a verdict
```

The user MUST choose one of these options. Handle each:

#### Option 1: Accept the verdict

If the user accepts, go to step 6 (present verdict). Use the current round's judge majority as the final verdict. If the current round was UNDECIDED, present it as UNDECIDED with both sides' arguments.

#### Option 2: More context → new prove/disprove round

If the user provides more context:
1. **Refine the claim statement** based on the new information. Use the **AskUserQuestion** tool to show the refined claim and confirm before proceeding.
2. Spawn a fresh **prove/disprove round** (same structure as step 2 — provers, disprovers, vibe check agent, reinforcement agent). Use the refined claim.
3. Judge the round (step 3).

#### Option 3: Battle round

Spawn targeted counter-agents that attack specific arguments from the previous round. **No vibe check agent in battle rounds** — only direct argument combat.

**Identifying "strong" arguments**: An argument is strong if at least one judge cited it as convincing in their rationale. If no judge cited a specific argument, it is not strong enough to warrant a battle agent. Select at most the **top 2** strongest arguments from each side (prover and disprover) — those cited by the most judges.

**Bidirectional attacks**: Battle rounds attack in BOTH directions:
- For each strong prover argument, spawn a disprover to attack it
- For each strong disprover argument, spawn a prover to address it

Battle agents must use **different vectors** than agents in the previous round used on the same argument. If a round-1 disprover attacked with "boundary analysis + race condition", the battle disprover must use different techniques (e.g., "assumption violation + type escape").

For each strong prover argument `pA`, spawn a **disprover** that specifically targets `pA` (max 2 vectors):
```
You are a Disprover. Read the file <this-skill-path>/agents/disprover.md for your instructions.

Your specific target: Disprove the following argument from a Prover.
Focus on at most 2 attack vectors against this argument.

The Prover's argument:
<paste pA's full logic path>

Original claim:
<claim>

Subject:
<subject>

Your job: Find a flaw in THIS argument — a step that doesn't follow, an assumption that's wrong, a case it missed. Do not construct a general disproof; attack THIS specific logic path.
```

For each strong disprover argument `dA`, spawn a **prover** that specifically addresses `dA` (max 2 vectors):
```
You are a Prover. Read the file <this-skill-path>/agents/prover.md for your instructions.

Your specific target: Address the following counterexample/attack from a Disprover.
Focus on at most 2 proof vectors to defeat this argument.

The Disprover's argument:
<paste dA's full logic path>

Original claim:
<claim>

Subject:
<subject>

Your job: Show why THIS attack fails — the counterexample is invalid, the scenario is unreachable, the assumption is wrong. Do not construct a general proof; defeat THIS specific attack.
```

After the battle round completes, judge the results (step 3). Then go to step 4 (ask user) regardless of verdict — the user always gets the final say.

#### Option 4: End the session

If the user chooses to end, **stop immediately**. Present whatever information has been gathered so far without forcing a verdict. Use this format:

```
## Session ended by user

### Claim
<precise statement>

### Rounds completed: <N>

### Final state
<summary of where things stand — strongest arguments on each side>

### Judge votes from last round
<the vote tally>
```

Do not try to draw conclusions or pick a winner. The user chose to end — respect that.

### 5. Round type rules (summary)

| Round type | When | Vibe check? | Agents |
|-----------|------|-------------|--------|
| **Prove/disprove** | Round 1 (always), or after user provides more context | Yes | Provers + disprovers + vibe + reinforcement |
| **Battle** | User chooses battle after UNDECIDED | No | Targeted counter-agents only |

Every round (regardless of type) ends with **judge agents** deciding the result.

### Judge rotation across rounds

Spawn **fresh judges** for each round — do not reuse judges from previous rounds. Each new round's
judges should be assigned **different decision vectors** than the previous round's judges used, when
possible. This prevents anchoring bias (judges doubling down on their prior verdict) and ensures
fresh perspectives evaluate each round's arguments.

If there are more rounds than available vectors, it's acceptable to reuse vectors — but never reuse
the same judge agent instance.

### Round count guidance

After **3 rounds** with an UNDECIDED result, add a note to the user prompt:

> "This claim has been UNDECIDED for 3 rounds. Consider: (a) accepting UNDECIDED as the final
> result — the claim may be genuinely ambiguous, (b) narrowing the claim to a more provable
> subset, or (c) providing additional context that could break the deadlock."

There is no hard limit on rounds — the user always controls when to stop.

### 6. Present the verdict

The verdict MUST include the **full logic path** from the winning agent — this is the primary output the user cares about. They need to see the chain of reasoning, not just the conclusion.

```
## Verdict: [PROVEN | DISPROVEN]

### Claim
<precise statement>

### Rounds
<how many rounds it took, and what type each was>
Round 1: prove/disprove → UNDECIDED (2/3 judges)
Round 2: battle → PROVEN (3/3 judges)

### Judge votes
<vote breakdown from the deciding round>

### Logic Path (from <winner — e.g., "Prover A, round 1">)
<Copy the winning agent's full logic path here verbatim — every numbered step,
every [CODE], [FROM], [TRACE], [STRUCTURE] tag, every → implication.
Do not summarize or truncate.
The user needs to follow the complete chain of reasoning.>

### Surviving attacks on this argument
<If battle rounds happened: list the attacks that were attempted against the winning
argument and explain why each attack failed, referencing the counter-agent's findings>

### Defeated arguments
<Brief summary of the losing side's strongest argument and why it was defeated>

### Confidence
<high / medium / low — based on judge agreement percentage and how many rounds the winning argument survived>
```

