/** Every ledger verb. Verbs mutate memory only; `finalize` validates, renders and commits once. */
import { Effect, FileSystem } from "effect"
import * as nodePath from "node:path"
import { Ledger, defaultTitle, refreshLedger, relpath, setHeader } from "./ledger.js"
import type { ArgValue } from "./args.js"
import type { BodyItem, ContextEntry, NodeRecord } from "./types.js"
import {
  CONTRACT_KEYS, ENTRY_FILE, JSON_SET_FIELDS, LEDGER, LIST_FIELDS, LOG, NEXT_STEP, REALIZATION, TEXT_FIELDS, VERIFICATION,
  bodyHash, bodyText, callNames, contractHash, deepCopy, fnOf, intact, isAdrId, isNodeId, itemTag, legalMoves, nodeUnknowns, parseBody,
  proposalHash, stmtKind, targetOk, transition, commaValues,
} from "./core.js"
import { CONTENT_FIELDS, coverage, currentEvidence, fingerprint, validateBehavior } from "./state.js"
import { renderAll, renderNode } from "./render.js"
import { check, deriveDepends, report } from "./check.js"
import * as existing from "./existing.js"
import type { ScanReport } from "./existing.js"
import { Fail, Refused, asFail, fail } from "./errors.js"
import { Io } from "./services.js"
import { commit, locked } from "./transaction.js"
import { renderHtml } from "./html.js"
import { pyJsonDumps } from "./pyjson.js"
import { sha256Hex } from "./hash.js"
import { now, today } from "./time.js"
import { expandUser, resolvePath, withParents } from "./paths.js"
import { isAlpha, isDigit, isLower, ljust, lstrip, maxStr, minStr, partition, pyStr, repr, reprList, reprTuple, sorted, split, splitWs, strip, zfill } from "./pystr.js"

export type Args = Record<string, ArgValue>
export type VerbEffect = Effect.Effect<void, Fail | Refused, Io | FileSystem.FileSystem | import("./services.js").Git>
export type Verb = (led: Ledger, a: Args) => VerbEffect

const s = (a: Args, key: string): string => (a[key] as string | null | undefined) ?? ""
const opt = (a: Args, key: string): string | null => (a[key] as string | null | undefined) ?? null
const list = (a: Args, key: string): string[] => (a[key] as string[] | undefined) ?? []
const flagOf = (a: Args, key: string): boolean => Boolean(a[key])

const out = Effect.fn("out")(function* (text: string) {
  const io = yield* Io
  io.out(text)
})

const need = (led: Ledger, nid: string): Effect.Effect<NodeRecord, Fail> => {
  const n = led.node(nid)
  if (n === undefined) return fail(`${nid}: no such node` + (led.frontier().has(nid) ? " — it is on the frontier; `new` it first" : ""))
  return Effect.succeed(n)
}

export const hist = (n: NodeRecord, event: string, reason = ""): void => {
  ;(n.history ??= []).push({ date: today(), event, ...(reason ? { reason } : {}) })
}

const finish = (led: Ledger, head = ""): Effect.Effect<void> => Effect.sync(() => { if (head) led.messages.push(head) })

const attempt = <A>(thunk: () => A): Effect.Effect<A, Fail> => Effect.try({ try: thunk, catch: (e) => (e instanceof Fail ? e : fail(e instanceof Error ? e.message : String(e))) })

// ----------------------------------------------------------------------------- read-only

export const vFrontier: Verb = (led) => Effect.gen(function* () {
  const io = yield* Io
  const fr = led.frontier()
  for (const fid of sorted(fr.keys())) {
    const [stmt, parent] = fr.get(fid)!
    io.out(`${fid}  frontier  ${stmt}  (child of ${parent})\n`)
  }
  const drafts = Object.entries(led.nodes).filter(([nid, n]) => n.design === "draft" && (n.origin !== "existing-code" || Object.keys(n.contract ?? {}).length || led.dependents(nid).length)).map(([nid]) => nid)
  for (const nid of drafts) io.out(`${nid}  ${led.status(nid)}  ${led.nodes[nid].statement}\n`)
  if (!fr.size && !drafts.length) {
    const anyExisting = Object.values(led.nodes).some((n) => n.origin === "existing-code")
    io.out((anyExisting ? "design frontier empty; use scan for existing-code observation work" : Object.keys(led.nodes).length ? "frontier empty — check approval and leaf readiness" : 'no nodes — `new <dir> D-000 "outcome <- f(x)"`') + "\n")
  }
})

export const vShow: Verb = (led, a) => Effect.gen(function* () {
  yield* need(led, s(a, "id"))
  yield* out(renderNode(led, s(a, "id")))
})

// ----------------------------------------------------------------------------- drafting

export const vNew: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const statement = opt(a, "statement")
  if (id in led.nodes) return yield* fail(`${id} already exists`)
  const fr = led.frontier()
  let code: string
  if (fr.has(id)) {
    const pid = fr.get(id)![1]
    code = led.nodes[pid].body!.find((it) => it.child === id)!.code
  } else if (statement && !Object.keys(led.nodes).length) code = statement
  else if (statement) return yield* fail(`${id} is not on the frontier and a root already exists (${reprList(led.roots())}); pick from \`frontier\``)
  else return yield* fail(`${id} is not on the frontier; a root needs its statement: new <dir> ${id} "outcome <- f(x)"`)
  if (!fnOf(code)) return yield* fail(`statement ${repr(code)} has no call \`f(...)\``)
  led.nodes[id] = { statement: code, gloss: "", effect: "", contract: {}, depends: [], design: "draft", realization: "not-started", verification: "unverified", approved: "" }
  yield* finish(led, `created ${id} \`${code}\` (draft). Next: \`set <dir> ${id} '<json>'\` with gloss, effect, and contract (unknowns as ?slug), then \`answer\`, \`body\`, \`approve\`.`)
})

export const contentEditError = (nid: string, n: NodeRecord): string => {
  if (n.design === "draft") return ""
  if (transition(n.design, "draft") === "reopen") return `${nid} is ${n.design}; \`reopen ${nid} "reason"\` before changing approved design content`
  const state = n.design === "superseded" ? `superseded by ${n.superseded_by ?? "?"}` : n.design
  return `${nid} is ${state}; its historical content cannot be edited`
}

const isWordChar = (ch: string): boolean => /^[\p{L}\p{N}_]$/u.test(ch)

/** Replace an abstract direct call while ignoring strings and member calls. */
export const replaceCallName = (code: string, oldName: string, newName: string): string => {
  let result = ""
  let i = 0
  let quote = ""
  let escaped = false
  while (i < code.length) {
    const ch = code[i]
    if (quote) {
      result += ch
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === quote) quote = ""
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      result += ch
      i += 1
      continue
    }
    if (code.startsWith(oldName, i) && (i === 0 || !(isWordChar(code[i - 1]) || code[i - 1] === "."))) {
      const end = i + oldName.length
      let after = end
      while (after < code.length && code[after] === " ") after += 1
      if ((end === code.length || !isWordChar(code[end])) && after < code.length && code[after] === "(") {
        result += newName
        i = end
        continue
      }
    }
    result += ch
    i += 1
  }
  return result
}

