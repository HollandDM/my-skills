---
name: prove
description: Prove or disprove claim about code, architecture, behavior, or technical property. Spawns adversarial agents — provers and disprovers — argue from multiple angles, synthesizes verdict. If undecided, enters combat loop where agents attack each other's arguments until resolved. Use when user says "prove", "verify", "does this guarantee", "is it always true that", "can this ever fail", "show me this holds", or asks whether something satisfies property. Works for code properties (null-safety, termination, invariants), architectural claims ("this migration is backward-compatible"), runtime behavior ("this endpoint never takes >5s"), design reasoning ("this approach scales"), or any assertion user wants rigorously examined.
---

# Prove

Adversarial verification orchestrator. Given subject and claim, assemble **verification team** — provers, disprovers, judges — that work together to reach verdict. Judges can interrogate provers and disprovers for detail, team escalates into combat rounds if needed.

Subject can be anything — code, architecture, runtime behavior, design decision, migration plan, config change. Team adapts techniques to subject.

## Workflow

### 1. Identify the target

Extract (or ask for) two things:
- **Subject**: what to analyze. Can be:
  - **Code**: function, module, or code path — read it
  - **Architecture/Design**: system design, data flow, or interaction pattern — explore relevant files
  - **Runtime behavior**: how system behaves in production — may need trace/log evidence
  - **Process/Config**: migration, deployment, config change — read relevant artifacts
- **Claim**: what to prove or disprove. Restate precisely before proceeding — ambiguous claims produce useless proofs. If user's phrasing is vague, propose precise formulation and use **AskUserQuestion** tool to confirm.

Example restatements:
- "it never crashes" → "for all valid inputs conforming to type signature, function returns normally without throwing"
- "it's sorted" → "returned list `xs` satisfies `xs(i) <= xs(i+1)` for all `0 <= i < xs.length - 1`"
- "this migration is safe" → "applying this migration on database with existing data will not drop columns still read by current deployed version"
- "this scales" → "time complexity of this operation is O(n log n) or better, and it does not hold locks across async boundaries"

### 2. Spawn the initial round

#### Create the verification team

Before spawning agents, create team for this round using **TeamCreate**:

```
TeamCreate: { team_name: "prove-round-<N>", description: "Verification team for: <claim summary>" }
```

All agents in this round join this team via `team_name` parameter on Agent tool. **Orchestrator is team lead**.

#### Team groups and communication rules

Team has three groups with distinct communication rules:

| Group | Members | Can SendMessage to | Purpose |
|-------|---------|-------------------|---------|
| **Provers** | Prover-A, Prover-B, Reinforcement (if prover) | Fellow provers only | Collaborate to build strongest proof. Help each other fill gaps, share evidence, strengthen arguments. |
| **Disprovers** | Disprover-A, Disprover-B, Disprover-C, Reinforcement (if disprover) | Fellow disprovers only | Collaborate to find strongest counterexample. Help each other identify weaknesses, share attack angles. |
| **Judges** | Judge-1, Judge-2, ... | Any prover or disprover | Interrogate both sides for clarification before delivering verdict. |

**Cross-group rules**:
- Provers MUST NOT communicate with disprovers (and vice versa) — adversaries
- Judges can `SendMessage` any prover or disprover to ask for detail
- Provers/disprovers respond to judge questions via `SendMessage`
- Vibe check agent reports to **team lead** (orchestrator), not to teammates

#### Spawn order

1. **In single turn**, spawn all 6 agents as **teammates** in team. Each agent gets `name` and `team_name`:
   - 2 provers (named `Prover-A`, `Prover-B`)
   - 3 disprovers (named `Disprover-A`, `Disprover-B`, `Disprover-C`)
   - 1 vibe check agent (lighter model, named `Vibe-Check`)

2. **Listen for vibe check report.** Vibe checker uses `SendMessage` to report verdict to team lead. Uses lighter model, so arrives before main agents finish. When team lead receives report, immediately spawn **1 reinforcement agent** (named `Reinforcement`) into same team based on verdict:
   - If vibe says `LIKELY TRUE` → spawn 1 additional prover (named `Reinforcement`)
   - If vibe says `LIKELY FALSE` → spawn 1 additional disprover (named `Reinforcement`)

3. **Collect all results.** Wait for all team members (provers, disprovers, reinforcement) to complete before judging. Teammates remain alive — judges communicate directly via `SendMessage`.

#### Agent counts: disprover advantage

