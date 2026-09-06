/** Command entry: parse, lock, load, dispatch, and commit — the only writer of the design ledger. */
import { Effect, FileSystem } from "effect"
import * as nodePath from "node:path"
import { ParseError, parseArgs, usageLine, type Parsed } from "./args.js"
import { JOURNAL, LEDGER, isNodeId } from "./core.js"
import { Fail, Refused, fail } from "./errors.js"
import { Ledger, defaultTitle } from "./ledger.js"
import { Git, Io, captureIo } from "./services.js"
import { resolvePath } from "./paths.js"
import { locked } from "./transaction.js"
import { operations } from "./batch.js"
import { repr } from "./pystr.js"
import * as V from "./verbs.js"

/** Commands that leave the input ledger unchanged; html/reconcile write separate outputs. */
export const READ_ONLY = new Set(["check", "show", "frontier", "status", "html", "scan", "proposal", "repair", "reconcile", "observation"])
const CREATES = new Set(["new", "entry", "meta", "batch", "adopt"])

const VERB_TABLE: Record<string, V.Verb> = {
  frontier: V.vFrontier, show: V.vShow, new: V.vNew, set: V.vSet, body: V.vBody, answer: V.vAnswer, terminal: V.vTerminal, proposal: V.vProposal,
  approve: V.vApprove, reopen: V.vReopen, retire: V.vRetire, stale: V.vStale, reaffirm: V.vReaffirm, supersede: V.vSupersede, evidence: V.vEvidence,
  "withdraw-evidence": V.vWithdrawEvidence, observation: V.vObservation, ready: V.vReady, entry: V.vEntry, change: V.vChange, meta: V.vMeta,
  ambiguity: V.vAmbiguity, adr: V.vAdr, adopt: V.vAdopt, bind: V.vBind, unbind: V.vUnbind, observe: V.vObserve, scan: V.vScan, reconcile: V.vReconcile,
  sync: V.vSync, repair: V.vRepair, status: V.vStatus, html: V.vHtml, check: V.vCheck,
}

type Services = Io | FileSystem.FileSystem | Git

/** Run one parsed command against a loaded ledger (mutations stay in memory). */
export const dispatch = (led: Ledger, a: Parsed): Effect.Effect<void, Fail | Refused, Services> => Effect.gen(function* () {
  for (const key of ["id", "new_id", "parent"]) {
    const value = a.args[key]
    if (typeof value === "string" && !isNodeId(value)) return yield* fail(`${repr(value)}: expected a D-NNN node ID`)
  }
  if (!READ_ONLY.has(a.cmd) && a.cmd !== "batch") {
    let label = a.cmd + ("id" in a.args ? " " + String(a.args.id) : "")
    if (a.cmd === "set") {
      const field = String(a.args.field)
      let payload: unknown
      try {
        payload = JSON.parse(field)
      } catch {
        payload = undefined
      }
      if (payload !== undefined && payload !== null && typeof payload === "object" && !Array.isArray(payload)) label += " <json:" + Object.keys(payload).join(",") + ">"
      else if (payload !== undefined && payload !== null && typeof payload === "object") label += " <json:" + (payload as unknown[]).map(String).join(",") + ">"
      else label += field.trimStart().startsWith("{") || field.trimStart().startsWith("[") ? " <invalid-json>" : " " + field
    }
    led.operations.push(label)
  }
  if (a.cmd === "batch") return yield* vBatch(led, a)
  yield* VERB_TABLE[a.cmd](led, a.args)
})

/** Text a failed command would have printed: `error <message>` lines or approve's refusal block. */
export const renderFailure = (error: Fail | Refused): string => (error._tag === "Refused" ? error.lines.join("\n") + "\n" : error.message ? `error ${error.message}\n` : "")