export const renameStatement = (led: Ledger, nid: string, value: string): string => {
  const n = led.nodes[nid]
  const oldName = fnOf(n.statement)
  const newName = fnOf(value)
  const changes: BodyItem[] = []
  if (oldName !== newName) {
    for (const pid of led.parents(nid)) {
      const parent = led.nodes[pid]
      const rows = (parent.body ?? []).filter((line) => (line.child || line.reuse) === nid && callNames(line.code).includes(oldName))
      if (rows.length && parent.design !== "draft") return `reopen parent ${pid} in the same batch before renaming ${nid}; its tagged call still uses ${oldName}(...)`
      changes.push(...rows)
    }
    for (const line of changes) line.code = replaceCallName(line.code, oldName, newName)
  }
  n.statement = value
  return ""
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string")
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

const jsonErrorMessage = (raw: string, error: SyntaxError): string => {
  // CPython reports line/column; approximate them from V8's position when it gives one.
  const at = /position (\d+)/u.exec(error.message)
  if (at) {
    const pos = Number(at[1])
    const before = raw.slice(0, pos)
    const lineno = before.split("\n").length
    const colno = pos - before.lastIndexOf("\n")
    return `invalid JSON set payload at line ${lineno}, column ${colno}: ${error.message}`
  }
  return `invalid JSON set payload at line 1, column 1: ${error.message}`
}

export const vSetJson = (led: Ledger, nid: string, n: NodeRecord, raw: string): VerbEffect => Effect.gen(function* () {
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch (error) {
    return yield* fail(`${nid}: ${jsonErrorMessage(raw, error as SyntaxError)}`)
  }
  if (!isPlainObject(payload)) return yield* fail(`${nid}: JSON set payload must be an object`)
  if (!Object.keys(payload).length) return yield* fail(`${nid}: JSON set payload is empty`)
  const unknown = sorted(Object.keys(payload).filter((k) => !(JSON_SET_FIELDS as readonly string[]).includes(k)))
  if (unknown.length) return yield* fail(`${nid}: unknown JSON field(s) ${unknown.join(", ")}; fields: ${JSON_SET_FIELDS.join(", ")}`)

  const updates: Record<string, unknown> = {}
  for (const [f, value] of Object.entries(payload)) {
    if ((TEXT_FIELDS as readonly string[]).includes(f)) {
      if (typeof value !== "string") return yield* fail(`${nid}: JSON field ${repr(f)} must be a string`)
      if (f === "statement" && !fnOf(strip(value))) return yield* fail(`${nid}: statement ${repr(value)} has no call \`f(...)\``)
      updates[f] = strip(value)
    } else if (f === "contract") {
      if (!isPlainObject(value)) return yield* fail(`${nid}: JSON field 'contract' must be an object of lowercase label to clause`)
      const contract: Record<string, string> = {}
      for (const [label, clause] of Object.entries(value)) {
        if (!isAlpha(label) || !isLower(label)) return yield* fail(`${nid}: contract label ${repr(label)} must be one lowercase word`)
        if (typeof clause !== "string") return yield* fail(`${nid}: contract clause ${repr(label)} must be a string`)
        contract[label] = strip(clause)
      }
      updates[f] = contract
    } else if ((LIST_FIELDS as readonly string[]).includes(f)) {
      if (!isStringArray(value)) return yield* fail(`${nid}: JSON field ${repr(f)} must be an array of strings`)
      updates[f] = value.map((item) => strip(item)).filter((item) => item)
    } else if (f === "depends") {
      if (!isStringArray(value)) return yield* fail(`${nid}: JSON field 'depends' must be an array of entry, node, or ADR names`)
      const deps: string[] = []
      for (const item of value) {
        const ref = led.canonical(item)
        if (!led.resolves(ref)) return yield* fail(`${nid}: ${repr(item)} is not a term / fact / scenario / node / ADR on disk — \`entry\` first`)
        if (!deps.includes(ref)) deps.push(ref)
      }
      updates[f] = deps
    } else if (f === "realization") {
      if (typeof value !== "string" || !(REALIZATION as readonly string[]).includes(value)) return yield* fail(`${nid}: realization must be one of ${reprTuple(REALIZATION)}`)
      updates[f] = value
    } else if (f === "verification") {
      if (value !== coverage(n).status) return yield* fail(`${nid}: verification is derived from current clause evidence; use \`evidence --clause LABEL\``)
    } else if (f === "implementation_plan") {
      if (!isPlainObject(value) || Object.keys(value).sort().join() !== "approach,validation" || !Object.values(value).every((v) => typeof v === "string" && strip(v))) {
        return yield* fail(`${nid}: implementation_plan needs nonempty approach and validation strings`)
      }
      updates[f] = value
    } else if (f === "behavior") {
      const why = validateBehavior(value)
      if (why) return yield* fail(`${nid}: ${why}`)
      updates[f] = value
    }
  }

  const contentFields = CONTENT_FIELDS as readonly string[]
  const semanticChanged = Object.entries(updates).some(([f, value]) => contentFields.includes(f) && !same(n[f], value))
  const historicalChanged = ["superseded", "retired"].includes(n.design) && Object.entries(updates).some(([f, value]) => contentFields.includes(f) && !same(n[f], value))
  if (semanticChanged || historicalChanged) {
    const why = contentEditError(nid, n)
    if (why) return yield* fail(why)
  }
  if ("statement" in updates) {
    const statement = updates.statement as string
    delete updates.statement
    const why = renameStatement(led, nid, statement)
    if (why) return yield* fail(why)
  }
  Object.assign(n, updates)
  const fields = Object.keys(payload).join(", ")
  yield* finish(led, `${nid} set from JSON: ${fields}` + (nodeUnknowns(n).length ? `; open ?: ${reprList(nodeUnknowns(n))}` : ""))
})

const startsJson = (f: string): boolean => lstrip(f).startsWith("{") || lstrip(f).startsWith("[")

export const vSet: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  const f = s(a, "field")
  const vals = list(a, "value")
  if (!vals.length && startsJson(f)) return yield* vSetJson(led, id, n, f)
  if (!vals.length) return yield* fail(`${id}: field ${repr(f)} needs a value; for several fields pass one quoted JSON object`)
  if (startsJson(f)) return yield* fail(`${id}: JSON set payload must be passed as one quoted argument`)
  const contractField = (CONTRACT_KEYS as readonly string[]).includes(f) || (isAlpha(f) && isLower(f) && ![...LIST_FIELDS, "realization", "verification", "depends"].includes(f))
  const textOrList = [...TEXT_FIELDS, ...LIST_FIELDS, "depends"].includes(f)
  if (["superseded", "retired"].includes(n.design) && (textOrList || contractField)) return yield* fail(contentEditError(id, n))
  if ((CONTENT_FIELDS as readonly string[]).includes(f) || contractField) {
    const why = contentEditError(id, n)
    if (why) return yield* fail(why)
  }
  if ((TEXT_FIELDS as readonly string[]).includes(f)) {
    if (f === "statement" && !fnOf(strip(vals.join(" ")))) return yield* fail(`${id}: statement has no call \`f(...)\``)
    if (f === "statement") {
      const why = renameStatement(led, id, strip(vals.join(" ")))
      if (why) return yield* fail(why)
    } else n[f] = strip(vals.join(" "))
  } else if (contractField) {
    ;(n.contract ??= {})[f] = strip(vals.join(" "))
  } else if ((LIST_FIELDS as readonly string[]).includes(f)) {
    n[f] = vals.map((v) => strip(v)).filter((v) => v)
  } else if (f === "depends") {
    const deps = (n.depends ??= [])
    if (vals.length === 1 && vals[0] === "-") {
      deps.length = 0
      return yield* finish(led, `${id}.depends cleared`)
    }
    for (const v of vals) {
      const ref = led.canonical(v)
      if (!led.resolves(ref)) return yield* fail(`${repr(v)} is not a term / fact / scenario / node / ADR on disk — \`entry\` first`)
      if (!deps.includes(ref)) deps.push(ref)
    }
    return yield* finish(led, `${id}.depends = ${reprList(deps)}`)
  } else if (f === "realization") {
    if (!(REALIZATION as readonly string[]).includes(vals[0])) return yield* fail(`realization must be one of ${reprTuple(REALIZATION)}`)
    n[f] = vals[0]
  } else if (f === "verification") {
    if (vals[0] !== coverage(n).status) return yield* fail("verification is derived from current clause evidence; use `evidence --clause LABEL`")
  } else {
    return yield* fail(`unknown field ${repr(f)}; fields: ${reprTuple([...TEXT_FIELDS, ...CONTRACT_KEYS, ...LIST_FIELDS, "realization", "verification"])}`)
  }
  yield* finish(led, `${id}.${f} set` + (nodeUnknowns(n).length ? `; open ?: ${reprList(nodeUnknowns(n))}` : ""))
})

