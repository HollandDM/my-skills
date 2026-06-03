---
name: prove-workflow
description: >
  Build and run a deterministic Workflow (via the Workflow tool) that implements the adversarial
  prove/disprove verification pipeline — vibe-check scout, parallel provers + disprovers, judge panel,
  and battle-round loop — as a single background orchestration script instead of live TeamCreate/SendMessage
  agents. Use when the user says "prove this with a workflow", "verify with a workflow", "run the prove
  workflow", or wants the prove pipeline as an unattended, resumable, parallel background run rather than an
  interactive team. For the interactive (live-team, ask-between-rounds) version use the `prove` skill instead.
---

# Prove (Workflow edition)

This skill tells you HOW to author and launch a **Workflow** script that reproduces the `prove` skill's
adversarial verification logic deterministically. The classic `prove` skill uses live teammates that talk
over `SendMessage`; this version compiles the same idea into one `Workflow(...)` call that fans out
`agent()` calls, barriers on judges, and loops battle rounds in plain JavaScript.

## Prerequisite: the Workflow tool (with fallback)

This skill **requires the `Workflow` tool**. Before doing anything else, confirm it is available.
If the `Workflow` tool is **not** present in this environment, do NOT try to emulate it — **fall back to the
sibling base skill `prove`** (live `TeamCreate`/`Agent`/`SendMessage` team-of-agents), which implements the
exact same prove/disprove logic interactively. Say so plainly, invoke `prove`, and stop.

## When this version wins over live `prove`

- Unattended / background run — no per-round `AskUserQuestion` stop.
- Deterministic, resumable (same script + args → cached prefix on resume).
- Heavy parallelism with a hard token budget.

## Translation rules (live team → workflow)

