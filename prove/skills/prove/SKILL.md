---
name: prove
description: Prove or disprove claim about code, architecture, behavior, or technical property. Spawns adversarial agents — provers and disprovers — argue from multiple angles, synthesizes verdict. If undecided, enters combat loop where agents attack each other's arguments until resolved. Use when user says "prove", "verify", "does this guarantee", "is it always true that", "can this ever fail", "show me this holds", or asks whether something satisfies property. Works for code properties (null-safety, termination, invariants), architectural claims ("this migration is backward-compatible"), runtime behavior ("this endpoint never takes >5s"), design reasoning ("this approach scales"), or any assertion user wants rigorously examined.
---

# Prove

Adversarial verification orchestrator. Given subject and claim, assemble **verification team** — provers, disprovers, judges — that work together to reach verdict. Judges can interrogate provers and disprovers for detail, team escalates into combat rounds if needed.

Subject can be anything — code, architecture, runtime behavior, design decision, migration plan, config change. Team adapts techniques to subject.

## Session ID prefix (MANDATORY — avoid name conflict across concurrent sessions)

Before creating any team or spawning any agent, compute short session ID once:

```bash
SID=$(git rev-parse --short HEAD 2>/dev/null || printf '%04x' $RANDOM)
```

Prefix **every** team name and agent name in this skill with `${SID}-`. Examples below show literal `<SID>-` placeholder — substitute the real value. Names used between teammates MUST be fully prefixed (e.g. `<SID>-Prover-A`, not `Prover-A`). The team lead name passed to agents is also the prefixed one.

## Workflow

### 1. Identify the target

Extract (or ask for) two things:
- **Subject**: what to analyze. Can be:
  - **Code**: function, module, or code path — read it
  - **Architecture/Design**: system design, data flow, or interaction pattern — explore relevant files
  - **Runtime behavior**: how system behaves in production — may need trace/log evidence
  - **Process/Config**: migration, deployment, config change — read relevant artifacts
- **Claim**: what to prove or disprove. Restate precisely before proceeding — ambiguous claims produce useless proofs. If user's phrasing is vague, propose precise formulation and ask the user to confirm.

Example restatements:
- "it never crashes" → "for all valid inputs conforming to type signature, function returns normally without throwing"
- "it's sorted" → "returned list `xs` satisfies `xs(i) <= xs(i+1)` for all `0 <= i < xs.length - 1`"
- "this migration is safe" → "applying this migration on database with existing data will not drop columns still read by current deployed version"
- "this scales" → "time complexity of this operation is O(n log n) or better, and it does not hold locks across async boundaries"

### 2. Spawn the initial round

#### Create the verification team

Before spawning agents, create a team for this round:

Create a team with a unique name and a description of the claim being verified.

Every agent in this round is spawned into this team. **The orchestrator is the team lead**.

#### Team groups and communication rules

Team has three groups with distinct communication rules:

| Group | Members | Can message | Purpose |
|-------|---------|-------------|---------|
| **Provers** | Prover-A, Prover-B, Reinforcement (if prover) | Fellow provers only | Collaborate to build strongest proof. Help each other fill gaps, share evidence, strengthen arguments. |
| **Disprovers** | Disprover-A, Disprover-B, Disprover-C, Reinforcement (if disprover) | Fellow disprovers only | Collaborate to find strongest counterexample. Help each other identify weaknesses, share attack angles. |
| **Judges** | Judge-1, Judge-2, ... | Any prover or disprover | Interrogate both sides for clarification before delivering verdict. |

**Cross-group rules**:
- Provers MUST NOT communicate with disprovers (and vice versa) — adversaries
- Judges can message any prover or disprover directly to ask for detail
- Provers and disprovers answer judge questions directly
- The vibe check agent reports to the **team lead** (orchestrator), not to teammates

#### Spawn order

1. **In single turn**, spawn all 6 agents as **teammates** in the team (all names prefixed with `<SID>-`):
   - 2 provers (named `<SID>-Prover-A`, `<SID>-Prover-B`)
   - 3 disprovers (named `<SID>-Disprover-A`, `<SID>-Disprover-B`, `<SID>-Disprover-C`)
   - 1 vibe check agent (lighter model, named `<SID>-Vibe-Check`)

2. **Listen for the vibe check report.** The vibe checker reports its verdict directly to the team lead. It uses a lighter model, so this arrives before the main agents finish. When the team lead receives the report, immediately spawn **1 reinforcement agent** (named `<SID>-Reinforcement`) into the same team based on the verdict:
   - If vibe says `LIKELY TRUE` → spawn 1 additional prover (named `<SID>-Reinforcement`)
   - If vibe says `LIKELY FALSE` → spawn 1 additional disprover (named `<SID>-Reinforcement`)

