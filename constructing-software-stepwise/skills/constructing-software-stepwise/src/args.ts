/** argparse-compatible command-line parsing for every verb (dash-prefixed values with spaces stay positional). */
import { ENTRY_FILE } from "./core.js"
import { repr } from "./pystr.js"

export interface PositionalSpec {
  readonly name: string
  readonly nargs?: "?" | "*" | "+"
  readonly choices?: readonly string[]
}

export interface FlagSpec {
  readonly dest: string
  readonly kind: "store" | "store_true" | "append"
  readonly default?: string | null
  readonly required?: boolean
  readonly choices?: readonly string[]
}

export interface VerbSpec {
  readonly name: string
  readonly positionals: readonly PositionalSpec[]
  readonly flags: Readonly<Record<string, FlagSpec>>
}

export type ArgValue = string | string[] | boolean | null | undefined

export interface Parsed {
  readonly cmd: string
  readonly dir: string
  readonly args: Record<string, ArgValue>
}

export class ParseError extends Error {
  constructor(readonly verb: string | null, message: string) {
    super(message)
  }
}

const store = (dest: string, def: string | null = "", extra: Partial<FlagSpec> = {}): FlagSpec => ({ dest, kind: "store", default: def, ...extra })
const flagTrue = (dest: string): FlagSpec => ({ dest, kind: "store_true" })
const append = (dest: string): FlagSpec => ({ dest, kind: "append" })
const required = (dest: string, extra: Partial<FlagSpec> = {}): FlagSpec => ({ dest, kind: "store", required: true, ...extra })

const verb = (name: string, positionals: PositionalSpec[] = [], flags: Record<string, FlagSpec> = {}): VerbSpec => ({ name, positionals, flags })
const p = (name: string, nargs?: "?" | "*" | "+", choices?: readonly string[]): PositionalSpec => ({ name, nargs, choices })

export const VERBS: readonly VerbSpec[] = [
  verb("html", [], { "--output": store("output") }),
  verb("proposal", [p("id")]),
  verb("repair"),
  verb("frontier"),
  verb("sync", [], { "--repo": store("repo", null) }),
  verb("check"),
  verb("show", [p("id")]),
  verb("status", [], { "--all": flagTrue("all") }),
  verb("new", [p("id"), p("statement", "?")]),
  verb("adopt", [p("id"), p("statement", "?")], { "--parent": store("parent", null) }),
  verb("bind", [p("id"), p("path")], { "--repo": store("repo", null), "--binding": store("binding", null), "--symbol": store("symbol"), "--lines": store("lines", null) }),
  verb("unbind", [p("id"), p("binding")], { "--reason": required("reason") }),
  verb("observe", [p("id"), p("payload", "?")], { "--file": store("file"), "--at": required("at"), "--by": store("by", "agent inspection") }),
  verb("observation", [p("id")]),
  verb("withdraw-evidence", [p("id"), p("evidence")], { "--reason": required("reason"), "--by": store("by", "agent inspection") }),
  verb("scan", [], { "--repo": store("repo", null), "--json": flagTrue("json") }),
  verb("reconcile", [], { "--repo": store("repo", null), "--output": store("output") }),
  verb("set", [p("id"), p("field"), p("value", "*")]),
  verb("body", [p("id")], { "--file": store("file"), "--text": store("text", null) }),
  verb("batch", [], { "--file": store("file") }),
  verb("ready", [p("id")], { "--approach": required("approach"), "--validation": required("validation") }),
  verb("answer", [p("id"), p("slug"), p("name")]),
  verb("terminal", [p("id"), p("target")]),
  verb("approve", [p("id")], { "--by": store("by", "user"), "--actor": store("actor"), "--proposal-hash": store("proposal_hash") }),
  verb("reaffirm", [p("id")], { "--by": store("by"), "--actor": store("actor") }),
  verb("reopen", [p("id"), p("reason")]),
  verb("stale", [p("id"), p("reason")]),
  verb("retire", [p("id"), p("reason")]),
  verb("supersede", [p("id"), p("new_id"), p("reason")]),
  verb("evidence", [p("id")], {
    "--kind": required("kind"), "--ref": required("ref"), "--result": required("result", { choices: ["pass", "fail"] }), "--note": store("note"),
    "--clause": append("clause"), "--covers": append("covers"), "--resolves": append("resolves"),
    "--scope": store("scope", "unspecified", { choices: ["unspecified", "implementation", "composition", "correspondence"] }),
    "--scenario": store("scenario"), "--assessment": store("assessment"),
  }),
  verb("entry", [p("kind", undefined, Object.keys(ENTRY_FILE)), p("heading"), p("definition")], {
    "--source": store("source"), "--avoid": store("avoid"), "--not": store("not_"), "--example": store("example"),
    "--given": store("given"), "--when": store("when"), "--then": store("then"), "--excludes": store("excludes"), "--settles": store("settles"),
  }),
  verb("change", [p("ref")], { "--definition": store("definition"), "--rename": store("rename"), "--status": store("status", "", { choices: ["", "confirmed", "stale"] }), "--reason": required("reason"), "--minor": flagTrue("minor") }),
  verb("meta", [p("field"), p("value", "+")]),
  verb("ambiguity", [p("claim"), p("conflict", "?"), p("resolves_at", "?")], { "--drop": flagTrue("drop") }),
  verb("adr", [p("action", undefined, ["new", "accept", "supersede", "constrains"]), p("title", "?"), p("new_adr", "?")], { "--constrains": store("constrains") }),
]