Users naturally phrase claims they believe are true, creating positivity bias. To counter this, **always spawn 1 more disprover than prover**. Default starting lineup: **2 provers + 3 disprovers + 1 vibe check agent** (6 agents total, plus 1 reinforcement after vibe check). Asymmetry forces claim to survive stronger scrutiny — if it holds, confidence is higher.

#### Focus limit: 2 vectors per agent max

Each prover/disprover focuses on **at most 2 proof/attack vectors**. Keeps agents fast and focused. Spawn more agents for more coverage rather than overloading existing ones. State 2 vectors explicitly in each agent's prompt.

#### Vibe check agent (fast scout)

Spawn vibe check agent as teammate using lesser model, lesser reasoning effort, or both (e.g., `model: "haiku"`). Sole job: quickly assess whether claim is more likely true or false and **use `SendMessage` to report verdict to team lead** (orchestrator). Does NOT communicate with other teammates — only with team lead.

Vibe checker finishes early. Sends verdict to team lead via `SendMessage`, then goes idle. **Team lead reads verdict and spawns reinforcement agent** into team — reinforcing whichever side vibe check suggests is weaker. Happens while main provers/disprovers still working.

**Important**: Vibe check is NOT proof — it's fast heuristic for team lead to decide where to allocate reinforcement. Verdict does not count toward judge tally. Judges ignore vibe check result when evaluating arguments. Reinforcement agent provides **supporting evidence**, not formal proof — label accordingly.

Only **1 vibe check agent per round**.

#### Reinforcement agent vector selection

Spawn reinforcement agent into team as soon as vibe check returns. Must use **fresh angle** not already assigned to other agents in this round.
To select angle:

1. List all vectors already assigned to agents of same role (provers or disprovers)
2. Pick vector from claim-type table below NOT in that list
3. If all listed vectors taken, use complementary technique: "independent verification via alternative reasoning path" — re-derive conclusion using fundamentally different approach than any existing agent

Reinforcement agent is **supporting evidence** agent, not formal prover. Pursue angle quickly and provide additional weight, not standalone proof. Label output as "Reinforcement" so judges can weight appropriately.

**Vibe check prompt template**:
```
You are the Vibe Check agent — a fast scout reporting directly to the team lead.

Do a quick, shallow assessment of whether this claim is more likely true or false. Do NOT do rigorous proof or deep code analysis. Do NOT communicate with other teammates — you report only to the team lead.

After your assessment, use SendMessage to report your verdict to the team lead:

SendMessage:
  to: "<team-lead-name>"
  message: "Vibe check complete. Verdict: <LIKELY TRUE / LIKELY FALSE>. Rationale: <1-2 sentences>"
  summary: "Vibe check: <LIKELY TRUE / LIKELY FALSE>"

The team lead will use your report to decide where to deploy reinforcement.

Subject:
<subject>

Claim:
<claim>
```

#### Assigning angles

Give each agent distinct focus to avoid duplicate work. Pick angles based on subject:

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

Adapt as needed — key is each agent has distinct angle, limited to 2 vectors, stated in prompt.

**Agent spawn parameters**: `team_name: "prove-round-<N>"`, `name: "<agent-name>"`, `description: "<agent-name>"`

**Agent prompt template**:
```
You are <Prover/Disprover> <letter>. Read the file <this-skill-path>/agents/<prover/disprover>.md for your instructions.

You are a member of a verification team. Use SendMessage for ALL communication.

YOUR GROUP (<provers/disprovers>): <list of teammate names in the same group>
You can SendMessage anyone in your group to collaborate — share evidence, ask for help, or strengthen each other's arguments. Do NOT communicate with the opposing group.

TEAM LEAD: <team-lead-name>
When your argument is complete, use SendMessage to report your full argument to the team lead.

JUDGES will join later and may SendMessage you to ask for clarification about your logic path. Respond via SendMessage with precise, concise answers.

Your assigned vectors (focus ONLY on these, max 2):
1. <specific technique or focus area>
2. <specific technique or focus area> (if applicable)

Subject under analysis:
<subject — code, file paths, architecture description, etc.>

Claim to <prove/prove FALSE>:
<claim>

When you finish your argument, SendMessage it to the team lead:
SendMessage:
  to: "<team-lead-name>"
  message: "<your full argument with logic path>"
  summary: "<Prover/Disprover> <letter> argument complete"
```

### 3. Judge the round (team evaluation)

After all team members in round return, spawn **judges into same team**. Judges evaluate arguments and can **directly interrogate** provers/disprovers via `SendMessage` before delivering verdict. Do NOT decide verdict yourself — team decides.