export const vBody: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  const why = contentEditError(id, n)
  if (why) return yield* fail(why)
  const file = s(a, "file")
  const text = opt(a, "text")
  if (file && text !== null) return yield* fail("body accepts --file or --text, not both")
  const fs = yield* FileSystem.FileSystem
  const io = yield* Io
  const source = text !== null ? text : file ? yield* fs.readFileString(file).pipe(Effect.mapError((e) => fail(e.message))) : yield* io.stdin
  const items = yield* attempt(() => parseBody(source, fnOf(n.statement)))
  if (!items.length) return yield* fail("empty body")
  n.body = items
  delete n.implementation_plan
  delete n.target
  autotag(led, id)
  const fresh = n.body.filter((it) => it.child && !(it.child in led.nodes)).map((it) => it.child!)
  yield* finish(led, `${id} body: ${items.length} lines; children ${fresh.length ? reprList(sorted(new Set(fresh))) : "none new"}`)
})

export const autotag = (led: Ledger, nid: string): void => {
  const byFn = new Map<string, string[]>()
  for (const [oid, o] of Object.entries(led.nodes)) {
    const name = fnOf(o.statement)
    if (oid !== nid && name) {
      if (!byFn.has(name)) byFn.set(name, [])
      byFn.get(name)!.push(oid)
    }
  }
  for (const it of led.nodes[nid].body ?? []) {
    if (stmtKind(it.code) !== "stmt" || "child" in it || "reuse" in it || "target" in it) continue
    const calls = callNames(it.code)
    if (calls.length === 1 && byFn.get(calls[0])?.length === 1) it.child = byFn.get(calls[0])![0]
  }
}

export const vAnswer: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  const why = contentEditError(id, n)
  if (why) return yield* fail(why)
  const slug = lstrip(s(a, "slug"), "?")
  if (!nodeUnknowns(n).includes(slug)) return yield* fail(`${id} has no ?${slug}; open: ${nodeUnknowns(n).length ? reprList(nodeUnknowns(n)) : "none"}`)
  const name = s(a, "name")
  const ref = led.canonical(name)
  if (!led.resolves(ref)) return yield* fail(`${repr(name)} is not on disk — \`entry <dir> term|fact|scenario "${name}" "<definition>"\` first`)
  const sub = (t: string): string => t.split(" ").map((w) => {
    const tail = w.slice(slug.length + 1)
    return w.startsWith("?" + slug) && ["", ",", ".", ";", ":", ")", "]"].includes(w.slice(slug.length + 1, slug.length + 2)) ? ref + tail : w
  }).join(" ")
  for (const f of TEXT_FIELDS) n[f] = sub(n[f] ?? "")
  n.contract = Object.fromEntries(Object.entries(n.contract ?? {}).map(([k, v]) => [k, sub(v)]))
  n.depends ??= []
  if (!n.depends.includes(ref)) n.depends.push(ref)
  const left = nodeUnknowns(n)
  yield* finish(led, `${id}: ?${slug} -> ${ref}; depends += ${ref}` + (left.length ? `; open: ${reprList(left)}` : "; no ? left — propose the refinement"))
})

export const vTerminal: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  const why = contentEditError(id, n)
  if (why) return yield* fail(why)
  const t = strip(strip(s(a, "target")), "`")
  const bad = targetOk(t)
  if (bad) return yield* fail(bad)
  if (n.body?.length && !led.isCollapsed(n)) return yield* fail(`${id} has child statements; a terminal has no body (drop it) — or collapse: tag every statement \`-- ⇒ <target>: <identifier>\``)
  n.target = t
  delete n.implementation_plan
  yield* finish(led, `${id} terminal ⇒ ${t}. Add \`set <dir> ${id} '{"adaptation":["<clause> → <real>"]}'\` when shape changes, then \`approve ${id}\``)
})

export const vProposal: Verb = (led, a) => Effect.gen(function* () {
  const n = yield* need(led, s(a, "id"))
  deriveDepends(led)
  yield* out(`proposal ${s(a, "id")} ${proposalHash(n)}\n`)
})

