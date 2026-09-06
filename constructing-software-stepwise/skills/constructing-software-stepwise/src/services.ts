import { Context, Effect, Layer, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

/** Where a command's text goes. Production binds the process streams; batch and tests capture. */
export class Io extends Context.Service<Io, {
  readonly out: (text: string) => void
  readonly err: (text: string) => void
  readonly stdin: Effect.Effect<string>
}>()("stepwise/Io") {}

export const processIo = Layer.succeed(Io, {
  out: (text) => { process.stdout.write(text) },
  err: (text) => { process.stderr.write(text) },
  stdin: Effect.tryPromise({
    try: async () => {
      const chunks: Buffer[] = []
      for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      return Buffer.concat(chunks).toString("utf8")
    },
    catch: () => "",
  }).pipe(Effect.orElseSucceed(() => "")),
})

export interface CapturedIo {
  readonly layer: Layer.Layer<Io>
  readonly output: () => string
  readonly stdout: () => string
  readonly stderr: () => string
}

/** An Io whose streams collect into strings, in arrival order. `stdin` is read lazily, only when a verb asks for it. */
export const captureIo = (stdin: string | Effect.Effect<string> = ""): CapturedIo => {
  const all: string[] = []
  const outs: string[] = []
  const errs: string[] = []
  return {
    layer: Layer.succeed(Io, {
      out: (text) => { all.push(text); outs.push(text) },
      err: (text) => { all.push(text); errs.push(text) },
      stdin: typeof stdin === "string" ? Effect.succeed(stdin) : stdin,
    }),
    output: () => all.join(""),
    stdout: () => outs.join(""),
    stderr: () => errs.join(""),
  }
}

/** Git integration: only HEAD is ever read. */
export class Git extends Context.Service<Git, {
  readonly head: (root: string) => Effect.Effect<string | null>
}>()("stepwise/Git") {}

export const gitLive = Layer.effect(Git, Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  return {
    head: (root: string) => Effect.gen(function* () {
      const handle = yield* ChildProcess.make("git", ["-C", root, "rev-parse", "HEAD"])
      const text = yield* handle.stdout.pipe(Stream.decodeText, Stream.mkString)
      yield* handle.stderr.pipe(Stream.runDrain)
      const code = yield* handle.exitCode
      return code === 0 ? text.trim() : null
    }).pipe(Effect.scoped, Effect.timeoutOption("5 seconds"), Effect.map((o) => (o._tag === "Some" ? o.value : null)), Effect.catchCause(() => Effect.succeed(null)), Effect.provideService(ChildProcessSpawner.ChildProcessSpawner, spawner)),
  }
}))

export const gitNone = Layer.succeed(Git, { head: () => Effect.succeed(null) })