#### Judge agents

Spawn **ceil((provers + disprovers) / 2) judges** into team. For default lineup of 2 provers + 3 disprovers + 1 reinforcement = 6 arguers, that's **3 judges**. Name them `Judge-1`, `Judge-2`, `Judge-3`, etc. Each judge gets:
- All prover and disprover logic paths from current round
- Precise claim statement
- **Exactly 1 decision vector** — specific lens through which to evaluate (each judge gets different one)
- **Names of all prover/disprover team members** — so they can `SendMessage` directly

Judges handle own Q&A — use `SendMessage` to ask provers/disprovers questions and receive answers directly. Orchestrator does NOT relay messages. Once judge has all needed info, delivers final verdict.

**Decision vectors for judges** (assign one per judge, pick based on claim type):
- **Logical soundness**: Are reasoning steps valid? Do conclusions follow from premises?
- **Evidence completeness**: Are there gaps in code coverage, untested paths, or missing traces?
- **Counterexample validity**: If disprover found counterexample, is it actually reachable/reproducible?
- **Assumption audit**: Are assumptions stated by provers actually enforced by system?
- **Scope coverage**: Does winning argument address ALL cases, or only subset?

**Judge spawn parameters**: `team_name: "prove-round-<N>"`, `name: "Judge-<N>"`, `description: "Judge-<N>"`

**Judge prompt template**:
```
You are Judge <N>. Read the file <this-skill-path>/agents/judge.md for your instructions.

You are part of a verification team. Use SendMessage for ALL communication.
TEAM LEAD: <team-lead-name>
The provers and disprovers are your teammates — you can use SendMessage to ask any of them follow-up questions directly, and they will respond via SendMessage.

Your decision vector (evaluate ONLY through this lens): <one specific vector>

Claim:
<claim>

Subject:
<subject>

=== PROVER GROUP (you can SendMessage to any of these) ===
<list prover names: Prover-A, Prover-B, Reinforcement (if prover)>

=== DISPROVER GROUP (you can SendMessage to any of these) ===
<list disprover names: Disprover-A, Disprover-B, Disprover-C, Reinforcement (if disprover)>

=== PROVER ARGUMENTS ===
<all prover logic paths from this round, each labeled with the agent name>

=== DISPROVER ARGUMENTS ===
<all disprover logic paths from this round, each labeled with the agent name>

Evaluate the arguments through your lens. If any argument has a gap or unclear step that affects your verdict, use SendMessage to ask the specific team member for clarification — do not guess. You get at most 3 questions across at most 1 round of follow-ups.

After you have all the information you need, SendMessage your final verdict to the team lead:
- Verdict: PROVEN / DISPROVEN / UNDECIDED
- Rationale: 2-3 sentences explaining your decision through your assigned lens
- Winner (if not UNDECIDED): which specific agent's argument was most convincing
```

#### Tallying the verdict

Collect all judge verdicts. Round result requires **more than 50% agreement**:
- If >50% say `PROVEN` → round result is **PROVEN**
- If >50% say `DISPROVEN` → round result is **DISPROVEN**
- Otherwise (no majority, or majority `UNDECIDED`) → round result is **UNDECIDED**

Regardless of result (PROVEN, DISPROVEN, or UNDECIDED), go to step 4 (ask user what to do next). User always gets final say — may want more context or another round even if judges reached verdict.

### 4. Ask user for next action

After every round, present result and use **AskUserQuestion** tool to let user decide next action. User always has final say — even if judges reached clear verdict, user may want more scrutiny.

