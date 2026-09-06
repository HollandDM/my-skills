/** Crash-recoverable commits and the ledger lock. */
import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import * as NodeServices from "@effect/platform-node/NodeServices"
import * as fs from "node:fs"
import * as nodePath from "node:path"
import { commit, locked, recover } from "../src/transaction.js"
import { expectCli, readLedger, tempDir } from "./harness.js"

const runFs = <A, E>(effect: Effect.Effect<A, E, import("effect").FileSystem.FileSystem>): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(NodeServices.layer)))

describe("transactions", () => {
  it("recovers an interrupted commit from the journal", async () => {
    const d = tempDir()
    const destination = nodePath.join(d, "recovery.txt")
    // A directory in the way makes the rename fail after the journal is written: the commit is interrupted.
    fs.mkdirSync(destination)
    await expect(runFs(commit(d, new Map([[destination, "Recovered content"]])))).rejects.toThrow()
    expect(fs.existsSync(nodePath.join(d, ".stepwise-transaction.json"))).toBe(true)
    fs.rmdirSync(destination)
    await runFs(recover(d))
    expect(fs.readFileSync(destination, "utf8")).toBe("Recovered content")
    expect(fs.existsSync(nodePath.join(d, ".stepwise-transaction.json"))).toBe(false)
  })

  it("finishes a prepared journal on the next command and reports the hint on failure", async () => {
    const d = nodePath.join(tempDir(), "design")
    await expectCli(d, ["new", "D-000", "result <- f(x)"])
    const target = nodePath.join(d, "late.txt")
    const journal = { files: [[target, Buffer.from("late write").toString("base64")]] }
    fs.writeFileSync(nodePath.join(d, ".stepwise-transaction.json"), JSON.stringify(journal))
    await expectCli(d, ["check"])
    expect(fs.readFileSync(target, "utf8")).toBe("late write")
    expect(fs.existsSync(nodePath.join(d, ".stepwise-transaction.json"))).toBe(false)
    expect(readLedger(d).nodes["D-000"].statement).toBe("result <- f(x)")
  })

  it("treats an empty lock file left by the Python CLI as stale and removes its own lock", async () => {
    const d = nodePath.join(tempDir(), "design")
    fs.mkdirSync(d, { recursive: true })
    fs.writeFileSync(nodePath.join(d, ".stepwise.lock"), "")
    await expectCli(d, ["new", "D-000", "result <- f(x)"])
    expect(fs.existsSync(nodePath.join(d, ".stepwise.lock"))).toBe(false)
  })

  it("waits for a live holder and releases the lock afterwards", async () => {
    const d = tempDir()
    const order: string[] = []
    const first = runFs(locked(d, Effect.gen(function* () {
      order.push("first-start")
      yield* Effect.sleep("200 millis")
      order.push("first-end")
    })))
    await new Promise((resolve) => setTimeout(resolve, 50))
    const second = runFs(locked(d, Effect.sync(() => { order.push("second") })))
    await Promise.all([first, second])
    expect(order).toEqual(["first-start", "first-end", "second"])
    expect(fs.existsSync(nodePath.join(d, ".stepwise.lock"))).toBe(false)
  })
})
