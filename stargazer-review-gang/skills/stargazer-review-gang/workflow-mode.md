# Stargazer Review Gang — Workflow Mode

Use this when the **Workflow tool** is available. Author one `Workflow(...)` script: route → parallel reviewers → opus validator. Read-only — no build commands.

### Carryover constraints

- NO build commands anywhere (`./mill`, compile, test, checkStyle*, reformat).
- Diff-bound: reviewers only flag changed lines. No PR-size stop.
- Checklists in `${SKILL_DIR}/reviewers/NN-*.md`; agent instructions in `${SKILL_DIR}/agents/*.md`.

### Translation rules (team → workflow)

| Team mechanism | Workflow equivalent |
|---|---|
| Routing orchestrator agent | first `agent()`, schema'd routing plan |
| reviewers as teammates | `parallel()` of reviewer `agent()` calls |
| validator live-re-queries reviewers | **no live re-query** — validator re-reads actual code itself |
| auto-fix via `SendMessage` | **after** workflow returns: `AskUserQuestion` then dispatch fixes |

### What you do

1. Gather `user_context` from conversation. Determine review **scope** verbatim (pre-launch).
2. Note Scala tool availability (scala-code-intelligence MCP / `cellar` / grep). Pass to every agent.
3. Author script (template), fill scope, context, tool note, `${SKILL_DIR}`. Launch via `Workflow`, args-passed.
4. On completion, present validator report **verbatim** (keep 🔴🟡🔵, code blocks, confidence, attributions). If more than nitpicks, `AskUserQuestion` (Fix all / Fix blockers only / Skip), then apply.

### Script template (adapt)

```javascript
export const meta = {
  name: 'stargazer-review',
  description: 'Route diff to reviewer groups, fan out reviewers, validate into one report',
  phases: [{ title: 'Route' }, { title: 'Review' }, { title: 'Validate' }],
}

const { scope, userContext, scalaTools, skillDir } = args

const ROSTER = [
  { id: 1, group: 'Scala Quality',       file: '01-scala-quality.md',   model: 'sonnet' },
  { id: 2, group: 'ZIO & Observability', file: '02-zio-patterns.md',    model: 'sonnet' },
  { id: 3, group: 'Architecture',        file: '03-foundations.md',     model: 'haiku'  },
  { id: 4, group: 'FDB',                 file: '05-fdb-patterns.md',    model: 'sonnet' },
  { id: 5, group: 'Temporal',            file: '06-temporal.md',        model: 'sonnet' },
  { id: 6, group: 'Tapir',               file: '07-tapir-endpoints.md', model: 'sonnet' },
  { id: 7, group: 'Frontend',            file: '08-frontend.md',        model: 'haiku'  },
  { id: 8, group: 'Testing',             file: '11-testing.md',         model: 'sonnet' },
]

phase('Route')
const ROUTE_SCHEMA = { type: 'object', properties: {
  diff_ref: { type: 'string' },
  routing: { type: 'array', items: { type: 'object', properties: {
    reviewerId: { type: 'number' }, files: { type: 'array', items: { type: 'string' } }, workload: { type: 'number' } },
    required: ['reviewerId', 'files', 'workload'] } } },
  required: ['diff_ref', 'routing'] }
const plan = await agent(
  `First invoke the caveman:caveman skill. Read your instructions from ${skillDir}/agents/orchestrator.md.\n` +
  `Determine the git diff strategy yourself from this scope (do NOT assume base/head):\nScope: ${scope}\n` +
  `User context: ${userContext}\nScala tools: ${scalaTools}\n` +
  `Return routing plan: diff_ref + per-reviewer file assignments + workload (+/- lines).`,
  { label: 'orchestrator', phase: 'Route', model: 'sonnet', schema: ROUTE_SCHEMA }
)

const modelFor = (r, wl) => wl <= 100 ? 'haiku' : wl > 1500 ? 'opus' : r.model

phase('Review')
const FINDINGS = { type: 'object', properties: {
  reviewerId: { type: 'number' },
  findings: { type: 'array', items: { type: 'object', properties: {
    file: { type: 'string' }, line: { type: 'number' }, severity: { enum: ['blocker','suggestion','nitpick'] },
    issue: { type: 'string' }, fix: { type: 'string' }, confidence: { type: 'number' } },
    required: ['file','severity','issue'] } } },
  required: ['reviewerId','findings'] }

const assigned = plan.routing.filter(a => a.files.length)
const reviews = (await parallel(assigned.map(a => {
  const r = ROSTER.find(x => x.id === a.reviewerId)
  return () => agent(
    `First invoke the caveman:caveman skill, then invoke NO other skills.\n` +
    `Read your checklist from ${skillDir}/reviewers/${r.file}.\n` +
    `Diff ref: ${plan.diff_ref}\nFiles: ${a.files.join(', ')}\nUser context: ${userContext}\nScala tools: ${scalaTools}\n` +
    `NO build commands. Diff-bound — only flag changed lines. Per file: git diff -U3 ${plan.diff_ref} -- <file>, ` +
    `read full file, blame changed lines. Follow the checklist's own output format + triage rules.`,
    { label: `reviewer-${r.id}`, phase: 'Review', model: modelFor(r, a.workload), schema: FINDINGS }
  )
}))).filter(Boolean)

phase('Validate')
const allFindings = reviews.flatMap(r => r.findings.map(f => ({ ...f, reviewerId: r.reviewerId })))
const report = await agent(
  `First invoke the caveman:caveman skill. Read your instructions from ${skillDir}/agents/validator.md.\n` +
  `Diff ref: ${plan.diff_ref}\nValidate each finding against the ACTUAL code (re-read it — no back-channel to ` +
  `reviewers). Deduplicate, filter false positives, produce the final report with severity emoji, code blocks, ` +
  `confidence scores, reviewer attributions.\n\nFindings:\n${JSON.stringify(allFindings, null, 2)}`,
  { label: 'validator', phase: 'Validate', model: 'opus' }   // no schema: keep rich formatted report verbatim
)

return { diff_ref: plan.diff_ref, reviewerCount: assigned.length, report }
```

### After the workflow returns

Present `report` verbatim (code blocks ARE the report — never reduce to one-liners, even all-nitpick). If blockers/suggestions, `AskUserQuestion` (Fix all / Fix blockers only / Skip); apply via Edit or the team-of-agents auto-fix step, then tell user to run `checkStyleDirty` on affected modules.

### Caveats

- No live validator↔reviewer re-query — validator re-reads code itself.
- Read-only — workflow never builds/fixes; fixes happen after with consent.
- Resume: identical script + `args` replays cached routing/reviews.
