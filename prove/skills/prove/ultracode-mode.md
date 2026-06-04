# Prove — Ultracode Mode

Use this when the **Workflow tool** is available. Author one `Workflow(...)` script that reproduces the prove/disprove logic deterministically, then launch it. State lives in JS variables — there is no `SendMessage`.

### Translation rules (team → ultracode)

| Team mechanism | Ultracode equivalent |
|---|---|
| `TeamCreate` per round | nothing — the script *is* the team lead |
| Provers/disprovers as teammates | `agent(prompt, {schema, phase})` inside `parallel()` |
| Vibe `SendMessage` → spawn reinforcement | run vibe `agent()` first, `await`, then append reinforcement arguer to weaker side before the fan-out |
| Judges live-interrogate arguers | **no live Q&A** — each arguer returns a fully self-contained logic path; judges evaluate from text |
| Cross-group isolation | automatic — ultracode agents never share context |
| `AskUserQuestion` between rounds | **can't ask mid-run** — loop battle rounds until majority verdict or `maxRounds`, then return record; main thread asks user after |

Arguer/judge instruction files live in `${SKILL_DIR}/agents/` (`prover.md`, `disprover.md`, `judge.md`). Pass `${SKILL_DIR}` as `resourceDir` in `args`.

### What you do

1. Extract Subject + Claim. Restate the claim precisely. If vague, `AskUserQuestion` to confirm BEFORE launch (ultracode can't ask).
2. Author the script (template below), filling Subject, Claim, `resourceDir`, and per-claim-type angle vectors (the angle tables in the team-of-agents section).
3. Launch with the `Workflow` tool; pass Subject+Claim via `args`.
4. On completion, present the verdict (full winning logic path verbatim) and `AskUserQuestion`: Accept / More context / Another battle round / End.

### Script template (adapt)

```javascript
export const meta = {
  name: 'prove-claim',
  description: 'Adversarial prove/disprove: vibe scout, parallel arguers, judge panel, battle loop',
  phases: [{ title: 'Vibe' }, { title: 'Argue' }, { title: 'Judge' }, { title: 'Battle' }],
}

const { subject, claim, resourceDir } = args
const MAX_ROUNDS = 4

const VERDICT = { type: 'object', properties: {
  verdict: { enum: ['PROVEN', 'DISPROVEN', 'UNDECIDED'] }, rationale: { type: 'string' }, winner: { type: 'string' } },
  required: ['verdict', 'rationale'] }
const ARG = { type: 'object', properties: {
  role: { enum: ['prover', 'disprover'] }, label: { type: 'string' }, logicPath: { type: 'string' } },
  required: ['role', 'label', 'logicPath'] }

phase('Vibe')
const vibe = await agent(
  `Quick shallow assessment ONLY — is this claim more likely true or false? No deep proof.\n` +
  `Return LIKELY_TRUE or LIKELY_FALSE + one-line rationale.\nSubject:\n${subject}\nClaim:\n${claim}`,
  { label: 'vibe', phase: 'Vibe', model: 'haiku',
    schema: { type: 'object', properties: { verdict: { enum: ['LIKELY_TRUE', 'LIKELY_FALSE'] }, rationale: { type: 'string' } }, required: ['verdict'] } }
)

function arguerPrompt(role, label, vectors, reinforce) {
  const file = role === 'prover' ? 'prover.md' : 'disprover.md'
  return `You are ${label}. Read your instructions from ${resourceDir}/agents/${file}.\n` +
    `NO live messaging — produce a COMPLETE, self-contained logic path another agent can judge from text alone.\n` +
    `Your vectors (max 2, focus only on these):\n${vectors.map((v,i)=>`${i+1}. ${v}`).join('\n')}\n` +
    `Subject:\n${subject}\nClaim to ${role === 'prover' ? 'PROVE' : 'PROVE FALSE'}:\n${claim}\n` +
    (reinforce ? `\nReinforcement: use a FRESH angle; supporting evidence, not formal proof.` : '')
}

// Fill from the claim-type angle table in the team-of-agents section:
const proverVectors    = [['type-directed reasoning','case analysis'], ['invariant identification','induction']]
const disproverVectors = [['boundary analysis','counterexample construction'], ['race condition','dependency failure'], ['assumption violation','type escape']]

const roster = [
  ...proverVectors.map((v,i)    => ({ role:'prover',    label:`Prover-${'AB'[i]}`,     vectors:v })),
  ...disproverVectors.map((v,i) => ({ role:'disprover', label:`Disprover-${'ABC'[i]}`, vectors:v })),
]
const reinforceRole = vibe?.verdict === 'LIKELY_TRUE' ? 'prover' : 'disprover'
roster.push({ role: reinforceRole, label: 'Reinforcement', vectors: ['independent verification via alternative reasoning path'], reinforce: true })

phase('Argue')
let args1 = (await parallel(roster.map(a => () =>
  agent(arguerPrompt(a.role, a.label, a.vectors, a.reinforce), { label: a.label, phase: 'Argue', schema: ARG })
))).filter(Boolean)

const JUDGE_VECTORS = ['logical soundness','evidence completeness','counterexample validity','assumption audit','scope coverage']
async function judgeRound(argList, phaseName, roundNo) {
  const n = Math.ceil(argList.length / 2)
  const block = argList.map(a => `### ${a.label} (${a.role})\n${a.logicPath}`).join('\n\n')
  const verdicts = (await parallel(Array.from({ length: n }, (_, i) => () =>
    agent(
      `You are Judge ${i+1}. Read your instructions from ${resourceDir}/agents/judge.md.\n` +
      `Evaluate ONLY through this lens: ${JUDGE_VECTORS[(i + roundNo) % JUDGE_VECTORS.length]}.\n` +
      `No live Q&A — judge purely from the arguments below.\nClaim:\n${claim}\nSubject:\n${subject}\n\n=== ARGUMENTS ===\n${block}`,
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

phase('Battle')
let r = 1
while (round.result === 'UNDECIDED' && r < MAX_ROUNDS) {
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
  claim, subject, finalResult: round.result,
  rounds: history.map((h, i) => ({ round: i + 1, type: h.type, result: h.result,
    votes: h.verdicts.map(v => ({ verdict: v.verdict, rationale: v.rationale, winner: v.winner })) })),
  winningLogicPath: (() => {
    const winnerLabel = round.verdicts.map(v => v.winner).filter(Boolean)[0]
    const all = history.flatMap(h => h.args)
    return (all.find(a => a.label === winnerLabel) || all[0])?.logicPath || ''
  })(),
}
```

### After the ultracode run returns

Present in the team-of-agents step-6 format: Verdict, Claim, Rounds, Judge votes, **full winning logic path verbatim**, defeated arguments, confidence. Then `AskUserQuestion`: Accept / More context (re-run via `args`, optionally `resumeFromRunId`) / Another battle round / End. User always gets final say.

### Caveats

- No mid-run user interaction — resolve claim ambiguity before launch, ask next-steps after.
- No live judge↔arguer Q&A — compensate with self-contained `logicPath`.
- Disprover advantage (3 vs 2) + reinforcement toward vibe-favored side preserved.
- Resume: identical script + `args` replays cached prefix.