3. **Collect all results.** Wait for all team members (provers, disprovers, reinforcement) to complete before judging. Teammates remain alive — judges communicate with them directly.

#### Agent counts: disprover advantage

Users naturally phrase claims they believe are true, creating positivity bias. To counter this, **always spawn 1 more disprover than prover**. Default starting lineup: **2 provers + 3 disprovers + 1 vibe check agent** (6 agents total, plus 1 reinforcement after vibe check). Asymmetry forces claim to survive stronger scrutiny — if it holds, confidence is higher.

#### Focus limit: 2 vectors per agent max

Each prover/disprover focuses on **at most 2 proof/attack vectors**. Keeps agents fast and focused. Spawn more agents for more coverage rather than overloading existing ones. State 2 vectors explicitly in each agent's prompt.

#### Vibe check agent (fast scout)

Spawn the vibe check agent as a teammate using a lesser model, lesser reasoning level, or both (e.g., a fast, lightweight model). Sole job: quickly assess whether the claim is more likely true or false and **report its verdict directly to the team lead** (orchestrator). Does NOT communicate with other teammates — only with the team lead.

Vibe checker finishes early. Reports its verdict to the team lead, then goes idle. **The team lead reads the verdict and spawns a reinforcement agent** into the team — reinforcing whichever side the vibe check suggests is weaker. This happens while the main provers/disprovers are still working.

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

After your assessment, report your verdict directly to the team lead with:
- Recipient: <team-lead-name>
- Verdict: LIKELY TRUE or LIKELY FALSE with brief rationale
- Summary: "Vibe check: <LIKELY TRUE / LIKELY FALSE>"

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

**When spawning each agent**: place it in the round's team (`<SID>-prove-round-<N>`) and give it the name `<SID>-<agent-name>`.

**Agent prompt template**:
```
You are <Prover/Disprover> <letter>. Read the file <this-skill-path>/agents/<prover/disprover>.md for your instructions.

You are a member of a verification team. Communicate with your teammates directly.

YOUR GROUP (<provers/disprovers>): <list of teammate names in the same group>
You can message anyone in your group to collaborate — share evidence, ask for help, or strengthen each other's arguments. Do NOT communicate with the opposing group.

TEAM LEAD: <team-lead-name>
When your argument is complete, report your full argument directly to the team lead.

JUDGES will join later and may message you to ask for clarification about your logic path. Respond directly with precise, concise answers.

Your assigned vectors (focus ONLY on these, max 2):
1. <specific technique or focus area>
2. <specific technique or focus area> (if applicable)

Subject under analysis:
<subject — code, file paths, architecture description, etc.>

Claim to <prove/prove FALSE>:
<claim>

When you finish your argument, send your full argument and a summary label to the team lead.
```

### 3. Judge the round (team evaluation)

After all team members in the round return, spawn **judges into the same team**. Judges evaluate arguments and can **directly interrogate** provers/disprovers before delivering a verdict. Do NOT decide the verdict yourself — the team decides.

#### Judge agents

Spawn **ceil((provers + disprovers) / 2) judges** into team. For default lineup of 2 provers + 3 disprovers + 1 reinforcement = 6 arguers, that's **3 judges**. Name them `Judge-1`, `Judge-2`, `Judge-3`, etc. Each judge gets:
- All prover and disprover logic paths from current round
- Precise claim statement
- **Exactly 1 decision vector** — specific lens through which to evaluate (each judge gets different one)
- **Names of all prover/disprover team members** — so they can message directly

Judges handle their own Q&A — they message provers/disprovers directly to ask questions and receive answers. The orchestrator does NOT relay messages. Once a judge has all needed info, it delivers its final verdict.

**Decision vectors for judges** (assign one per judge, pick based on claim type):
- **Logical soundness**: Are reasoning steps valid? Do conclusions follow from premises?
- **Evidence completeness**: Are there gaps in code coverage, untested paths, or missing traces?
- **Counterexample validity**: If disprover found counterexample, is it actually reachable/reproducible?
- **Assumption audit**: Are assumptions stated by provers actually enforced by system?
- **Scope coverage**: Does winning argument address ALL cases, or only subset?

**When spawning each judge**: place it in the round's team (`<SID>-prove-round-<N>`) and give it the name `<SID>-Judge-<N>`.