export const vApprove: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  deriveDepends(led)
  const problems: string[] = []
  const actor = strip(s(a, "actor")) || strip(s(a, "by"))
  const actorFlag = s(a, "actor")
  const hash = s(a, "proposal_hash")
  if (!actor) problems.push("approval actor missing; pass --by or --actor")
  if (actorFlag && !hash) problems.push("proposal hash missing; use proposal then --proposal-hash with --actor")
  if (hash && hash !== proposalHash(n)) problems.push(`approval hash does not match current proposal ${proposalHash(n)}`)
  if (nodeUnknowns(n).length) problems.push(`unresolved ?${nodeUnknowns(n).join(", ?")} — \`answer\` each`)
  for (const f of ["gloss", "effect"] as const) if (!n[f]) problems.push(`${f} empty — \`set ${id} ${f} ...\``)
  if (Object.values(n.contract ?? {}).some((clause) => !strip(clause))) problems.push("contract clauses must be nonempty")
  if (!Object.keys(n.contract ?? {}).length) problems.push(`contract empty — \`set ${id} pre|post|failure|invariant ...\``)
  const body = n.body ?? []
  if (!body.length && !n.target && !n.implementation_plan) problems.push("needs a body, terminal target, or bounded `ready` implementation plan")
  if (body.length && !(n.walkthrough?.length)) problems.push(`walkthrough missing — \`set ${id} walkthrough "..."\` (what the function does)`)
  if (body.length && !led.isCollapsed(n) && !(n.composition?.length)) problems.push(`composition missing — \`set ${id} composition ...\``)
  for (const it of body) {
    const tagged = "child" in it ? "child" : "reuse" in it ? "reuse" : "target" in it ? "target" : ""
    const known = led.nodes[it.child || it.reuse || ""]?.gloss
    if (tagged && !it.gloss && !known) {
      const how = tagged === "child" ? `-- ${it.child}: <one line>` : `-- ${itemTag(it)} -- <one line>`
      problems.push(`${repr(it.code)} says nothing about what it does — tag it \`${how}\``)
    }
  }
  for (const it of body) {
    if (stmtKind(it.code) === "stmt" && !("child" in it || "reuse" in it || "target" in it) && callNames(it.code).length) problems.push(`untagged call ${repr(it.code)}`)
  }
  if (n.target) {
    const why = targetOk(n.target)
    if (why) problems.push(why)
  }
  if (n.adr_pending) problems.push(`${n.adr_pending} pending — \`adr accept ${n.adr_pending}\` after the user accepts it`)
  if (problems.length) return yield* new Refused({ lines: [`refused ${id}:`, ...problems.map((p) => `  - ${p}`)] })
  if (transition(n.design, "approved") === undefined) {
    const legal = legalMoves(n.design)
    return yield* fail(`${id} is ${n.design}; \`approve\` moves a draft. From ${n.design}: ${legal.join(", ") || "none"}`)
  }
  const reApproval = Boolean(n.approved)
  const contractChanged = reApproval && (n.contract_hash ?? contractHash(n)) !== contractHash(n)
  delete n.stale_by
  n.design = "approved"
  n.approved = `${today()} by ${actor}`
  n.approved_by = actor
  n.proposal_hash = proposalHash(n)
  n.approved_at = now()
  n.revision = (n.revision ?? 0) + 1
  n.approved_content_hash = fingerprint(n)
  n.approved_hash = bodyHash(body)
  n.contract_hash = contractHash(n)
  if (reApproval) hist(n, "re-approved")
  const cascaded = contractChanged ? cascadeStale(led, id, "contract changed") : []
  const ambs = led.data!.ambiguities ?? []
  const resolved = ambs.filter((x) => x.resolves_at === id).map((x) => x.claim)
  led.data!.ambiguities = ambs.filter((x) => x.resolves_at !== id)
  yield* finish(led, `approved ${id}`
    + (cascaded.length ? `; contract changed, now stale: ${cascaded.join(", ")}` : "")
    + (resolved.length ? `; resolved ambiguities dropped: ${resolved.join(", ")}` : ""))
  const fr = led.frontier()
  const fresh = body.filter((it) => it.child && fr.has(it.child)).map((it) => it.child!)
  if (fresh.length) yield* out(`next: \`new <dir> ${fresh[0]}\`  (frontier: ${sorted(fr.keys()).join(", ")})\n`)
  else if (!fr.size && !Object.values(led.nodes).some((x) => x.design === "draft")) yield* out("frontier empty — check remaining stale or unapproved nodes before declaring completion\n")
})

const flip = (led: Ledger, nid: string, design: string, event: string, reason: string, extra: Record<string, unknown> = {}): VerbEffect => Effect.gen(function* () {
  const n = yield* need(led, nid)
  const verb = transition(n.design, design)
  if (verb === undefined) {
    const legal = legalMoves(n.design)
    return yield* fail(`${nid} is ${n.design}; it cannot become ${design}. From ${n.design} the legal moves are: ${legal.join(", ") || "none"}`)
  }
  if (design !== "stale") delete n.stale_by
  n.design = design
  Object.assign(n, extra)
  if (design !== "approved" && n.verification === "verified") n.verification = "stale"
  hist(n, event, reason)
  const cascaded = ["stale", "superseded", "retired"].includes(design) ? cascadeStale(led, nid, event) : []
  yield* finish(led, `${nid} -> ${led.status(nid)}` + (cascaded.length ? `; now stale: ${cascaded.join(", ")}` : ""))
})

export const vReopen: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const reason = s(a, "reason")
  const n = led.nodes[id]
  if (n && ["approved", "stale", "retired"].includes(n.design)) {
    const content: Record<string, unknown> = {}
    for (const f of CONTENT_FIELDS) if (f in n) content[f] = deepCopy(n[f])
    ;(n.revisions ??= []).push({ date: now(), reason, approved: n.approved ?? null, revision: n.revision ?? 0, content })
  }
  if (n && n.body?.length) {
    // keep the refinement being replaced as a record
    const record: Record<string, unknown> = { date: today(), reason }
    for (const f of ["body", "composition", "decisions", "deferred"] as const) if ((n[f] as unknown[] | undefined)?.length) record[f] = n[f]
    n.superseded = record
  }
  yield* flip(led, id, "draft", "reopened", reason)
})

/** The design dropped this node: no body calls it any more and none should. */
export const vRetire: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  if (led.parents(id).length) return yield* fail(`${id} is still called by ${led.parents(id).join(", ")}; remove the call first, or this node is not retired`)
  yield* flip(led, id, "retired", "retired", s(a, "reason"))
})

/** Entries this node depends on that changed after it was approved — the reason it is stale. */
export const changedDeps = (led: Ledger, n: NodeRecord): string[] => {
  const since = n.approved_at ?? ""
  const result: string[] = []
  for (const r of n.depends ?? []) {
    if (isNodeId(r)) {
      const u = led.nodes[r]
      if (u && (["stale", "superseded", "retired"].includes(u.design) || (u.approved_at ?? "") > since)) result.push(`${r} (${led.status(r)})`)
    } else {
      const e = led.entry(r)
      if (e) {
        const last = maxStr((e[2].changed ?? []).map((c) => c.at), "")
        if (last > since) result.push(`${e[1]} (${last.slice(0, 10)})`)
      }
    }
  }
  return result
}

/** origin's contract changed or died; every approved node downstream of it rests on the old one, so it is stale. */
export const cascadeStale = (led: Ledger, origin: string, why: string): string[] => {
  const seen = new Set([origin])
  const queue = led.dependents(origin)
  const result: string[] = []
  while (queue.length) {
    const nid = queue.pop()!
    if (seen.has(nid)) continue
    seen.add(nid)
    queue.push(...led.dependents(nid)) // a dead contract travels the whole graph, not one hop
    const n = led.nodes[nid]
    if (n.design !== "approved") continue
    n.design = "stale"
    n.stale_by = [`${origin} (${why} ${today()})`]
    if (n.verification === "verified") n.verification = "stale"
    hist(n, "stale", `${origin} ${why}`)
    result.push(nid)
  }
  return sorted(result)
}

export const vStale: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = led.nodes[id]
  if (n !== undefined) n.stale_by = changedDeps(led, n)
  yield* flip(led, id, "stale", "stale", s(a, "reason"))
})

