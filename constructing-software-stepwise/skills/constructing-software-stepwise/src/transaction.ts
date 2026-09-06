/** Serialized, crash-recoverable commits of a ledger and its generated files. */
import { Effect, FileSystem } from "effect"
import * as nodePath from "node:path"
import { randomBytes } from "node:crypto"
import { JOURNAL, LOCK } from "./core.js"
import { Fail, asFail, fail, toFail } from "./errors.js"

const LOCK_DEADLINE_MS = 10_000

/** Write bytes through a same-directory temp file, fsync, then rename over the target. */
export const atomicWrite = Effect.fn("atomicWrite")(function* (path: string, value: Uint8Array) {
  const fs = yield* FileSystem.FileSystem
  yield* asFail(fs.makeDirectory(nodePath.dirname(path), { recursive: true }))
  const tmp = nodePath.join(nodePath.dirname(path), `.${nodePath.basename(path)}.${randomBytes(6).toString("hex")}`)
  const write = Effect.gen(function* () {
    const file = yield* fs.open(tmp, { flag: "wx" })
    yield* file.writeAll(value)
    yield* file.sync
  }).pipe(Effect.scoped)
  const result = yield* Effect.gen(function* () {
    yield* write
    yield* fs.rename(tmp, path)
  }).pipe(Effect.result)
  if (result._tag === "Failure") {
    yield* fs.remove(tmp).pipe(Effect.ignore)
    return yield* Effect.fail(toFail(result.failure))
  }
})

/** A prepared journal describes a validated commit; finish it after interruption. */
export const recover = Effect.fn("recover")(function* (directory: string) {
  const fs = yield* FileSystem.FileSystem
  const journal = nodePath.join(directory, JOURNAL)
  if (!(yield* asFail(fs.exists(journal)))) return
  const pending = JSON.parse(yield* asFail(fs.readFileString(journal))) as { files: Array<[string, string]> }
  for (const [name, value] of pending.files) yield* atomicWrite(name, Buffer.from(value, "base64"))
  yield* asFail(fs.remove(journal))
})

const pidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM"
  }
}

const acquire = Effect.fn("acquireLock")(function* (lock: string) {
  const fs = yield* FileSystem.FileSystem
  const deadline = Date.now() + LOCK_DEADLINE_MS
  const mine = String(process.pid)
  for (;;) {
    const created = yield* fs.writeFileString(lock, mine, { flag: "wx" }).pipe(Effect.result)
    if (created._tag === "Success") return
    const holder = yield* fs.readFileString(lock).pipe(Effect.orElseSucceed(() => ""))
    const pid = /^\d+$/u.test(holder.trim()) ? Number(holder.trim()) : NaN
    // Empty or garbage content (a lock file left by the Python CLI's flock scheme) or a dead process: the lock is stale.
    // Our own pid means another fiber of this process holds it (tests, reconcile): wait like any other writer.
    if (Number.isNaN(pid) || !pidAlive(pid)) {
      yield* fs.remove(lock).pipe(Effect.ignore)
      continue
    }
    if (Date.now() > deadline) return yield* fail("another Stepwise writer holds the ledger lock; retry after it finishes")
    yield* Effect.sleep("50 millis")
  }
})

/** Hold the ledger lock around `body`; interrupted commits are recovered first. */
export const locked = <A, E, R>(directory: string, body: Effect.Effect<A, E, R>): Effect.Effect<A, E | Fail, R | FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    yield* asFail(fs.makeDirectory(directory, { recursive: true }))
    const lock = nodePath.join(directory, LOCK)
    return yield* Effect.acquireUseRelease(
      acquire(lock),
      () => Effect.gen(function* () {
        yield* recover(directory)
        return yield* body
      }),
      () => Effect.gen(function* () {
        const holder = yield* fs.readFileString(lock).pipe(Effect.orElseSucceed(() => ""))
        if (holder.trim() === String(process.pid)) yield* fs.remove(lock).pipe(Effect.ignore)
      }),
    )
  })

/** Validation happens before this call. Journal recovery completes interrupted writes. */
export const commit = Effect.fn("commit")(function* (directory: string, files: Map<string, string>) {
  const journal = nodePath.join(directory, JOURNAL)
  const payload = { files: [...files].map(([path, text]) => [path, Buffer.from(text, "utf8").toString("base64")]) }
  yield* atomicWrite(journal, Buffer.from(JSON.stringify(payload), "utf8"))
  yield* recover(directory)
})