**Judge prompt template**:
```
You are Judge <N>. Read the file <this-skill-path>/agents/judge.md for your instructions.

You are part of a verification team. Communicate with your teammates directly.
TEAM LEAD: <team-lead-name>
The provers and disprovers are your teammates — you can ask any of them follow-up questions directly, and they will respond.

Your decision vector (evaluate ONLY through this lens): <one specific vector>

Claim:
<claim>

Subject:
<subject>

=== PROVER GROUP (you can message any of these) ===
<list prover names: Prover-A, Prover-B, Reinforcement (if prover)>

=== DISPROVER GROUP (you can message any of these) ===
<list disprover names: Disprover-A, Disprover-B, Disprover-C, Reinforcement (if disprover)>

=== PROVER ARGUMENTS ===
<all prover logic paths from this round, each labeled with the agent name>

=== DISPROVER ARGUMENTS ===
<all disprover logic paths from this round, each labeled with the agent name>

Evaluate the arguments through your lens. If any argument has a gap or unclear step that affects your verdict, ask the specific team member directly for clarification — do not guess. You get at most 3 questions across at most 1 round of follow-ups.

After you have all the information you need, report your final verdict to the team lead:
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

After every round, present result and ask the user to decide next action. User always has final say — even if judges reached clear verdict, user may want more scrutiny.

Present options to the user with the following question text:

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
1. **Refine claim statement** based on new information. Ask the user to show refined claim and confirm before proceeding.
2. **Create new team** (`<SID>-prove-round-<N>`) and spawn fresh **prove/disprove round** (same structure as step 2 — provers, disprovers, vibe check agent, reinforcement agent). Use refined claim.
3. Judge round (step 3).

#### Option 3: Battle round

Create **new team** for battle round (`<SID>-prove-battle-<N>`) and spawn targeted counter-agents attacking specific arguments from previous round. **No vibe check agent in battle rounds** — only direct argument combat.

**Identifying "strong" arguments**: Argument is strong if at least one judge cited it as convincing in rationale. If no judge cited specific argument, not strong enough for battle agent. Select at most **top 2** strongest arguments from each side (prover and disprover) — those cited by most judges.

**Bidirectional attacks**: Battle rounds attack in BOTH directions:
- For each strong prover argument, spawn disprover to attack it
- For each strong disprover argument, spawn prover to address it

Battle agents must use **different vectors** than agents in previous round used on same argument. If round-1 disprover attacked with "boundary analysis + race condition", battle disprover must use different techniques (e.g., "assumption violation + type escape").

For each strong prover argument `pA`, spawn **disprover** into battle team (named `<SID>-Battle-Disprover-<N>`):
```
You are Battle Disprover <N>. Read the file <this-skill-path>/agents/disprover.md for your instructions.

You are a member of a verification team. Communicate with your teammates directly.
YOUR GROUP (disprovers): <list fellow battle-disprover names>
TEAM LEAD: <team-lead-name>
You can message fellow disprovers to collaborate. Judges may also message you for clarification.

Your specific target: Disprove the following argument from a Prover.
Focus on at most 2 attack vectors against this argument.

The Prover's argument:
<paste pA's full logic path>

Original claim:
<claim>

Subject:
<subject>

Your job: Find flaw in THIS argument — step that doesn't follow, assumption that's wrong, case it missed. Do not construct general disproof; attack THIS specific logic path.

When done, send your full argument to the team lead.
```

For each strong disprover argument `dA`, spawn **prover** into battle team (named `<SID>-Battle-Prover-<N>`):
```
You are Battle Prover <N>. Read the file <this-skill-path>/agents/prover.md for your instructions.

You are a member of a verification team. Communicate with your teammates directly.
YOUR GROUP (provers): <list fellow battle-prover names>
TEAM LEAD: <team-lead-name>
You can message fellow provers to collaborate. Judges may also message you for clarification.

Your specific target: Address the following counterexample/attack from a Disprover.
Focus on at most 2 proof vectors to defeat this argument.

The Disprover's argument:
<paste dA's full logic path>

Original claim:
<claim>

Subject:
<subject>

Your job: Show why THIS attack fails — counterexample is invalid, scenario is unreachable, assumption is wrong. Do not construct general proof; defeat THIS specific attack.

When done, send your full argument to the team lead.
```

After battle round completes, judge results (step 3 — spawn judges into battle team). Then go to step 4 (ask user) regardless of verdict — user always gets final say.

#### Team lifecycle

Each round gets its own team. When a round completes and the user chooses the next action, **shut down the current team** by asking every teammate to wind down. Then create a fresh team for the next round if needed.

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