/** A dependency's contract moved and cascaded this node stale, but the node itself is untouched. */
export const vReaffirm: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  if (n.design !== "stale") return yield* fail(`${id} is ${n.design}; \`reaffirm\` returns a stale node, nothing else`)
  const actor = strip(s(a, "actor")) || strip(s(a, "by"))
  if (!actor) return yield* fail(`approval actor missing — pass \`--actor <name>\`; a reaffirmation is still someone accepting ${id}`)
  if (!intact(n)) {
    return yield* fail(`${id} changed since it was approved; \`reopen ${id} "<reason>"\` then \`proposal\` + \`approve\` — `
      + "reaffirm only returns a node whose own statement, contract and body are untouched")
  }
  const why = (n.stale_by ?? []).join(", ") || "changed dependencies"
  delete n.stale_by
  n.design = "approved"
  n.approved = `${n.approved || today()}; reaffirmed ${today()} by ${actor}`
  n.approved_by = actor
  n.approved_at = now() // the node now stands against the dependency as it is today
  n.revision = (n.revision ?? 0) + 1
  hist(n, "reaffirmed", why)
  yield* refreshLedger(led)
  yield* finish(led, `reaffirmed ${id} against ${why}; verification stays ${n.verification}`)
})

export const vSupersede: Verb = (led, a) => Effect.gen(function* () {
  const newId = s(a, "new_id")
  if (!led.resolves(newId)) return yield* fail(`${newId} does not exist and is not on the frontier`)
  yield* flip(led, s(a, "id"), "superseded", "superseded", s(a, "reason"), { superseded_by: newId })
})

export const vEvidence: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  const result = s(a, "result")
  const note = s(a, "note")
  const assessment = s(a, "assessment")
  const kind = s(a, "kind")
  const scenario = s(a, "scenario")
  const scope = s(a, "scope")
  const withdrawnWord = (t: string): boolean => strip(t).toLowerCase().startsWith("withdrawn") || strip(t).toLowerCase().startsWith("retracted")
  if (result === "pass" && (withdrawnWord(note) || withdrawnWord(assessment))) return yield* fail("withdrawn evidence cannot be passing evidence; use withdraw-evidence")
  if (scope === "unspecified" || !strip(assessment)) return yield* fail("evidence requires --scope implementation|composition|correspondence and --assessment explaining what it establishes and its limits")
  if (["test", "e2e", "integration", "property"].some((word) => kind.toLowerCase().includes(word)) && !strip(scenario)) return yield* fail("test evidence requires --scenario naming the exercised path and configuration")
  const clauses = commaValues([...list(a, "clause"), ...list(a, "covers")])
  if (!clauses.length) return yield* fail("evidence requires --clause LABEL or --covers LABEL[,LABEL]")
  const missing = clauses.filter((c) => !(c in (n.contract ?? {})))
  if (missing.length) return yield* fail(`unknown contract clauses: ${sorted(missing).join(", ")}`)
  if (n.design !== "approved") return yield* fail("approve the current design before recording scoped evidence")
  yield* refreshLedger(led)
  const resolves = commaValues(list(a, "resolves"))
  if (resolves.length && result !== "pass") return yield* fail("only passing evidence can resolve failed evidence")
  const current = new Map(currentEvidence(n))
  for (const ref of resolves) {
    const ev = current.get(ref)
    if (!ev || ev.withdrawn || ev.result !== "fail") return yield* fail(`${ref} is not current failed evidence on ${id}`)
    if (!(ev.clauses ?? []).every((c) => clauses.includes(c))) return yield* fail(`resolving ${ref} must cover every failed obligation`)
  }
  ;(n.evidence ??= []).push({
    date: now(), kind, ref: s(a, "ref"), result, clauses, resolves, revision: n.revision ?? 0, content_hash: fingerprint(n), dependency_hash: n.evidence_context!,
    scope, scenario, assessment, ...(note ? { note } : {}),
  })
  n.verification = coverage(n).status
  yield* finish(led, `${id} evidence EV-${n.evidence.length}; verification ${n.verification}; missing clauses ${reprList(coverage(n).missing)}`)
})

export const vWithdrawEvidence: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  const evidence = s(a, "evidence")
  const index = evidence.startsWith("EV-") && isDigit(evidence.slice(3)) ? parseInt(evidence.slice(3), 10) : NaN
  if (Number.isNaN(index) || !(1 <= index && index <= (n.evidence ?? []).length)) return yield* fail("expected an existing EV-N evidence identifier")
  const reason = s(a, "reason")
  if (!strip(reason)) return yield* fail("withdrawal requires a reason")
  const ev = n.evidence![index - 1]
  if (ev.withdrawn) return yield* fail("evidence is already withdrawn")
  ev.withdrawn = { date: now(), by: s(a, "by"), reason }
  hist(n, "evidence withdrawn", evidence + ": " + reason)
  yield* finish(led, id + " withdrew " + evidence)
})

export const vObservation: Verb = (led, a) => Effect.gen(function* () {
  const n = yield* need(led, s(a, "id"))
  const obs = n.observation
  if (!obs) return yield* fail("no observation recorded")
  const payload: Record<string, unknown> = {}
  for (const k of ["effect", "claims", "unknowns", "behavior", "comparisons"]) if (k in obs) payload[k] = deepCopy(obs[k])
  payload.pseudocode = bodyText(obs.body ?? [], 0).join("\n")
  yield* out(pyJsonDumps(payload, { indent: 2, ensureAscii: false }) + "\n")
})

export const vReady: Verb = (led, a) => Effect.gen(function* () {
  const id = s(a, "id")
  const n = yield* need(led, id)
  const why = contentEditError(id, n)
  if (why) return yield* fail(why)
  const approach = s(a, "approach")
  const validation = s(a, "validation")
  if (!strip(approach) || !strip(validation)) return yield* fail("ready requires a bounded implementation approach and a validation plan")
  delete n.body
  delete n.target
  n.implementation_plan = { approach: strip(approach), validation: strip(validation) }
  yield* finish(led, `${id} implementation-ready; approve its contract and plan`)
})

// ----------------------------------------------------------------------------- shared context

export const vEntry: Verb = (led, a) => Effect.gen(function* () {
  const kind = s(a, "kind")
  const f = ENTRY_FILE[kind]
  const data = led.data!
  const store = ((data as Record<string, unknown>)[f] ??= {}) as Record<string, ContextEntry>
  let heading = strip(s(a, "heading"))
  let key: string
  let e: ContextEntry
  if (kind === "term") {
    if (led.entry(heading)) return yield* fail(`${repr(heading)} already exists; \`change <dir> "${heading}" --definition ... --reason ...\``)
    key = heading
    e = { definition: strip(s(a, "definition")), confirmed: today() }
    if (s(a, "avoid")) e.avoid = s(a, "avoid").split(",").map((x) => strip(x)).filter((x) => x)
    if (s(a, "not_")) e.not = s(a, "not_").split(",").map((x) => strip(x)).filter((x) => x)
    if (s(a, "example")) e.example = s(a, "example")
  } else {
    const prefix = kind === "fact" ? "CTX-F" : "CTX-S"
    const head = split(heading, " ", 1)[0]
    if (isCtxIdLike(head)) {
      key = head
      heading = heading.includes(" ") ? strip(split(heading, " ", 1)[1]) : ""
      if (key in store) return yield* fail(`${key} already exists; \`change <dir> ${key} ...\``)
    } else {
      key = `${prefix}${zfill(Math.max(0, ...Object.keys(store).map((k) => parseInt(k.slice(5), 10))) + 1, 2)}`
    }
    e = { name: heading, definition: strip(s(a, "definition")), confirmed: today() }
    if (kind === "fact") e.status = "confirmed"
    else for (const w of ["given", "when", "then", "excludes", "settles"] as const) if (s(a, w)) e[w] = strip(s(a, w))
  }
  if (s(a, "source")) e.source = s(a, "source")
  store[key] = e
  yield* finish(led, `entry ${f}/${key}` + (kind !== "term" ? ` ${heading}` : "") + `; refer to it as \`${key}\``)
})

