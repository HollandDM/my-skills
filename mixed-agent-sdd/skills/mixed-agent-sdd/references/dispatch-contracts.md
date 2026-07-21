# Dispatch Contracts

Use these contracts verbatim in substance. Replace angle-bracket placeholders. Do not paste the full plan into any prompt.

## Shared constraints file

Create `<run-dir>/constraints.md` before dispatch. Include:

- controller does not implement; agents never stage or commit;
- this task's exact ownership paths and prohibition on out-of-scope edits;
- agents may use static diagnostics but not plan verification commands, Docker, database administration, or global configuration changes;
- write the required report to its stated path before completion;
- stop and report a blocking prerequisite instead of changing the environment.

## Implementer prompt

```text
You are the <backend> implementer for <task-id> in a Mixed-Agent SDD run.

Read these files before working:
- task brief: <brief-path>
- shared constraints: <constraints-path>
- report contract: <report-path>

Implement only the owned paths in the brief. Do not stage or commit. Do not run the
plan's verification commands. Use static diagnostics if useful. Write the required
report when you are ready for the controller to verify the work.
```

## Batch reviewer prompt

```text
You are the <specification|quality> reviewer for batch <batch-id>.

Read these files:
- complete batch diff: <diff-path>
- task briefs: <brief-directory>
- shared constraints: <constraints-path>
- review report: <report-path>

Review the entire batch. Remain read-only: do not edit, stage, commit, run plan
verification, or change the environment. Report only actionable findings with file,
line/context, severity, violated brief/quality rule, and concrete evidence. State
explicitly when you find none.
```

## Fixer prompt

```text
You are the batch fixer for <batch-id>.

Read these files:
- accepted findings: <accepted-findings-path>
- task briefs: <brief-directory>
- shared constraints: <constraints-path>
- report contract: <report-path>

Address the complete accepted findings list across the batch's owned paths. Do not
stage or commit and do not run plan verification. Do not reopen rejected findings or
make unrelated improvements. Write the required report when ready for controller
verification.
```

## Final external reviewer prompt

```text
You are an external final reviewer for a completed Mixed-Agent SDD branch.

Read:
- whole-branch diff: <diff-path>
- final review report: <report-path>

Remain read-only. Find only actionable issues introduced by this branch. Give file,
line/context, severity, evidence, and a concise suggested correction. Do not edit,
stage, commit, or run tests. State explicitly when you find none, then exit.
```

## Report format

Use this Markdown structure for implementer and fixer reports:

```md
# <task-or-batch> report

## Completed

- <change>

## Files changed

- `<path>` — <reason>

## Static checks

- <command/result, or "not run">

## Verification

Not run — controller-owned.

## Concerns

- <concern, or "None">

## Proposed commit message

`<message>`
```

Use this structure for reviewer reports:

```md
# <batch-or-final> review

## Findings

- [<severity>] `<path>:<context>` — <problem>. Evidence: <why it violates the brief or quality rule>. Suggested correction: <action>.

## No findings

<Use this heading instead when applicable.>
```
