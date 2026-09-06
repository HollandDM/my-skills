/** Process entry point: real streams, real file system, git via child processes. */
import { Effect, Layer } from "effect"
import * as NodeServices from "@effect/platform-node/NodeServices"
import { run } from "./main.js"
import { gitLive, processIo } from "./services.js"

const layer = Layer.mergeAll(NodeServices.layer, processIo, gitLive.pipe(Layer.provide(NodeServices.layer)))

Effect.runPromise(run(process.argv.slice(2)).pipe(Effect.provide(layer)))
  .then((code) => { process.exitCode = code })
  .catch((error) => {
    process.stderr.write(`error ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