const isCtxIdLike = (v: string): boolean => (v.startsWith("CTX-F") || v.startsWith("CTX-S")) && isDigit(v.slice(5))

export const vChange: Verb = (led, a) => Effect.gen(function* () {
  const ref = s(a, "ref")
  const hit = led.entry(ref)
  if (!hit) return yield* fail(`${repr(ref)}: no term / fact / scenario`)
  let [f, key] = hit
  const e = hit[2]
  if (s(a, "definition")) e.definition = strip(s(a, "definition"))
  if (s(a, "status")) {
    if (f !== "facts") return yield* fail("--status applies to facts only")
    e.status = s(a, "status")
  }
  if (s(a, "rename")) {
    const head = strip(s(a, "rename"))
    const store = led.data![f] as Record<string, ContextEntry>
    if (f === "terms") { // terms are keyed by their name; facts and scenarios by their CTX id
      if (head in store) return yield* fail(`${repr(head)} already exists`)
      const entry = store[key]
      delete store[key]
      store[head] = entry
      for (const n of Object.values(led.nodes)) n.depends = (n.depends ?? []).map((x) => (x === key ? head : x))
      for (const x of led.data!.ambiguities ?? []) if (x.claim === key) x.claim = head
      key = head
    } else e.name = head
  }
  if (flagOf(a, "minor")) return yield* finish(led, `${f}/${key} reworded (minor, no invalidation)`)
  const reason = s(a, "reason")
  ;(e.changed ??= []).push({ at: now(), reason })
  const users = led.usedBy()[key] ?? []
  for (const nid of users) {
    const n = led.nodes[nid]
    if (n && n.design === "approved") {
      n.design = "stale"
      n.stale_by = [key]
      hist(n, "stale", `${key} changed: ${reason}`)
      cascadeStale(led, nid, `${key} changed`)
    }
  }
  yield* finish(led, `${f}/${key} changed; dependents to re-check: ${users.join(", ") || "none"} (\`stale\` or \`reopen\`+\`approve\` each approved one)`)
})

export const vMeta: Verb = (led, a) => Effect.gen(function* () {
  const field = s(a, "field")
  const values = list(a, "value")
  if (field === "title" || field === "scope") led.data![field] = strip(values.join(" "))
  else if (field === "nongoals") led.data!.nongoals = values.map((v) => strip(v)).filter((v) => v)
  else return yield* fail("meta field must be title | scope | nongoals")
  yield* finish(led, `${field} set`)
})

export const vAmbiguity: Verb = (led, a) => Effect.gen(function* () {
  const claim = s(a, "claim")
  const data = led.data!
  data.ambiguities ??= []
  data.ambiguities = data.ambiguities.filter((x) => x.claim.toLowerCase() !== strip(claim).toLowerCase())
  if (flagOf(a, "drop")) return yield* finish(led, `ambiguity ${repr(claim)} dropped`)
  const conflict = opt(a, "conflict")
  const at = opt(a, "resolves_at")
  if (!conflict || !at) return yield* fail('ambiguity <dir> "claim" "conflict" D-NNN   (or --drop)')
  if (!isNodeId(at)) return yield* fail(`${repr(at)} is not a D-NNN id`)
  data.ambiguities.push({ claim: strip(claim), conflict: strip(conflict), resolves_at: at })
  yield* finish(led, `ambiguity ${repr(claim)} -> resolves at ${at}`)
})

const ADR_STUB = (id: string, titleText: string, date: string, constrains: string): string => `# ${id} — ${titleText}

Kind: adr · Status: proposed · Date: ${date}
Constrains: ${constrains}
Supersedes: — · Superseded by: —

<1–3 sentences: what's the context, what did we decide, and why.>

## Invariants imposed

- <one line: property every constrained refinement must preserve>
`

export const vAdr: Verb = (led, a) => Effect.gen(function* () {
  const action = s(a, "action")
  const titleArg = opt(a, "title")
  const constrainsArg = s(a, "constrains")
  const ids = constrainsArg.split(",").map((w) => strip(w)).filter((w) => isNodeId(w))
  if (action === "new") {
    if (!titleArg || !ids.length) return yield* fail('adr <dir> new "Title" --constrains D-NNN[,D-MMM]')
    const parents = withParents(led.dir).slice(1)
    const adrDir = led.adrDir() ?? (parents.length > 1 ? nodePath.join(parents[1], "adr") : nodePath.join(led.dir, "adr"))
    const num = Math.max(0, ...led.adrs().filter((x) => isAdrId(x.id)).map((x) => parseInt(x.id.slice(4), 10))) + 1
    const slug = splitWs(Array.from(titleArg).map((c) => (/^[\p{L}\p{N}]$/u.test(c) ? c.toLowerCase() : " ")).join("")).join("-").slice(0, 50)
    const path = nodePath.join(adrDir, `${zfill(num, 4)}-${slug}.md`)
    const aid = `ADR-${zfill(num, 4)}`
    led.files.set(path, ADR_STUB(aid, strip(titleArg), today(), ids.join(", ")))
    for (const nid of ids) {
      if (nid in led.nodes) {
        led.nodes[nid].adr_pending = aid
        if (led.nodes[nid].design === "approved") {
          led.nodes[nid].design = "draft"
          hist(led.nodes[nid], "reopened", `${aid} proposed`)
        }
      }
    }
    return yield* finish(led, `created ${relpath(path, process.cwd())} (${aid}, proposed). Write the paragraph + invariants by hand, then \`sync\`; after the user accepts: \`adr accept ${aid}\``)
  }
  if (action === "accept") {
    const adr = led.adrs().find((x) => x.id === titleArg)
    if (!adr) return yield* fail(`${pyRepr(titleArg)}: no such ADR`)
    const lines = adr.lines
    setHeader(lines, "Status", "accepted")
    led.files.set(adr.path, lines.join("\n") + "\n")
    const freed = Object.entries(led.nodes).filter(([, n]) => n.adr_pending === adr.id).map(([nid]) => nid)
    for (const nid of freed) delete led.nodes[nid].adr_pending
    return yield* finish(led, `${adr.id} accepted; unblocked ${freed.join(", ") || "nothing"}`)
  }
  if (action === "constrains") {
    const adr = led.adrs().find((x) => x.id === titleArg)
    if (!adr) return yield* fail(`${pyRepr(titleArg)}: no such ADR`)
    if (!ids.length) return yield* fail("adr <dir> constrains ADR-NNNN --constrains D-NNN[,D-MMM]")
    const missing = ids.filter((x) => !led.resolves(x))
    if (missing.length) return yield* fail(`${missing.join(", ")}: not a node or frontier id`)
    setHeader(adr.lines, "Constrains", ids.join(", "))
    led.files.set(adr.path, adr.lines.join("\n") + "\n")
    return yield* finish(led, `${adr.id} constrains ${ids.join(", ")}`)
  }
  if (action === "supersede") {
    const byId = new Map(led.adrs().map((x) => [x.id, x]))
    const old = byId.get(titleArg ?? "")
    const fresh = byId.get(opt(a, "new_adr") ?? "")
    if (!old || !fresh) return yield* fail("adr <dir> supersede ADR-OLD ADR-NEW (both must exist)")
    setHeader(old.lines, "Status", "superseded")
    setHeader(old.lines, "Superseded by", fresh.id)
    setHeader(fresh.lines, "Supersedes", old.id)
    led.files.set(old.path, old.lines.join("\n") + "\n")
    led.files.set(fresh.path, fresh.lines.join("\n") + "\n")
    return yield* finish(led, `${old.id} superseded by ${fresh.id}`)
  }
  return yield* fail("adr <dir> new ... | accept ADR-NNNN | supersede ADR-OLD ADR-NEW | constrains ADR-NNNN --constrains D-NNN")
})

