/** Self-contained, read-only HTML snapshot of a Stepwise ledger. */
import { Effect, FileSystem } from "effect"
import * as nodePath from "node:path"
import { fileURLToPath } from "node:url"
import { presentation } from "./pseudocode.js"
import { pyJsonDumps } from "./pyjson.js"
import { fail } from "./errors.js"

export const DATA_MARKER = "__STEPWISE_DATA__"

/** The built viewer template: next to the bundled CLI in dist/, or ../dist when running from src/. */
export const templateCandidates = (): string[] => {
  const here = nodePath.dirname(fileURLToPath(import.meta.url))
  return [nodePath.join(here, "design-view.html"), nodePath.join(here, "..", "dist", "design-view.html")]
}

export const readTemplate = Effect.fn("readTemplate")(function* () {
  const fs = yield* FileSystem.FileSystem
  for (const candidate of templateCandidates()) if (yield* fs.exists(candidate)) return yield* fs.readFileString(candidate).pipe(Effect.mapError((e) => fail(e.message)))
  return yield* fail("design-view.html template is missing; run `pnpm run build:viewer` in the skill directory")
})

export interface HtmlOptions {
  title: string
  exportedAt: string
  adrs: Array<{ id: string; text: string }>
  reviewKey?: string
}

/** Embed inert JSON safely; the client creates DOM text nodes for all content. */
export const encodePayload = (ledger: unknown, options: HtmlOptions): string => {
  const payload = { ledger, title: options.title, exported_at: options.exportedAt, adrs: options.adrs, review_key: options.reviewKey ?? "", pseudocode: presentation(ledger) }
  return pyJsonDumps(payload, { ensureAscii: true }).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026")
}

export const renderHtml = Effect.fn("renderHtml")(function* (ledger: unknown, options: HtmlOptions) {
  const template = yield* readTemplate()
  return template.replace(DATA_MARKER, () => encodePayload(ledger, options))
})
