/** pathlib-compatible path resolution on top of the Effect FileSystem. */
import { Effect, FileSystem } from "effect"
import * as nodePath from "node:path"
import * as os from "node:os"

/** Path.expanduser() */
export const expandUser = (p: string): string => (p === "~" ? os.homedir() : p.startsWith("~/") ? nodePath.join(os.homedir(), p.slice(2)) : p)

/** Path.resolve() (non-strict): absolute, symlinks in the existing prefix followed, missing tail kept. */
export const resolvePath = Effect.fn("resolvePath")(function* (p: string) {
  const fs = yield* FileSystem.FileSystem
  const absolute = nodePath.resolve(p)
  const tail: string[] = []
  let cursor = absolute
  for (;;) {
    const real = yield* fs.realPath(cursor).pipe(Effect.option)
    if (real._tag === "Some") return tail.length ? nodePath.join(real.value, ...tail.reverse()) : real.value
    const parent = nodePath.dirname(cursor)
    if (parent === cursor) return absolute
    tail.push(nodePath.basename(cursor))
    cursor = parent
  }
})

/** Path.is_relative_to(other) on already-resolved paths. */
export const isRelativeTo = (p: string, other: string): boolean => {
  const r = nodePath.relative(other, p)
  return r === "" || (!r.startsWith("..") && !nodePath.isAbsolute(r))
}

/** [dir, *dir.parents] */
export const withParents = (dir: string): string[] => {
  const out = [dir]
  let cursor = dir
  for (;;) {
    const parent = nodePath.dirname(cursor)
    if (parent === cursor) break
    out.push(parent)
    cursor = parent
  }
  return out
}

export const isDirectory = Effect.fn("isDirectory")(function* (p: string) {
  const fs = yield* FileSystem.FileSystem
  const info = yield* fs.stat(p).pipe(Effect.option)
  return info._tag === "Some" && info.value.type === "Directory"
})

/** True when a platform error reports a missing path. */
export const isNotFound = (error: { reason: { _tag: string } }): boolean => error.reason._tag === "NotFound"
