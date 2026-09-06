/** In-process CLI runner for tests: real file system and git, captured streams. */
import { Effect, Layer } from "effect"
import * as NodeServices from "@effect/platform-node/NodeServices"
import { execFileSync } from "node:child_process"
import * as fs from "node:fs"
import * as os from "node:os"
import * as nodePath from "node:path"
import { run } from "../src/main.js"
import { captureIo, gitLive } from "../src/services.js"

const platform = NodeServices.layer

export interface CliResult {
  rc: number
  output: string
  stdout: string
  stderr: string
}

/** `stepwise <verb> <dir> ...args` with `stdin` supplied; stdout and stderr interleaved in `output`. */
export const cli = async (dir: string, args: readonly string[], stdin = ""): Promise<CliResult> => {
  const captured = captureIo(stdin)
  const layer = Layer.mergeAll(platform, captured.layer, gitLive.pipe(Layer.provide(platform)))
  const rc = await Effect.runPromise(run([args[0], dir, ...args.slice(1)]).pipe(Effect.provide(layer)))
  return { rc, output: captured.output(), stdout: captured.stdout(), stderr: captured.stderr() }
}

/** Like `cli`, asserting the exit code. */
export const expectCli = async (dir: string, args: readonly string[], options: { stdin?: string; ok?: boolean } = {}): Promise<string> => {
  const result = await cli(dir, args, options.stdin ?? "")
  const ok = options.ok ?? true
  if ((result.rc === 0) !== ok) throw new Error(`expected ${ok ? "success" : "failure"} for ${JSON.stringify(args)} (rc=${result.rc}):\n${result.output}`)
  return result.output
}

export const tempDir = (): string => fs.mkdtempSync(nodePath.join(os.tmpdir(), "stepwise-test-"))

export const readJson = <T = Record<string, unknown>>(path: string): T => JSON.parse(fs.readFileSync(path, "utf8")) as T

export const readLedger = (dir: string): Record<string, any> => readJson(nodePath.join(dir, "ledger.json"))

/** Every file under `dir` (relative path -> bytes as base64), for before/after comparisons. */
export const snapshotFiles = (dir: string): Record<string, string> => {
  const out: Record<string, string> = {}
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const full = nodePath.join(entry.parentPath ?? (entry as unknown as { path: string }).path, entry.name)
    out[nodePath.relative(dir, full)] = fs.readFileSync(full).toString("base64")
  }
  return out
}

export const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "Fixture", GIT_AUTHOR_EMAIL: "fixture@example.test", GIT_COMMITTER_NAME: "Fixture", GIT_COMMITTER_EMAIL: "fixture@example.test",
  GIT_AUTHOR_DATE: "2026-01-02T03:04:05Z", GIT_COMMITTER_DATE: "2026-01-02T03:04:05Z",
}

export const git = (repo: string, ...args: string[]): string => execFileSync("git", ["-C", repo, "-c", "commit.gpgsign=false", ...args], { env: GIT_ENV, encoding: "utf8" }).trim()

export const gitInit = (repo: string, files: string[], message = "Initial implementation"): string => {
  execFileSync("git", ["init", "-q", repo], { env: GIT_ENV })
  git(repo, "add", ...files)
  git(repo, "commit", "-qm", message)
  return git(repo, "rev-parse", "HEAD")
}

/** The JSON embedded in an exported reader, plus the number of `<script` tags in the document. */
export const embeddedData = (document: string): { payload: any; scripts: number } => {
  const match = /<script id="stepwise-data" type="application\/json">([\s\S]*?)<\/script>/u.exec(document)
  if (!match) throw new Error("no embedded stepwise-data script")
  return { payload: JSON.parse(match[1]), scripts: document.split("<script").length - 1 }
}
