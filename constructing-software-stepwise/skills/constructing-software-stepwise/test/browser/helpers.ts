/** Test fixtures for the design reader: the sample ledger from the old suite and a template embedder. */
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { presentation } from "../../src/pseudocode.ts"

export type Ledger = Record<string, any>

export const fixture = (): Ledger => ({
  schema: 1,
  title: "Durable job runner",
  scope: "Run a job with a recoverable outcome.",
  nongoals: ["Distributed scheduling"],
  ambiguities: [],
  terms: { "Run Key": { definition: "Identifies one requested run.", source: "user" } },
  facts: {},
  scenarios: {},
  nodes: {
    "D-000": {
      statement: "outcome <- run_job(key)", gloss: "Run one job safely", effect: "One run reaches a durable outcome.",
      design: "approved", realization: "not-started", verification: "unverified", approved: "2026-09-05 by standing approval",
      contract: { pre: "Run Key is supplied by the caller.", post: "One durable result belongs to Run Key." },
      depends: ["Run Key"], composition: ["The children preserve the run identity."],
      body: [
        { indent: 0, code: "validate(key)", child: "D-001", gloss: "Validate identity." },
        { indent: 0, code: "persist(key)", child: "D-002", gloss: "Persist the result." },
        { indent: 0, code: "notify(key)", child: "D-003", gloss: "Notify the caller." },
      ],
    },
    "D-001": {
      statement: "validate(key)", gloss: "Validate run identity", design: "approved", realization: "implemented", verification: "verified",
      contract: { pre: "The key is a string.", post: "An empty key is rejected." }, target: "python: str.strip",
      adaptation: ["post → Reject an empty stripped string."],
      evidence: [{ date: "2026-09-05", kind: "example", ref: "test_validation.py", result: "pass", note: "Covers empty strings." }],
    },
    "D-002": {
      statement: "persist(key)", gloss: "Persist the final result", design: "stale", realization: "partial", verification: "stale",
      contract: { post: "The result is durable." }, depends: ["D-001"],
      body: [{ indent: 2, code: "validate(key)", reuse: "D-001" }],
      history: [{ date: "2026-09-05", event: "stale", reason: "Storage semantics changed." }],
    },
  },
})

const template = readFileSync(new URL("../../dist/design-view.html", import.meta.url), "utf8")

export interface RenderOptions {
  title?: string
  exportedAt?: string
  adrs?: Array<{ id: string; text: string }>
  reviewKey?: string
}

/** Embed a ledger the way the CLI does: inert JSON with angle brackets and ampersands escaped. */
export const renderHtml = (ledger: Ledger, options: RenderOptions = {}): string => {
  const payload = {
    ledger,
    title: options.title ?? "Durable job runner",
    exported_at: options.exportedAt ?? "2026-09-05",
    adrs: options.adrs ?? [],
    review_key: options.reviewKey ?? "",
    pseudocode: presentation(ledger),
  }
  const encoded = JSON.stringify(payload).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026")
  return template.replace("__STEPWISE_DATA__", () => encoded)
}

/** Write a reader page to a fresh temp directory and return its file URL. */
export const writePage = (ledger: Ledger, options: RenderOptions = {}): string => {
  const dir = mkdtempSync(join(tmpdir(), "stepwise-reader-"))
  const path = join(dir, "reader.html")
  writeFileSync(path, renderHtml(ledger, options))
  return pathToFileURL(path).href
}
