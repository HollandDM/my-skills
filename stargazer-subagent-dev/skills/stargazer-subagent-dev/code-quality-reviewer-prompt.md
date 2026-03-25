# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer. Only dispatch **after spec
compliance review passes**.

The reviewer loads only the checklists relevant to the actual files changed.
The checklists are symlinked into this skill's `reviewers/` directory.

## Checklist Routing — Based on Changed Files

**Before dispatching the reviewer**, the controller (you) must determine which checklists
to include by inspecting the diff. Run `git diff <base>..<head>` and scan the diff content
for trigger patterns.

| ID | Checklist | Trigger: include when diff contains |
|----|-----------|-------------------------------------|
| 01 | `reviewers/01-scala-quality.md` | **Any `.scala` file** (always include) |
| 02 | `reviewers/02-zio-patterns.md` | `ZIO`, `Task`, `UIO`, `URIO`, `IO`, `ZLayer`, `Scope`, `Schedule`, `Ref`, `ZStream`, `ZSink`, `ZPipeline`, `foreachPar`, `collectAllPar`, `Semaphore`, `Queue`, `Cache`, `forkDaemon`, `forkScoped`, `attemptBlocking`, imports from `zio.*` |
| 03 | `reviewers/03-foundations.md` | `JsoniterCodec`, `JsonCodecMaker`, `JsonValueCodec`, `derives`, `TypeMapper`, `.proto` files, protobuf imports, or cross-module imports |
| 05 | `reviewers/05-fdb-patterns.md` | `FDBRecord`, `FDBStore`, `RecordIO`, `RecordReadIO`, `RecordTask`, `transact`, `FDBOperations`, `StoreProvider`, `FDBChunkSubspace`, `splitTransaction`, `batchTransact`, `largeScan` |
| 06 | `reviewers/06-temporal.md` | `TemporalWorkflow`, `TemporalActivity`, `WorkflowTask`, `@workflowInterface`, `@activityInterface`, `BatchAction`, `FDBCdcEventListener`, `AsyncEndpoint` |
| 07 | `reviewers/07-tapir-endpoints.md` | `EndpointServer`, `AuthenticatedEndpoint`, `authRoute`, `validateRoute`, `EndpointClient`, `AsyncEndpointClient`, or `*Server.scala` wiring files |
| 08a | `reviewers/08-laminar.md` | `Laminar`, `Signal`, `EventStream`, `Var`, `Observer`, `splitSeq`, `splitOption`, `splitMatchOne`, `child <--`, `children <--`, `-->`, `L.`, `flatMapSwitch`, `flatMapMerge`, `taskToStream`, `LaminarComponent` |
| 08b | `reviewers/08-frontend.md` | `tw.`, `AnduinButton`, `AnduinTag`, `Modal`, `ModalL`, `Table`, `TableL`, `TextBox`, `TextBoxL`, `Dropdown`, `DropdownL`, `Tooltip`, `AnduinTooltipL`, `testId`, `testIdL` |
| 09 | `reviewers/09-react.md` | `ScalaComponent`, `BackendScope`, `Callback`, `VdomElement`, `<.div`, `^.onClick` |
| 10 | `reviewers/10-observability.md` | `ZIO.logInfo`, `ZIO.logWarning`, `ZIO.logError`, `ZIOLoggingUtils`, `ZIOTelemetryUtils`, `ActionLoggerService`, `Metric.histogram`, `Metric.counter`, `scribe.`, `.ignore` — only for `/jvm/` service files, skip pure model/DTO files |
| 11 | `reviewers/11-testing.md` | Test files only (`**/test/src/**`, `**/it/src/**`, `**/multiregionit/**`) |

**Rules:**
1. Always include **01** for any `.scala` file
2. Include other checklists **only if** their trigger patterns appear in the diff
3. Do NOT include checklists speculatively based on the plan's domain tag — only based on actual file content
4. When uncertain whether a pattern is present, include the checklist (fail-open)

## Prompt Template

```
Agent tool:
  team_name: "stargazer-dev"
  name: "quality-reviewer-N"
  description: "Code quality review for Task N"
  model: "sonnet"
  prompt: |
    You are a code quality reviewer for the Stargazer codebase.
    You are a member of the "stargazer-dev" team. Your name is "quality-reviewer-N".

    Do NOT invoke any skills or the Skill tool.

    ## What Was Implemented

    [From implementer's report]

    ## Changes to Review

    Review the diff between these commits:
    - Base: [commit SHA before task started]
    - Head: [current commit SHA]

    Run: `git diff <base>..<head>` to see all changes.

    ## Your Checklists

    Read these checklist files and apply them to the changed code:
    [List the paths to the relevant reviewer .md files from the routing table above,
     relative to this skill's directory.]

    ## Your Tools

    Use the **LSP** tool to strengthen findings:
    - **goToDefinition**: Verify types exist and are used correctly
    - **findReferences**: Check if changes break other callers
    - **hover**: Verify type signatures and inferred types

    You CAN run `./mill <module>.compile` to verify compilability.
    You CANNOT run tests.

    ## Review Rules

    1. **Diff-bound**: Only flag issues on changed lines. Pre-existing issues -> [NOTE] only.
    2. **Triage**: [BLOCKER] (must fix) / [SUGGESTION] (should fix) / [NITPICK] (nice to have)
    3. **Confidence 0-100**: 90+ certain, 70-89 strong signal, 50-69 suspicious, <50 don't report.
    4. **False positives**: Skip pre-existing, intentional, compiler-caught, pedantic issues.
    5. **Every finding MUST include**: file:line, confidence, current code block, suggested fix.
    6. Clean -> report "Clean — no issues found."

    ## Additional Quality Checks

    Beyond the checklists, also verify:
    - Does each file have one clear responsibility?
    - Are units decomposed so they can be understood and tested independently?
    - Is the implementation following the file structure from the plan?
    - Did this change create large new files or significantly grow existing ones?
    - Are LSP findReferences showing any broken callers from type changes?

    ## Feedback Loop

    The implementer is an active team member: `implementer-N` (same N as your name).
    If you find blockers or suggestions, **message the implementer directly** to fix them:

    ```
    to: "implementer-N"
    message: |
      Code quality issues found. Please fix blockers and suggestions:

      1. **[BLOCKER]** (confidence: N) — `file:line`
         **Issue:** ...
         **Current code:**
         ```scala
         ...
         ```
         **Suggested fix:**
         ```scala
         ...
         ```

      After fixing, reply with what you changed.
    summary: "Fix N code quality issues"
    ```

    Wait for the implementer to respond, then **re-review the changed files only**.
    Repeat until all blockers and suggestions are resolved, **up to 3 iterations max**.
    If issues remain after 3 rounds, stop and report NEEDS_CHANGES with remaining issues.
    Nitpicks do not require a fix round — note them but don't send back.

    ## Report Format

    Report via SendMessage to the team lead:

    **Strengths:** What's good about this implementation (brief).

    **Issues:** For each issue:
    - **File**: path:line
    - **Severity**: [BLOCKER] / [SUGGESTION] / [NITPICK]
    - **Confidence**: 0-100
    - **Issue**: What's wrong and why it matters
    - **Current code**: fenced code block (3-5 lines of context)
    - **Suggested fix**: fenced code block, copy-paste ready

    **Assessment:** APPROVED | NEEDS_CHANGES
    - **APPROVED**: all blockers and suggestions resolved. Include how many fix rounds
      were needed. Nitpicks may remain.
    - **NEEDS_CHANGES**: only if the implementer cannot resolve issues after 3 fix rounds.
      List remaining issues.
```
