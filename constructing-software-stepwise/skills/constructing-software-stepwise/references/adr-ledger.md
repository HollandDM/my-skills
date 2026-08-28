# ADR Ledger Format

ADR = durable record that a consequential choice was made, and why. Backstop for refinement tree: future designs satisfy it or explicitly supersede.

Not: explanation, meeting note, claim that impl is correct.

## Eligibility — ALL three

1. **Hard to reverse** — cost of changing mind later is meaningful.
2. **Surprising w/o context** — future reader looks at code and wonders "why on earth did they do it this way?"
3. **Real trade-off** — genuine alternatives existed; picked one for specific reasons.

Easy to reverse → skip, you'll just reverse it. Not surprising → nobody wonders. No alternative → nothing beyond "did the obvious thing".

Typical: persistent data formats, ownership boundaries, public protocols, consistency models, irreversible migrations, trust boundaries, durability semantics, cross-system IDs, deliberate deviation from obvious path, constraint invisible in code.

## Atomic File Rules

- **One decision per file.** Two decisions → two ADRs, cross-linked.
- **Paragraph first.** Title + 1–3 sentences (context, decision, why) = complete ADR. Sections only when they add value.
- **Self-describing header.** `Kind`, ID, `Status`, `Date`, `Constrains` node ids — written by `stepwise.py adr new "<title>" --constrains D-NNN[,D-MMM]`.
- **Name, never repeat.** Reference context entries + nodes by name / id. Never restate a definition.
- **Size cap.** ≤ 40 lines (lint).
- **Only the paragraph + sections are hand-written.** Header + status belong to the tool: `adr new` (proposed; constrained nodes drop to `draft (ADR pending)`), `adr accept ADR-NNNN` (accepted; nodes unblocked). `adr supersede ADR-OLD ADR-NEW` (old → superseded + `Superseded by`, new gets `Supersedes`). Run `sync` after editing the paragraph.

## Authority + Lifecycle

Agent recommends. User approves accept / supersede.

Status: `proposed` → `accepted` → `superseded by ADR-NNNN` | `deprecated`. Repo convention wins if present.

Track implementation separately. Accepted may be unimplemented.

Never delete / rewrite accepted ADR to erase changed decision. Typo / wording fix OK if meaning identical. Decision change → new ADR; old → superseded, both linked.

## File — `docs/adr/NNNN-<slug>.md`

Repo numbering / location if established. Else `adr new` scans `docs/adr/` for the highest number and increments. Stub written by the tool:

```markdown
# ADR-0003 — <Short title of the decision>

Kind: adr · Status: proposed | accepted | superseded by ADR-NNNN | deprecated · Date: YYYY-MM-DD
Constrains: D-120, D-121
Supersedes: — · Superseded by: —

<1–3 sentences: what's the context, what did we decide, and why.>

## Invariants imposed

- <one line: property every constrained refinement must preserve>
```

Optional sections — add only when they carry information the paragraph can't:

```markdown
## Considered options

- <option> — rejected: <one line>

## Consequences

- <one line: benefit / cost / migration effect>

## Revisit when

- <concrete condition that reopens this>
```

`Invariants imposed` stays mandatory: Conflict Protocol checks against it.

## Conflict Protocol

Before approving node: read ADRs it links. Candidate conflicts →

1. name exact candidate behavior + ADR invariant in conflict
2. stop refinement of that branch
3. show user two legitimate paths:
   - preserve ADR, revise candidate; or
   - supersede ADR, accept migration / compat / risk / invalidation work
4. resolve factual uncertainty first (investigate), then ask
5. explicit user approval
6. superseding → `adr new` + `adr accept` the replacement, then `adr supersede ADR-OLD ADR-NEW` links both; dependent nodes + evidence marked stale
7. resume from new valid frontier

Unawareness ≠ permission. No adapter / exception preserving wording while defeating invariant.

## Applicability

`Constrains` lists node IDs. Global ADR → `Constrains: all nodes under D-000`. Scoped ADR states boundary so unrelated work doesn't inherit.

Never present `proposed` as implemented reality.