const BY_NAME = new Map(VERBS.map((v) => [v.name, v]))
export const verbNames = (): string[] => VERBS.map((v) => v.name)

/** argparse's classification of one token: a known flag, an unknown option, or a positional argument. */
const classify = (token: string, spec: VerbSpec): { kind: "flag"; flag: string; inline?: string } | { kind: "positional" } | { kind: "unknown" } => {
  if (!token || token[0] !== "-") return { kind: "positional" }
  if (token in spec.flags) return { kind: "flag", flag: token }
  if (token.length === 1) return { kind: "positional" }
  if (token.includes("=")) {
    const [name, ...rest] = token.split("=")
    if (name in spec.flags) return { kind: "flag", flag: name, inline: rest.join("=") }
  }
  if (token.startsWith("--")) {
    const head = token.split("=")[0]
    const matches = Object.keys(spec.flags).filter((f) => f.startsWith(head))
    if (matches.length > 1) throw new ParseError(spec.name, `ambiguous option: ${head} could match ${matches.join(", ")}`)
    if (matches.length === 1) return token.includes("=") ? { kind: "flag", flag: matches[0], inline: token.slice(token.indexOf("=") + 1) } : { kind: "flag", flag: matches[0] }
  }
  if (/^-\d+(\.\d*)?$/u.test(token)) return { kind: "positional" }
  if (token.includes(" ")) return { kind: "positional" }
  return { kind: "unknown" }
}

const quoteChoices = (choices: readonly string[]): string => choices.map((c) => repr(c)).join(", ")

/** Parse `argv` (without the program name): `<verb> <dir> ...` */
export const parseArgs = (argv: readonly string[]): Parsed => {
  if (!argv.length) throw new ParseError(null, "the following arguments are required: cmd")
  const [name, ...rest] = argv
  const spec = BY_NAME.get(name)
  if (!spec) throw new ParseError(null, `argument cmd: invalid choice: ${repr(name)} (choose from ${quoteChoices(verbNames())})`)
  const args: Record<string, ArgValue> = {}
  for (const f of Object.values(spec.flags)) args[f.dest] = f.kind === "store_true" ? false : f.kind === "append" ? [] : f.default ?? null
  const positional: string[] = []
  const seenFlags = new Set<string>()
  const unknown: string[] = []
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]
    const kind = classify(token, spec)
    if (kind.kind === "positional") {
      positional.push(token)
      continue
    }
    if (kind.kind === "unknown") {
      unknown.push(token)
      continue
    }
    const flag = spec.flags[kind.flag]
    seenFlags.add(kind.flag)
    if (flag.kind === "store_true") {
      if (kind.inline !== undefined) throw new ParseError(spec.name, `argument ${kind.flag}: ignored explicit argument ${repr(kind.inline)}`)
      args[flag.dest] = true
      continue
    }
    let value: string
    if (kind.inline !== undefined) value = kind.inline
    else {
      const next = rest[i + 1]
      if (next === undefined || classify(next, spec).kind !== "positional") throw new ParseError(spec.name, `argument ${kind.flag}: expected one argument`)
      value = next
      i += 1
    }
    if (flag.choices && !flag.choices.includes(value)) throw new ParseError(spec.name, `argument ${kind.flag}: invalid choice: ${repr(value)} (choose from ${quoteChoices(flag.choices)})`)
    if (flag.kind === "append") (args[flag.dest] as string[]).push(value)
    else args[flag.dest] = value
  }
  const specs: PositionalSpec[] = [{ name: "dir" }, ...spec.positionals]
  const fixed = specs.filter((s) => !s.nargs || s.nargs === "+").length
  if (positional.length < fixed) {
    const missing = specs.filter((s) => !s.nargs || s.nargs === "+").slice(positional.length).map((s) => s.name)
    throw new ParseError(spec.name, `the following arguments are required: ${missing.join(", ")}`)
  }
  let cursor = 0
  let spare = positional.length - fixed
  for (const s of specs) {
    if (s.nargs === "*" || s.nargs === "+") {
      const take = (s.nargs === "+" ? 1 : 0) + spare
      args[s.name] = positional.slice(cursor, cursor + take)
      cursor += take
      spare = 0
    } else if (s.nargs === "?") {
      if (spare > 0) {
        args[s.name] = positional[cursor]
        cursor += 1
        spare -= 1
      } else args[s.name] = null
    } else {
      args[s.name] = positional[cursor]
      cursor += 1
    }
    if (s.choices && typeof args[s.name] === "string" && !s.choices.includes(args[s.name] as string)) {
      throw new ParseError(spec.name, `argument ${s.name}: invalid choice: ${repr(args[s.name] as string)} (choose from ${quoteChoices(s.choices)})`)
    }
  }
  const extra = [...positional.slice(cursor), ...unknown]
  if (extra.length) throw new ParseError(spec.name, `unrecognized arguments: ${extra.join(" ")}`)
  for (const [flagName, f] of Object.entries(spec.flags)) if (f.required && !seenFlags.has(flagName)) throw new ParseError(spec.name, `the following arguments are required: ${flagName}`)
  const dir = args.dir as string
  delete args.dir
  return { cmd: spec.name, dir, args }
}

export const usageLine = (verbName: string | null): string => (verbName ? `usage: stepwise ${verbName} [-h] ...` : `usage: stepwise [-h] {${verbNames().join(",")}} ...`)