const pyRepr = (v: string | null): string => (v === null ? "None" : repr(v))

// ----------------------------------------------------------------------------- existing code

export const vAdopt: Verb = (led, a) => Effect.gen(function* () {
  const statement = opt(a, "statement")
  if (statement && !fnOf(statement)) return yield* fail("an adopted statement needs an abstract call such as result <- process(input)")
  const message = yield* attempt(() => existing.adopt(led, s(a, "id"), statement, opt(a, "parent")))
  yield* finish(led, message)
})

export const vBind: Verb = (led, a) => Effect.gen(function* () {
  yield* need(led, s(a, "id"))
  const message = yield* existing.bind(led, s(a, "id"), s(a, "path"), { root: opt(a, "repo"), bindingId: opt(a, "binding"), symbol: s(a, "symbol"), lines: opt(a, "lines") })
  yield* finish(led, message)
})

export const vUnbind: Verb = (led, a) => Effect.gen(function* () {
  yield* need(led, s(a, "id"))
  const message = yield* attempt(() => existing.unbind(led, s(a, "id"), s(a, "binding"), s(a, "reason")))
  yield* finish(led, message)
})

export const vObserve: Verb = (led, a) => Effect.gen(function* () {
  yield* need(led, s(a, "id"))
  const file = s(a, "file")
  const payloadArg = opt(a, "payload")
  if (Boolean(file) === Boolean(payloadArg)) return yield* fail("observe needs either a JSON payload argument or --file")
  const fs = yield* FileSystem.FileSystem
  const raw = file ? yield* fs.readFileString(file).pipe(Effect.mapError((e) => fail(e.message))) : payloadArg!
  const payload = yield* attempt(() => JSON.parse(raw) as unknown)
  yield* refreshLedger(led)
  const message = yield* existing.observe(led, s(a, "id"), payload, s(a, "at"), s(a, "by"))
  yield* finish(led, message)
})

export const scanText = (rep: ScanReport): string => {
  const lines: string[] = []
  for (const [nid, row] of Object.entries(rep.nodes)) {
    lines.push(`${nid} ${row.state} · conformance ${row.conformance.status} · implementation ${(row.implementation_version || "unbound").slice(0, 12)} — ${row.reason}`)
  }
  const c = rep.coverage as Record<string, unknown>
  lines.push(`Source coverage: ${pyStr(c.current ?? 0)}/${pyStr(c.active ?? 0)} active current; bound ${pyStr(c.bound ?? 0)}; observed ${pyStr(c.observed ?? 0)}; unbound ${((c.unbound as string[] | undefined) ?? []).join(", ") || "none"}`)
  lines.push(`Inspection pending: ${rep.pending.join(", ") || "none"}; assessment pending: ${rep.assessment_pending.join(", ") || "none"}; recorded differences: ${rep.differences.join(", ") || "none"}`)
  return lines.join("\n")
}

export const vScan: Verb = (led, a) => Effect.gen(function* () {
  const rep = yield* existing.scan(led, opt(a, "repo"))
  yield* out((flagOf(a, "json") ? pyJsonDumps(rep, { indent: 2 }) : scanText(rep)) + "\n")
})

export const vReconcile: Verb = (led, a) => Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const outputArg = s(a, "output")
  const destination = outputArg ? yield* resolvePath(expandUser(outputArg)) : nodePath.join(nodePath.dirname(led.dir), nodePath.basename(led.dir) + "-rebuild-" + now().replaceAll(":", "-"))
  const parentsOfLed = withParents(led.dir).slice(1)
  const parentsOfDest = withParents(destination).slice(1)
  if (destination === led.dir || parentsOfLed.includes(destination) || parentsOfDest.includes(led.dir)) return yield* fail("reconcile needs a separate output directory, outside the previous ledger")
  yield* locked(destination, Effect.gen(function* () {
    const entries = yield* asFail(fs.readDirectory(destination))
    if (entries.some((name) => name !== ".stepwise.lock")) return yield* fail("reconcile output must be empty; resume an existing rebuild with adopt/observe and sync")
    const fresh = yield* Ledger.create(destination, led.title)
    fresh.data!.scope = led.data!.scope ?? ""
    fresh.data!.nongoals = deepCopy(led.data!.nongoals ?? [])
    const previousBytes = yield* asFail(fs.readFile(led.path))
    fresh.data!.reconstruction = { previous_ledger: relpath(led.path, destination), previous_sha256: sha256Hex(previousBytes), started_at: now() }
    const repo = opt(a, "repo") ?? (led.data!.source_root ? yield* resolvePath(nodePath.join(led.dir, led.data!.source_root)) : null)
    if (repo) yield* existing.setRepository(fresh, repo)
    fresh.operations.push("reconcile: initialize independent reconstruction")
    yield* finish(fresh, `Fresh reconstruction: ${destination}. No nodes or approvals copied. Inspect source, then adopt/bind/observe the new hierarchy; initialization is not completion.`)
    const rc = yield* finalize(fresh, "reconcile")
    if (rc) return yield* new Fail({ message: "" })
  }))
})

export const vSync: Verb = (led, a) => Effect.gen(function* () {
  const repo = opt(a, "repo")
  if (repo) yield* existing.setRepository(led, repo)
  const rep = yield* existing.refreshSources(led)
  for (const [nid, row] of Object.entries(rep.nodes)) existing.recordVersion(led.nodes[nid], row, rep.commit)
  yield* finish(led, scanText(rep))
})

