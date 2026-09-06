/** Translate structured batch operations into CLI arguments; never invoke a shell. */
import { fail } from "./errors.js"

const SHAPES: Record<string, readonly string[]> = {
  adopt: ["statement", "parent"], observe: ["payload", "at"], new: ["statement"], set: ["fields"], body: ["text"],
  terminal: ["target"], approve: ["by"], ready: ["approach", "validation"],
  reopen: ["reason"], stale: ["reason"], retire: ["reason"],
}
const OPTIONAL = new Set(["new.statement", "adopt.statement", "adopt.parent", "approve.by"])
const FLAGGED = new Set(["text", "by", "approach", "validation", "parent", "at"])

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

export const operations = (payload: unknown): string[][] => {
  if (!Array.isArray(payload) || !payload.length) throw fail("expected a nonempty array of operation objects or argument arrays")
  const result: string[][] = []
  for (const item of payload) {
    if (Array.isArray(item) && item.length && item.every((v) => typeof v === "string")) {
      result.push(item as string[])
      continue
    }
    if (!isPlainObject(item) || typeof item.verb !== "string") throw fail("each operation needs a verb")
    const verb = item.verb
    if ("args" in item) {
      if (Object.keys(item).sort().join() !== "args,verb" || !Array.isArray(item.args)) throw fail("generic operations accept only verb and args")
      result.push([verb, ...item.args.map((v) => (typeof v === "string" ? v : JSON.stringify(v)))])
      continue
    }
    const shape = SHAPES[verb]
    if (!shape || Object.keys(item).some((k) => k !== "verb" && k !== "id" && !shape.includes(k))) throw fail(`${verb}: use verb/args for this operation or correct its fields`)
    if (typeof item.id !== "string") throw fail(`${verb}: id is required`)
    const args = [verb, item.id]
    for (const field of shape) {
      if (!(field in item)) {
        if (OPTIONAL.has(`${verb}.${field}`)) continue
        throw fail(`${verb}: ${field} is required`)
      }
      const value = item[field]
      if (field !== "fields" && field !== "payload" && typeof value !== "string") throw fail(`${verb}.${field} must be a string`)
      if (FLAGGED.has(field)) args.push("--" + field)
      args.push(field === "fields" || field === "payload" ? JSON.stringify(value) : (value as string))
    }
    result.push(args)
  }
  return result
}