const vBatch = (led: Ledger, a: Parsed): Effect.Effect<void, Fail | Refused, Services> => Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const io = yield* Io
  const file = String(a.args.file ?? "")
  const raw = file ? yield* fs.readFileString(file).pipe(Effect.mapError((e) => fail(e.message))) : yield* io.stdin
  const commands = yield* Effect.try({
    try: () => operations(JSON.parse(raw)),
    catch: (e) => fail(`invalid batch: ${e instanceof Error ? e.message : String(e)}`),
  })
  let index = 0
  for (const args of commands) {
    index += 1
    if (!args.length || READ_ONLY.has(args[0]) || args[0] === "batch") return yield* fail(`batch operation ${index}: only ledger mutation commands are allowed`)
    const captured = captureIo("")
    const result = yield* Effect.gen(function* () {
      const op = yield* Effect.try({ try: () => parseArgs([args[0], led.dir, ...args.slice(1)]), catch: (e) => e as ParseError })
      yield* dispatch(led, op)
    }).pipe(Effect.provide(captured.layer), Effect.result)
    if (result._tag === "Failure") {
      const failure = result.failure
      const text = failure instanceof ParseError ? `${usageLine(failure.verb)}\nstepwise ${failure.verb ?? ""}: error: ${failure.message}\n` : renderFailure(failure)
      return yield* fail(`batch operation ${index} failed; no changes committed: ${(captured.output() + text).trim()}`)
    }
  }
  led.messages.push(`batch: ${commands.length} operations`)
})

const printUsageError = (io: Io["Service"], error: ParseError): number => {
  io.err(`${usageLine(error.verb)}\nstepwise${error.verb ? " " + error.verb : ""}: error: ${error.message}\n`)
  return 2
}

/** The whole command: returns the process exit code. */
export const run = (argv: readonly string[]): Effect.Effect<number, never, Services> => Effect.gen(function* () {
  const io = yield* Io
  const fs = yield* FileSystem.FileSystem
  let a: Parsed
  try {
    a = parseArgs(argv)
  } catch (error) {
    return printUsageError(io, error as ParseError)
  }
  const d = yield* resolvePath(a.dir)
  const ledgerPath = nodePath.join(d, LEDGER)
  const journal = nodePath.join(d, JOURNAL)
  if (READ_ONLY.has(a.cmd) && !(yield* fs.exists(ledgerPath)) && !(yield* fs.exists(journal))) {
    io.err(`error ${ledgerPath} missing\n`)
    return 1
  }
  const body = Effect.gen(function* () {
    let led = yield* Ledger.load(d)
    if (!led.data) {
      if (CREATES.has(a.cmd)) led = yield* Ledger.create(d, defaultTitle(d))
      else return yield* fail(`${ledgerPath} missing; start with \`new\` or \`batch\``)
    }
    if (READ_ONLY.has(a.cmd)) {
      yield* dispatch(led, a)
      return 0
    }
    // Mutations run against a captured stdout: their chatter only surfaces when they fail.
    const captured = captureIo(io.stdin)
    const outcome = yield* dispatch(led, a).pipe(Effect.provide(captured.layer), Effect.result)
    if (outcome._tag === "Failure") {
      io.out(captured.stdout())
      return yield* Effect.fail(outcome.failure)
    }
    return yield* V.finalize(led, a.cmd)
  })
  const exit = yield* locked(d, body).pipe(Effect.result)
  if (exit._tag === "Success") return exit.success
  const error = exit.failure
  const recovery = (yield* fs.exists(journal)) ? " A prepared transaction remains; run sync to recover it before resubmitting changes." : ""
  if (error instanceof Refused) io.err(error.lines.join("\n") + "\n")
  else if (error instanceof Fail) {
    if (error.message) io.err(`error ${error.message}${recovery}\n`)
  } else io.err(`error ${(error as { message?: string }).message ?? String(error)}${recovery}\n`)
  return 1
}).pipe(Effect.catchCause((cause): Effect.Effect<number, never, Io> => Effect.gen(function* () {
  const io = yield* Io
  io.err(`error ${String(cause)}\n`)
  return 1
})))