export const vRepair: Verb = (led) => Effect.gen(function* () {
  const io = yield* Io
  const invalidApproved = new Set(Object.entries(led.nodes).filter(([, n]) => n.design === "approved" && (
    changedDeps(led, n).length || (n.body ?? []).some((it) => ["stale", "superseded", "retired"].includes(led.nodes[it.child || it.reuse || ""]?.design ?? ""))
  )).map(([nid]) => nid))
  let pending = new Set([...Object.entries(led.nodes).filter(([, n]) => n.design === "draft" || n.design === "stale").map(([nid]) => nid), ...invalidApproved])
  pending = new Set([...pending].filter((nid) => !(led.nodes[nid].origin === "existing-code" && !Object.keys(led.nodes[nid].contract ?? {}).length && !led.dependents(nid).length)))
  if (!pending.size) {
    io.out("repair empty — no draft or stale nodes\n")
    return
  }
  const deps = new Map<string, Set<string>>()
  for (const nid of pending) {
    const n = led.nodes[nid]
    const called = new Set((n.body ?? []).map((it) => it.child || it.reuse))
    deps.set(nid, new Set([...(n.depends ?? []).filter((x) => isNodeId(x)), ...called].filter((x): x is string => Boolean(x) && pending.has(x as string))))
  }
  const order: string[] = []
  const left = new Set(pending)
  while (left.size) {
    let ready = sorted([...left].filter((nid) => ![...deps.get(nid)!].some((d) => left.has(d))))
    if (!ready.length) ready = [minStr(left, "")]
    order.push(...ready)
    for (const r of ready) left.delete(r)
  }
  io.out("repair plan (group related changes in one batch):\n")
  order.forEach((nid, i) => {
    const n = led.nodes[nid]
    const action = invalidApproved.has(nid) ? "`stale` for later, or `reopen` and re-approve against changed dependencies"
      : NEXT_STEP[n.design === "stale" && intact(n) ? "stale-intact" : n.design]
    io.out(`${i + 1}. ${nid} (${led.status(nid)}) — ${action}\n`)
  })
  const constrained = new Map<string, string[]>()
  for (const adr of led.adrs()) for (const nid of adr.constrains) if (pending.has(nid)) constrained.set(nid, [...(constrained.get(nid) ?? []), adr.id])
  for (const nid of sorted(constrained.keys())) io.out(`ADRs blocked by ${nid}: ${constrained.get(nid)!.length} (${constrained.get(nid)!.join(", ")})\n`)
})

export const vStatus: Verb = (led, a) => Effect.gen(function* () {
  const io = yield* Io
  for (const [nid, n] of Object.entries(led.nodes)) {
    const state = n.design
    if ((state === "superseded" || state === "retired") && !flagOf(a, "all")) continue
    if (n.origin === "existing-code" && !Object.keys(n.contract ?? {}).length && !led.dependents(nid).length) {
      io.out(`${nid}  observed-only (${pyStr(n.source_state ?? "unbound")})  inspect sources and record observations; no intended contract required\n`)
    } else io.out(`${nid}  ${ljust(led.status(nid), 28)}  ${NEXT_STEP[state === "stale" && intact(n) ? "stale-intact" : state]}\n`)
    if (n.bindings && Object.keys(n.bindings).length && n.source_state !== "current") io.out(`  implementation notification: ${pyStr(n.source_state)} — \`scan <dir> --json\` for current versions and inspection tokens\n`)
  }
  const fr = led.frontier()
  for (const fid of sorted(fr.keys())) {
    const [stmt, parent] = fr.get(fid)!
    io.out(`${fid}  ${ljust("frontier", 28)}  \`new <dir> ${fid}\` — ${stmt} (child of ${parent})\n`)
  }
})

export const vHtml: Verb = (led, a) => Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const outputArg = s(a, "output")
  const output = yield* resolvePath(outputArg ? expandUser(outputArg) : nodePath.join(led.dir, "DESIGN.html"))
  if (nodePath.extname(output).toLowerCase() !== ".html") return yield* fail("HTML output must have a .html extension; ledger files and Markdown views are not export targets")
  const adrs = led.adrs().map((adr) => ({ id: adr.id, text: adr.lines.join("\n") }))
  const snapshot = deepCopy(led.data!) as Record<string, unknown> & { nodes: Record<string, Record<string, unknown>> }
  snapshot.source_coverage = deepCopy(led.sourceScan.coverage ?? {})
  for (const [nid, row] of Object.entries(led.sourceScan.nodes)) snapshot.nodes[nid].source_report = { ...row, commit: led.sourceScan.commit ?? null }
  for (const n of Object.values(snapshot.nodes)) n.coverage = coverage(n as unknown as NodeRecord)
  const document = yield* asFail(renderHtml(snapshot, { title: led.title, exportedAt: now(), adrs, reviewKey: sha256Hex(led.path) }))
  const written = yield* Effect.gen(function* () {
    yield* fs.makeDirectory(nodePath.dirname(output), { recursive: true })
    yield* fs.writeFileString(output, document)
  }).pipe(Effect.result)
  if (written._tag === "Failure") return yield* fail(`could not export HTML: ${written.failure.message}`)
  yield* out(`HTML snapshot: ${output}\n`)
})

export const vCheck: Verb = (led) => Effect.gen(function* () {
  yield* check(led)
  const rc = yield* report(led)
  if (rc) return yield* new Fail({ message: "" })
})

// ----------------------------------------------------------------------------- commit

/** Derive, validate, render and commit the whole in-memory ledger in one transaction. */
export const finalize = Effect.fn("finalize")(function* (led: Ledger, command: string) {
  const fs = yield* FileSystem.FileSystem
  const io = yield* Io
  deriveDepends(led)
  for (const [nid, n] of Object.entries(led.nodes)) {
    if (n.design === "approved" && n.approved_content_hash !== fingerprint(n)) {
      n.design = "stale"
      hist(n, "stale", "derived dependencies changed")
      cascadeStale(led, nid, "derived dependencies changed")
    }
  }
  yield* refreshLedger(led)
  for (const [nid, row] of Object.entries(led.sourceScan.nodes)) if (!led.nodes[nid].implementation_version) existing.recordVersion(led.nodes[nid], row, led.sourceScan.commit)
  yield* check(led, { views: false })
  if (led.errors.length) return yield* report(led, "No changes committed. Resolve related changes together with `batch`.")
  const files = new Map<string, string>([...led.files, ...renderAll(led)])
  const audit = nodePath.join(led.dir, LOG)
  const data = led.data!
  data.nodes = Object.fromEntries(sorted(Object.keys(led.nodes)).map((k) => [k, led.nodes[k]]))
  const ledgerText = pyJsonDumps(data, { indent: 1, ensureAscii: false }) + "\n"
  files.set(led.path, ledgerText)
  const before = (yield* asFail(fs.exists(led.path))) ? sha256Hex(yield* asFail(fs.readFile(led.path))) : "-"
  const after = sha256Hex(Buffer.from(ledgerText, "utf8"))
  const previousAudit = (yield* asFail(fs.exists(audit))) ? yield* asFail(fs.readFileString(audit)) : ""
  files.set(audit, previousAudit + `${now()} exit=0 ${command} operations=${led.operations.join("; ")} | result=applied applied=true before=${before} after=${after}\n`)
  yield* commit(led.dir, files)
  if (led.sourceScan.pending.length && command !== "reconcile") io.out("Implementation inspection pending: " + led.sourceScan.pending.join(", ") + "; run scan --json\n")
  return yield* report(led, led.messages.length ? led.messages[led.messages.length - 1] : command)
})

export { LEDGER, VERIFICATION, defaultTitle, partition, bodyText }
