/** Ledger data shapes. The ledger is JSON authored only by this CLI; unknown keys are preserved verbatim. */
export interface BodyItem {
  indent: number
  code: string
  gloss?: string
  child?: string
  reuse?: string
  target?: string
  note?: string
}

export interface HistoryEntry {
  date: string
  event: string
  reason?: string
}

export interface Evidence {
  date: string
  kind: string
  ref: string
  result: string
  clauses?: string[]
  covers?: string[]
  resolves?: string[]
  revision?: number
  content_hash?: string
  dependency_hash?: string
  scope?: string
  scenario?: string
  assessment?: string
  note?: string
  withdrawn?: { date: string; by: string; reason: string }
}

export interface Binding {
  path: string
  baseline_sha256: string
  bound_at: string
  symbol?: string
  lines?: number[]
  commit?: string | null
}

export interface SourceInfo {
  state: string
  sha256?: string
  reason?: string
}

export interface Observation {
  effect: string
  claims: Array<{ text: string; basis: string; sources: string[] }>
  unknowns?: string[]
  behavior?: Behavior
  comparisons?: Record<string, { status: string; reason: string }>
  body: BodyItem[]
  bindings?: Record<string, Binding>
  date?: string
  by?: string
  revision?: number
  scope_hash?: string
  inspected_files?: Record<string, SourceInfo>
  design_hash?: string
  implementation_version?: string | null
  implementation_commit?: string | null
  design_context?: string
  [key: string]: unknown
}

export interface Behavior {
  states?: Array<Record<string, unknown>>
  transitions?: Array<Record<string, unknown>>
  participants?: Array<Record<string, unknown>>
  messages?: Array<Record<string, unknown>>
}

export interface NodeRecord {
  statement: string
  gloss: string
  effect: string
  contract: Record<string, string>
  depends: string[]
  design: string
  realization: string
  verification: string
  approved: string
  body?: BodyItem[]
  target?: string
  walkthrough?: string[]
  composition?: string[]
  decisions?: string[]
  deferred?: string[]
  adaptation?: string[]
  implementation_plan?: { approach: string; validation: string }
  behavior?: Behavior
  history?: HistoryEntry[]
  evidence?: Evidence[]
  revision?: number
  revisions?: Array<Record<string, unknown>>
  approved_content_hash?: string
  approved_hash?: string
  contract_hash?: string
  proposal_hash?: string
  approved_by?: string
  approved_at?: string
  evidence_context?: string
  stale_by?: string[]
  superseded_by?: string
  superseded?: Record<string, unknown>
  adr_pending?: string
  origin?: string
  bindings?: Record<string, Binding>
  binding_history?: Array<Record<string, unknown>>
  observation?: Observation
  observation_history?: Observation[]
  observed_children?: string[]
  source_state?: string
  source_scope_hash?: string
  conformance?: { status: string; reason: string }
  current_implementation_version?: string | null
  implementation_version?: string | null
  implementation_revision?: number
  implementation_history?: Array<Record<string, unknown>>
  implementation_commit?: string | null
  [key: string]: unknown
}

export interface ContextEntry {
  name?: string
  definition: string
  confirmed: string
  status?: string
  source?: string
  avoid?: string[]
  not?: string[]
  example?: string
  given?: string
  when?: string
  then?: string
  excludes?: string
  settles?: string
  changed?: Array<{ at: string; reason: string }>
  [key: string]: unknown
}

export interface Ambiguity {
  claim: string
  conflict: string
  resolves_at: string
}

export interface LedgerData {
  schema: number
  title: string
  scope: string
  nongoals: string[]
  ambiguities: Ambiguity[]
  nodes: Record<string, NodeRecord>
  terms: Record<string, ContextEntry>
  facts: Record<string, ContextEntry>
  scenarios: Record<string, ContextEntry>
  source_root?: string
  reconstruction?: { previous_ledger: string; previous_sha256: string; started_at: string }
  [key: string]: unknown
}

export interface AdrRecord {
  id: string
  title: string
  status: string
  constrains: string[]
  path: string
  lines: string[]
}

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