Use AskUserQuestion with following question text:

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
1. **Accept** — accept this verdict as final result (go to step 6)
2. **More context** — provide additional information to refine claim, then run new prove/disprove round
3. **Battle round** — let strongest arguments fight each other directly
4. **End** — stop here without verdict
```

User MUST choose one option. Handle each:

#### Option 1: Accept the verdict

If user accepts, go to step 6 (present verdict). Use current round's judge majority as final verdict. If current round was UNDECIDED, present as UNDECIDED with both sides' arguments.

#### Option 2: More context → new prove/disprove round

If user provides more context:
1. **Refine claim statement** based on new information. Use **AskUserQuestion** tool to show refined claim and confirm before proceeding.
2. **Create new team** (`prove-round-<N>`) and spawn fresh **prove/disprove round** (same structure as step 2 — provers, disprovers, vibe check agent, reinforcement agent). Use refined claim.
3. Judge round (step 3).

#### Option 3: Battle round

Create **new team** for battle round (`prove-battle-<N>`) and spawn targeted counter-agents attacking specific arguments from previous round. **No vibe check agent in battle rounds** — only direct argument combat.

**Identifying "strong" arguments**: Argument is strong if at least one judge cited it as convincing in rationale. If no judge cited specific argument, not strong enough for battle agent. Select at most **top 2** strongest arguments from each side (prover and disprover) — those cited by most judges.

**Bidirectional attacks**: Battle rounds attack in BOTH directions:
- For each strong prover argument, spawn disprover to attack it
- For each strong disprover argument, spawn prover to address it

Battle agents must use **different vectors** than agents in previous round used on same argument. If round-1 disprover attacked with "boundary analysis + race condition", battle disprover must use different techniques (e.g., "assumption violation + type escape").

For each strong prover argument `pA`, spawn **disprover** into battle team (named `Battle-Disprover-<N>`):
```
You are Battle Disprover <N>. Read the file <this-skill-path>/agents/disprover.md for your instructions.

You are a member of a verification team. Use SendMessage for ALL communication.
YOUR GROUP (disprovers): <list fellow battle-disprover names>
TEAM LEAD: <team-lead-name>
You can SendMessage fellow disprovers to collaborate. Judges may also SendMessage you for clarification.

Your specific target: Disprove the following argument from a Prover.
Focus on at most 2 attack vectors against this argument.

The Prover's argument:
<paste pA's full logic path>

Original claim:
<claim>

Subject:
<subject>

Your job: Find flaw in THIS argument — step that doesn't follow, assumption that's wrong, case it missed. Do not construct general disproof; attack THIS specific logic path.

When done, SendMessage your full argument to the team lead.
```

For each strong disprover argument `dA`, spawn **prover** into battle team (named `Battle-Prover-<N>`):
```
You are Battle Prover <N>. Read the file <this-skill-path>/agents/prover.md for your instructions.

You are a member of a verification team. Use SendMessage for ALL communication.
YOUR GROUP (provers): <list fellow battle-prover names>
TEAM LEAD: <team-lead-name>
You can SendMessage fellow provers to collaborate. Judges may also SendMessage you for clarification.

Your specific target: Address the following counterexample/attack from a Disprover.
Focus on at most 2 proof vectors to defeat this argument.

The Disprover's argument:
<paste dA's full logic path>

Original claim:
<claim>

Subject:
<subject>

Your job: Show why THIS attack fails — counterexample is invalid, scenario is unreachable, assumption is wrong. Do not construct general proof; defeat THIS specific attack.

When done, SendMessage your full argument to the team lead.
```

After battle round completes, judge results (step 3 — spawn judges into battle team). Then go to step 4 (ask user) regardless of verdict — user always gets final say.

#### Team lifecycle

Each round gets own team. When round completes and user chooses next action, **shut down current team** by sending shutdown request to all teammates (`SendMessage` with `type: "shutdown_request"` to `"*"`). Then create fresh team for next round if needed.

#### Option 4: End the session

If user chooses to end, **stop immediately**. Present whatever information gathered so far without forcing verdict. Use format:

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

Do not draw conclusions or pick winner. User chose to end — respect that.

### 5. Round type rules (summary)

| Round type | When | Vibe check? | Agents |
|-----------|------|-------------|--------|
| **Prove/disprove** | Round 1 (always), or after user provides more context | Yes | Provers + disprovers + vibe + reinforcement → judges with Q&A |
| **Battle** | User chooses battle after UNDECIDED | No | Targeted counter-agents → judges with Q&A |

Every round (regardless of type) ends with **judge agents** evaluating arguments — with optional follow-up Q&A to team members — before deciding result.

### Judge rotation across rounds

Spawn **fresh judges** per round — no reuse. Assign **different decision vectors** than previous round's judges used, when possible. Prevents anchoring bias, ensures fresh perspectives per round.

If more rounds than available vectors, acceptable to reuse vectors — but never reuse same judge agent instance.

### Round count guidance

After **3 rounds** with UNDECIDED result, add note to user prompt:

> "This claim has been UNDECIDED for 3 rounds. Consider: (a) accepting UNDECIDED as final result — claim may be genuinely ambiguous, (b) narrowing claim to more provable subset, or (c) providing additional context that could break deadlock."

No hard limit on rounds — user always controls when to stop.

### 6. Present the verdict

Verdict MUST include **full logic path** from winning agent — primary output user cares about. Show chain of reasoning, not just conclusion.

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