| Live `prove` mechanism | Workflow equivalent |
|---|---|
| `TeamCreate` per round | nothing — the script *is* the team lead; state lives in JS variables |
| Provers/disprovers as teammates | `agent(prompt, {schema, phase})` calls inside `parallel()` |
| Vibe check `SendMessage` to lead → spawn reinforcement | run the vibe `agent()` first, `await` it, then append a reinforcement arguer to the weaker side before the `parallel()` fan-out |
| Judges `SendMessage`-interrogate arguers (live Q&A) | **no live Q&A** — each arguer MUST return a fully self-contained logic path; judges evaluate from that text. If a judge needs detail, model it as a follow-up `agent()` clarification pass, not a back-channel |
| Cross-group isolation (provers can't talk to disprovers) | automatic — workflow agents never share context |
| `AskUserQuestion` between rounds | **can't ask mid-run** — loop battle rounds autonomously until a majority verdict or `maxRounds`, then return the full record; the main thread presents it and asks the user whether to continue |

Arguer/judge **instruction files still apply**. They are symlinked into this skill dir at `agents/`
(→ the base `prove` skill's `agents/`), so reference them locally: `${SKILL_DIR}/agents/prover.md`,
`.../disprover.md`, `.../judge.md`. Pass `${SKILL_DIR}` (this skill's base directory) as `resourceDir` in `args`.

## What you do

1. **Extract Subject + Claim.** Restate the claim precisely (same discipline as `prove` step 1). If vague,
   use `AskUserQuestion` to confirm the precise formulation BEFORE launching the workflow (the workflow can't ask).
2. **Author the script** from the template below, filling Subject, Claim, the resource path, and the
   per-claim-type angle assignments (code-correctness / performance / system-behavior vectors from the
   `prove` skill's angle table).
3. **Launch it** with the `Workflow` tool. Pass Subject+Claim via `args` so resume is clean.
4. **On completion**, present the returned verdict record (full winning logic path verbatim) and use
   `AskUserQuestion` to offer: Accept / More context (re-run with refined claim) / Another battle round / End.

## Script template (adapt, don't copy blindly)

```javascript
export const meta = {
  name: 'prove-claim',
  description: 'Adversarial prove/disprove: vibe scout, parallel arguers, judge panel, battle loop',
  phases: [
    { title: 'Vibe' },
    { title: 'Argue' },
    { title: 'Judge' },
    { title: 'Battle' },
  ],
}

const { subject, claim, resourceDir } = args   // pass these in Workflow args
const MAX_ROUNDS = 4

const VERDICT = {
  type: 'object',
  properties: {
    verdict: { enum: ['PROVEN', 'DISPROVEN', 'UNDECIDED'] },
    rationale: { type: 'string' },
    winner: { type: 'string' },        // which arguer was most convincing ('' if undecided)
  },
  required: ['verdict', 'rationale'],
}
const ARG = {
  type: 'object',
  properties: {
    role: { enum: ['prover', 'disprover'] },
    label: { type: 'string' },
    logicPath: { type: 'string' },     // FULL self-contained chain of reasoning, verbatim-quotable
  },
  required: ['role', 'label', 'logicPath'],
}

// ---- Phase: Vibe (fast scout decides where reinforcement goes) ----
phase('Vibe')
const vibe = await agent(
  `Quick shallow assessment ONLY — is this claim more likely true or false? No deep proof.\n` +
  `Return verdict LIKELY_TRUE or LIKELY_FALSE + one-line rationale.\nSubject:\n${subject}\nClaim:\n${claim}`,
  { label: 'vibe', phase: 'Vibe', model: 'haiku',
    schema: { type: 'object', properties: { verdict: { enum: ['LIKELY_TRUE', 'LIKELY_FALSE'] }, rationale: { type: 'string' } }, required: ['verdict'] } }
)

// ---- Build arguer roster: always 1 more disprover than prover; reinforce the weaker side ----
// Base: 2 provers + 3 disprovers. Reinforcement side from vibe.
function arguerPrompt(role, label, vectors, target) {
  const file = role === 'prover' ? 'prover.md' : 'disprover.md'
  return `You are ${label}. Read your instructions from ${resourceDir}/agents/${file}.\n` +
    `There is NO live messaging — produce a COMPLETE, self-contained logic path another agent can judge from text alone.\n` +
    `Your assigned vectors (max 2, focus only on these):\n${vectors.map((v,i)=>`${i+1}. ${v}`).join('\n')}\n` +
    `Subject:\n${subject}\nClaim to ${role === 'prover' ? 'PROVE' : 'PROVE FALSE'}:\n${claim}\n` +
    (target ? `\nReinforcement note: use a FRESH angle not listed above; supporting evidence, not formal proof.` : '')
}

// Fill these vector lists from the prove skill's angle table for the claim type:
const proverVectors    = [['type-directed reasoning','case analysis'], ['invariant identification','induction']]
const disproverVectors = [['boundary analysis','counterexample construction'], ['race condition','dependency failure'], ['assumption violation','type escape']]

const roster = [
  ...proverVectors.map((v,i)    => ({ role:'prover',    label:`Prover-${'AB'[i]}`,        vectors:v })),
  ...disproverVectors.map((v,i) => ({ role:'disprover', label:`Disprover-${'ABC'[i]}`,    vectors:v })),
]
// Reinforcement: extra agent on the side the vibe favors (more scrutiny survives → more confidence)
const reinforceRole = vibe?.verdict === 'LIKELY_TRUE' ? 'prover' : 'disprover'
roster.push({ role: reinforceRole, label: 'Reinforcement', vectors: ['independent verification via alternative reasoning path'], target: true })

// ---- Phase: Argue (all arguers in parallel) ----
phase('Argue')
let args1 = (await parallel(roster.map(a => () =>
  agent(arguerPrompt(a.role, a.label, a.vectors, a.target), { label: a.label, phase: 'Argue', schema: ARG })
))).filter(Boolean)

// ---- Judge panel: ceil(arguers/2) judges, each a distinct decision vector ----
const JUDGE_VECTORS = ['logical soundness','evidence completeness','counterexample validity','assumption audit','scope coverage']
async function judgeRound(argList, phaseName, roundNo) {
  const n = Math.ceil(argList.length / 2)
  const block = argList.map(a => `### ${a.label} (${a.role})\n${a.logicPath}`).join('\n\n')
  const verdicts = (await parallel(Array.from({ length: n }, (_, i) => () =>
    agent(
      `You are Judge ${i+1}. Read your instructions from ${resourceDir}/agents/judge.md.\n` +
      `Evaluate ONLY through this lens: ${JUDGE_VECTORS[(i + roundNo) % JUDGE_VECTORS.length]}.\n` +
      `No live Q&A available — judge purely from the arguments below.\nClaim:\n${claim}\nSubject:\n${subject}\n\n` +
      `=== ARGUMENTS ===\n${block}`,
      { label: `judge-${i+1}`, phase: phaseName, schema: VERDICT }
    )
  ))).filter(Boolean)
  const tally = v => verdicts.filter(x => x.verdict === v).length
  const maj = verdicts.length / 2
  const result = tally('PROVEN') > maj ? 'PROVEN' : tally('DISPROVEN') > maj ? 'DISPROVEN' : 'UNDECIDED'
  return { result, verdicts }
}

phase('Judge')
let round = await judgeRound(args1, 'Judge', 0)
const history = [{ type: 'argue', args: args1, ...round }]

// ---- Battle loop: while UNDECIDED and under cap, attack the strongest cited arguments ----
phase('Battle')
let r = 1
while (round.result === 'UNDECIDED' && r < MAX_ROUNDS) {
  // strong = arguments a judge cited as winner
  const cited = new Set(round.verdicts.map(v => v.winner).filter(Boolean))
  const strong = history.at(-1).args.filter(a => cited.has(a.label)).slice(0, 4)
  if (!strong.length) break
  const battle = (await parallel(strong.map(a => () => {
    const oppRole = a.role === 'prover' ? 'disprover' : 'prover'
    const file = oppRole === 'prover' ? 'prover.md' : 'disprover.md'
    return agent(
      `You are a Battle ${oppRole}. Read ${resourceDir}/agents/${file}.\n` +
      `Use DIFFERENT vectors than the original round. Attack/defend THIS specific logic path only (max 2 vectors):\n\n` +
      `${a.logicPath}\n\nOriginal claim:\n${claim}\nSubject:\n${subject}`,
      { label: `battle-${oppRole}-vs-${a.label}`, phase: 'Battle', schema: ARG }
    )
  }))).filter(Boolean)
  round = await judgeRound([...strong, ...battle], 'Battle', r)
  history.push({ type: 'battle', args: battle, ...round })
  r++
}

return {
  claim, subject,
  finalResult: round.result,
  rounds: history.map((h, i) => ({ round: i + 1, type: h.type, result: h.result,
    votes: h.verdicts.map(v => ({ verdict: v.verdict, rationale: v.rationale, winner: v.winner })) })),
  winningLogicPath: (() => {
    const winnerLabel = round.verdicts.map(v => v.winner).filter(Boolean)[0]
    const all = history.flatMap(h => h.args)
    return (all.find(a => a.label === winnerLabel) || all[0])?.logicPath || ''
  })(),
}
```

## After the workflow returns

Present the verdict in the `prove` skill's step-6 format: **Verdict**, **Claim**, **Rounds** (type + result
each), **Judge votes**, the **full winning logic path verbatim** (never summarize), defeated arguments, and a
**confidence** read from judge agreement + rounds survived. Then `AskUserQuestion`: Accept / More context
(re-run workflow with refined claim via `args` + `resumeFromRunId` if only the claim changed) / Another battle
round / End. The user always gets the final say.

## Notes / caveats

- **No mid-run user interaction.** Resolve claim ambiguity before launch; ask about next steps after.
- **No live judge↔arguer Q&A.** Compensate by demanding fully self-contained `logicPath` from every arguer.
- **Disprover advantage preserved** (3 vs 2 base) and reinforcement still targets the vibe-favored side.
- **Resume:** identical script + `args` replays the cached prefix; only edited/new `agent()` calls re-run.
