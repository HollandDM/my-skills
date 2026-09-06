#!/usr/bin/env python3
"""Stepwise ledger CLI — owns every write to the design ledger. Agent-agnostic; call it from any agent.

Canonical data: <design-dir>/ledger.json (typed; this tool is the only writer).
Generated Markdown views (never edit; refreshed by ledger mutations): DESIGN.md, CONTEXT.md, nodes/D-NNN.md.
ADRs stay markdown in docs/adr/ (repo convention); `adr new` stubs them, `adr accept` flips status.

Ledger mutations end with render + lint; exit 1 and `error <where>: <msg>` lines identify conflicts.
Read-only orientation and HTML export do not mutate the ledger; HTML is an explicitly refreshed snapshot.

  frontier  <dir>                                     what to pick next
  show      <dir> D-NNN                               node view to stdout
  new       <dir> D-NNN ["stmt"]                      draft node (frontier id, or the root with its statement)
  set       <dir> D-NNN '{"gloss":"...","effect":"...","contract":{"pre":"..."}}'
                                                       atomically replace the supplied node fields from one JSON object
  set       <dir> D-NNN gloss|effect "text"           targeted single-field correction
  set       <dir> D-NNN pre|post|failure|invariant|<label> "clause"   contract clause, any lowercase label (unknowns as ?slug)
  set       <dir> D-NNN walkthrough "l1" ["l2" "l3"]  what the function does (above the body)
  set       <dir> D-NNN composition|decisions|deferred|adaptation "b1" "b2" ...    bullet lists (replace)
  set       <dir> D-NNN depends "Name" ...            add dependencies that carry no ?slug (append; each must exist)
  set       <dir> D-NNN realization|verification <vocab>
  body      <dir> D-NNN [--file F]                    refinement body from stdin/file (pseudocode, `-- D-NNN: <one line>` / `-- ↗ D-NNN -- <one line>` / `-- ⇒ target -- <one line>`; every tagged line says what it does)
  answer    <dir> D-NNN slug "Name"                   ?slug -> name in every clause; name added to depends
  terminal  <dir> D-NNN "<target>: <identifier>"      leaf: named implementation (own unwritten code included)
  proposal  <dir> D-NNN                               hash the exact proposed design
  approve   <dir> D-NNN [--by WHO]                    after the user says yes; refuses while anything is missing
                                                     --by names who approved (default "user"); auto-accepted -> --by "standing approval"
  reaffirm  <dir> D-NNN --by WHO                       re-accept an unchanged stale node
  repair    <dir>                                     dependency-ordered repair plan
  reopen    <dir> D-NNN "reason"                      approved -> draft for revision (history keeps the reason)
  stale     <dir> D-NNN "reason"                      a change invalidated it; the entries that changed are recorded with it
  retire    <dir> D-NNN "reason"                      the design dropped it; nothing calls it any more
  supersede <dir> D-OLD D-NEW "reason"
  evidence  <dir> D-NNN --kind K --ref R --result pass|fail --clause LABEL [--resolves EV-N] [--note N]
  ready     <dir> D-NNN --approach TEXT --validation TEXT   bounded implementation leaf
  adopt     <dir> D-NNN ["statement"] [--parent D-NNN]   reconstruct an observational hierarchy
  bind      <dir> D-NNN PATH [--repo ROOT] [--binding S01] [--symbol NAME] [--lines START:END]
  observe   <dir> D-NNN JSON [--file FILE] --at TOKEN    record inspected behavior, preserving intended contracts
  scan      <dir> [--repo ROOT] [--json]                source versions and inspection notifications, read-only
  reconcile <dir> [--output DIR] [--repo ROOT]         initialize a fresh reconstruction; agent must inspect and rebuild
  batch     <dir> [--file FILE]                       validate and commit JSON operations together
  entry     <dir> term|fact|scenario "Heading" "definition" [--source S] [--avoid a,b] [--not T] [--example E]
                                                      [--given G --when W --then T --excludes X --settles T]
  change    <dir> <ref> [--definition D] [--rename "New Heading"] [--status confirmed|stale] --reason R   sharpen, rename or stale an entry
  meta      <dir> title|scope "text" | nongoals "a" "b" ...
  ambiguity <dir> "claim" "conflict" D-NNN | ambiguity <dir> "claim" --drop
  adr       <dir> new "Title" --constrains D-NNN[,D-MMM] | adr <dir> accept ADR-NNNN | adr <dir> supersede ADR-OLD ADR-NEW
                                                      adr <dir> constrains ADR-NNNN --constrains D-NNN[,D-MMM]   rewrite the constrained set
  sync      <dir> [--repo ROOT]                        track source changes, preserve nodes, render + lint
  status    <dir> [--all]                             every node, its design state, and the one move that advances it
  check     <dir>                                     lint only, no writes
  html      <dir> [--output FILE]                     standalone HTML reader (default: <dir>/DESIGN.html)

Stdlib only, no regex: the ledger is typed data, not text to be parsed.
"""
from __future__ import annotations

import argparse
import copy
import io
from contextlib import redirect_stdout, redirect_stderr
import datetime as _dt
import hashlib
import json
import os
import sys
from pathlib import Path

from stepwise_state import CONTENT_FIELDS, fingerprint, coverage, refresh, validate_behavior
from stepwise_transaction import locked, commit
import stepwise_existing as existing
from stepwise_pseudocode import signature, split_comment, algorithm_lines

LEDGER = "ledger.json"
LOG = ".stepwise.log"
CODE_COL = 58
CONTRACT_KEYS = ("pre", "post", "failure", "cancellation", "invariant", "progress")
TEXT_FIELDS = ("gloss", "effect")
LIST_FIELDS = ("walkthrough", "composition", "decisions", "deferred", "adaptation")
JSON_SET_FIELDS = TEXT_FIELDS + ("contract",) + LIST_FIELDS + ("depends", "realization", "verification", "implementation_plan", "behavior")
DESIGN_CONTENT_FIELDS = CONTENT_FIELDS
REALIZATION = ("not-started", "partial", "implemented")
VERIFICATION = ("unverified", "partial", "verified", "stale", "failed")
DESIGN = ("draft", "approved", "stale", "superseded", "retired")
# design state machine: (from, to) -> verb that makes the move. Nothing else moves a node.
TRANSITIONS = {
    ("draft", "approved"): "approve",
    ("approved", "draft"): "reopen",
    ("stale", "draft"): "reopen",
    ("retired", "draft"): "reopen",
    ("approved", "stale"): "stale",
    ("draft", "stale"): "stale",
    ("approved", "superseded"): "supersede",
    ("stale", "superseded"): "supersede",
    ("draft", "superseded"): "supersede",
    ("approved", "retired"): "retire",
    ("stale", "retired"): "retire",
    ("draft", "retired"): "retire",
    ("approved", "approved"): "approve",
}
# what a node in each state is waiting for; `status` prints it, the skill follows it
NEXT_STEP = {
    "draft": "finish the draft (`set`, `answer`, `body`/`terminal`, `set walkthrough`/`composition`) then `approve`",
    "approved": "nothing — refine its children, or `reopen` / `stale` / `supersede` / `retire` when something changes",
    "stale-intact": "`reaffirm --by WHO` after accepting changed dependencies, or `reopen` to revise the node",
    "stale": "`reopen` and re-`approve` it, or `retire` / `supersede` it",
    "superseded": "nothing — the replacement carries the work",
    "retired": "nothing — the design dropped it; `reopen` only to revive it",
}
CONTROL = {"if", "else", "elif", "loop", "while", "for", "until", "case", "match", "try", "finally", "repeat", "end", "upon", "atomic", "parallel"}
ENTRY_FILE = {"term": "terms", "fact": "facts", "scenario": "scenarios"}
GENERATED = "_Generated by `stepwise.py` from ledger.json. Use the CLI; never edit this file._"


def today() -> str:
    return _dt.date.today().isoformat()


def now() -> str:
    return _dt.datetime.now().isoformat(timespec="microseconds")


def is_node_id(s: str) -> bool:
    return len(s) == 5 and s.startswith("D-") and s[2:].isdigit()


def is_ctx_id(s: str) -> bool:
    return s.startswith(("CTX-F", "CTX-S")) and s[5:].isdigit()


def is_adr_id(s: str) -> bool:
    return len(s) == 8 and s.startswith("ADR-") and s[4:].isdigit()


def is_ident(s: str) -> bool:
    return bool(s) and s.isidentifier() and (s[0].isalpha() or s[0] == "_")


def anchor_of(heading: str) -> str:
    keep = "".join(c.lower() if c.isalnum() else " " if c in " -_" else "" for c in heading)
    return "-".join(keep.split())


def unknowns(*texts: str) -> list[str]:
    out: set[str] = set()
    for t in texts:
        for w in t.split():
            if w.startswith("?") and len(w) > 1 and w[1].isalpha():
                out.add(w[1:].rstrip(",.;:)]}"))
    return sorted(out)


def fn_of(statement: str) -> str:
    value = signature(statement)
    name, sep, _ = value.partition("(")
    name = name.strip()
    return name if sep and is_ident(name) else ""


def call_names(code: str) -> list[str]:
    out, i, n = [], 0, len(code)
    while i < n:
        c = code[i]
        if c in ('"', "'"):
            quote = c
            i += 1
            while i < n:
                if code[i] == "\\":
                    i += 2
                    continue
                if code[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if c.isalpha() or c == "_":
            j = i
            while j < n and (code[j].isalnum() or code[j] == "_"):
                j += 1
            k = j
            while k < n and code[k] == " ":
                k += 1
            name, prev = code[i:j], code[i - 1] if i else ""
            if k < n and code[k] == "(" and prev != "." and is_ident(name) and name.lower() not in CONTROL | {"return", "assert", "invariant"}:
                out.append(name)
            i = j
        else:
            i += 1
    return out


def stmt_kind(code: str) -> str:
    s = code.strip().lower()
    if not s:
        return "comment"
    if s.startswith(("{", "assert ", "invariant ")):
        return "assert"
    head = s.split(" ", 1)[0].rstrip(":")
    if head in CONTROL and (s.endswith((":", " then", " do")) or head in ("else", "repeat", "until", "end")):
        return "control"
    return "stmt"


def target_ok(target: str) -> str:
    """'' when valid, else the reason. A target names what implements the statement — a platform primitive, a language
    construct, a repo function, or a unit of our own code still to be written. Whether it exists yet is `realization`."""
    head, sep, rest = target.partition(": ")
    if not sep or not rest.strip() or not head or not all(c.isalnum() or c in "-_" for c in head) or not head[0].islower():
        return f"Target {target!r} must read '<target>: <identifier>' (dbos: DBOS.startWorkflow, postgres: SELECT ... ORDER BY seq, ts: Promise.all)"
    return ""


# ----------------------------------------------------------------------------- body text <-> items


def indent_of(line: str) -> int:
    return len(line) - len(line.lstrip())


def join_continuations(raw: list[str]) -> list[str]:
    out, buf, depth = [], "", 0
    for ln in raw:
        if depth <= 0 and out and ln.strip() and continues(out[-1], ln):
            out[-1] = merge(out[-1], ln)
            continue
        buf = ln if depth <= 0 else buf.rstrip() + ("" if ln.strip().startswith(")") or buf.rstrip().endswith("(") else " ") + ln.strip()
        depth += ln.count("(") - ln.count(")")
        if depth <= 0:
            out.append(buf)
            buf, depth = "", 0
    if buf:
        out.append(buf)
    return out


def continues(prev: str, ln: str) -> bool:
    """A deeper-indented line under an untagged, non-block statement wraps it (multi-line SQL, long expressions)."""
    code, comment, _ = split_comment(prev)
    return bool(code.strip()) and not comment and stmt_kind(code) == "stmt" and not code.rstrip().endswith(":") and indent_of(ln) > indent_of(prev)


def merge(prev: str, ln: str) -> str:
    code, sep, tag = split_comment(ln)
    joined = prev.rstrip() + " " + code.strip()
    return f"{joined} --{tag}" if sep else joined


def parse_body(text: str, fn: str) -> list[dict]:
    raw = [ln for ln in text.splitlines() if ln.strip()]
    if raw:
        first = raw[0].strip()
        prefix = first.split(" ", 1)[0].lower()
        if prefix in ("procedure", "function"):
            if fn_of(first) != fn:
                raise ValueError(f"procedure signature must match {fn}")
            raw = raw[1:]
            if raw and raw[-1].strip().lower() in ("end procedure", "end function"):
                raw = raw[:-1]
        elif first.endswith(":") and stmt_kind(first) != "control" and first.partition("(")[0].strip() == fn:
            raw = raw[1:]
    for line in raw:
        head = line.strip().lower()
        if head.startswith(("algorithm ", "require:", "ensure:", "input:", "output:")):
            raise ValueError("algorithm captions and contract headers are generated; store requirements with set, and pass only the procedure body")
        if head.startswith(("procedure ", "function ")) or head in ("end procedure", "end function"):
            raise ValueError("one procedure per node; represent helper procedures as child nodes")
    lines = join_continuations(raw)
    base = min((len(ln) - len(ln.lstrip()) for ln in lines), default=0)
    items = []
    for ln in lines:
        code, sep, tag = split_comment(ln.strip())
        item: dict = {"indent": len(ln) - len(ln.lstrip()) - base, "code": code.strip()}
        if sep:
            t = tag.strip()
            if " -- " in t:  # `-- <tag> -- <one line saying what this line does>`
                t, _, gl = t.partition(" -- ")
                t = t.strip()
                if gl.strip():
                    item["gloss"] = gl.strip()
            words = t.split()
            if t.startswith("↗") and len(words) > 1:
                item["reuse"] = words[1]
            elif t[:1] in ("⇒", "✓"):
                item["target"] = t[1:].strip()
            elif words and is_node_id(words[0].rstrip(":")):
                item["child"] = words[0].rstrip(":")
                rest = t[len(words[0]):].strip().lstrip(":").strip()
                if rest:
                    item["gloss"] = rest  # `-- D-NNN: <one line>`
            else:
                item["note"] = t
        items.append(item)
    return items


def item_tag(it: dict) -> str:
    if "child" in it:
        return f"{it['child']}: {it['gloss']}" if it.get("gloss") else it["child"]
    gloss = f" -- {it['gloss']}" if it.get("gloss") else ""
    if "reuse" in it:
        return f"↗ {it['reuse']}{gloss}"
    if "target" in it:
        return f"⇒ {it['target']}{gloss}"
    return it.get("note", "")


def fmt(code: str, tag: str, indent: int) -> str:
    left = " " * indent + code
    return f"{left}{' ' * max(CODE_COL - len(left), 1)}-- {tag}" if tag else left


def body_text(items: list[dict], indent: int = 2) -> list[str]:
    return [fmt(it["code"], item_tag(it), indent + it["indent"]) for it in items]


def body_hash(items: list[dict]) -> str:
    return hashlib.sha1(json.dumps(items, sort_keys=True).encode()).hexdigest()[:12]


def proposal_hash(n: dict) -> str:
    """Bind approval to all current design content, including dependencies and plans."""
    return fingerprint(n)


def legacy_intact(n: dict) -> bool:
    fields = ("statement", "gloss", "effect", "contract", "body", "walkthrough", "composition", "decisions", "deferred", "target", "adaptation")
    digest = hashlib.sha256(json.dumps({f: n[f] for f in fields if n.get(f)}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
    return n.get("proposal_hash") == digest and n.get("approved_hash") == body_hash(n.get("body", [])) and n.get("contract_hash") == contract_hash(n)


def intact(n: dict) -> bool:
    return bool(n.get("approved_content_hash")) and n["approved_content_hash"] == fingerprint(n) \
        and n.get("approved_hash") == body_hash(n.get("body", [])) and n.get("contract_hash") == contract_hash(n)


def comma_values(values: list[str]) -> list[str]:
    return list(dict.fromkeys(part.strip() for value in values for part in value.split(",") if part.strip()))


def contract_hash(n: dict) -> str:
    """What a caller depends on: the statement and the contract clauses. The body is the node's own business."""
    return hashlib.sha1(json.dumps([n.get("statement", ""), n.get("target", ""), n.get("contract", {})], sort_keys=True).encode()).hexdigest()[:12]


def frontier_statement(code: str) -> str:
    lhs, sep, rhs = code.partition("←" if "←" in code else "<-")
    if sep:
        return f"{rhs.strip()} -> {lhs.strip()}"
    return code[2:].strip() if code.startswith("->") else code[7:].strip() if code.lower().startswith("return ") else code


# ----------------------------------------------------------------------------- ledger


class Ledger:
    def __init__(self, d: Path):
        self.dir = d
        self.path = d / LEDGER
        self.data: dict = json.loads(self.path.read_text(encoding="utf-8")) if self.path.exists() else {}
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.files: dict[Path, str] = {}
        self.messages: list[str] = []
        self.operations: list[str] = []
        for n in self.data.get("nodes", {}).values():
            if "approved_content_hash" not in n and n.get("design") in ("approved", "stale"):
                if n.get("proposal_hash"):
                    if legacy_intact(n):
                        n["approved_content_hash"] = fingerprint(n)
                    elif n["design"] == "approved":
                        n["design"] = "stale"
                elif n["design"] == "approved":
                    n["approved_content_hash"] = fingerprint(n)
                n.setdefault("revision", 0)
        if self.data:
            refresh_ledger(self)

    # --- storage
    @classmethod
    def create(cls, d: Path, title: str) -> "Ledger":
        d.mkdir(parents=True, exist_ok=True)
        led = cls(d)
        led.data = {"schema": 1, "title": title, "scope": "", "nongoals": [], "ambiguities": [],
                    "nodes": {}, "terms": {}, "facts": {}, "scenarios": {}}
        return led

    @property
    def nodes(self) -> dict[str, dict]:
        return self.data.setdefault("nodes", {})

    def node(self, nid: str) -> dict | None:
        return self.nodes.get(nid)

    @property
    def title(self) -> str:
        return self.data.get("title") or self.dir.name.replace("-", " ").title()

    # --- derived structure
    def parents(self, nid: str) -> list[str]:
        return sorted(pid for pid, p in self.nodes.items() if any(it.get("child") == nid or it.get("reuse") == nid for it in p.get("body", [])))

    def dependents(self, nid: str) -> list[str]:
        """Nodes whose own design rests on this one: the bodies that call or reuse it, and anyone naming it in `depends`."""
        return sorted(set(self.parents(nid)) | {m for m, v in self.nodes.items() if nid in v.get("depends", [])})

    def observed_parents(self, nid: str) -> list[str]:
        return sorted(pid for pid, p in self.nodes.items() if nid in p.get("observed_children", []))

    def roots(self) -> list[str]:
        """Nothing calls it and nothing rests on it. A node reached only through `depends` — a durable entry point
        another node starts rather than calls — is not a root and not an orphan."""
        return [nid for nid in self.nodes if not self.dependents(nid) and not self.observed_parents(nid)]

    def frontier(self) -> dict[str, tuple[str, str]]:
        out: dict[str, tuple[str, str]] = {}
        for pid, p in self.nodes.items():
            if p["design"] in ("draft", "retired", "superseded"):
                continue
            for it in p.get("body", []):
                cid = it.get("child")
                if cid and cid not in self.nodes and cid not in out:
                    out[cid] = (frontier_statement(it["code"]), pid)
        return out

    def status(self, nid: str) -> str:
        n = self.nodes[nid]
        if n["design"] == "draft":
            if n.get("adr_pending"):
                return f"draft (ADR pending {n['adr_pending']})"
            k = len(node_unknowns(n))
            return f"draft ({k} ?)" if k else "draft"
        if n["design"] == "superseded":
            return f"superseded by {n.get('superseded_by', '?')}"
        if n["design"] == "retired":
            return "retired"
        return n["design"]

    def is_terminal(self, n: dict) -> bool:
        return bool(n.get("target")) and not n.get("body")

    def is_collapsed(self, n: dict) -> bool:
        stmts = [it for it in n.get("body", []) if stmt_kind(it["code"]) == "stmt"]
        return bool(stmts) and all("target" in it for it in stmts)

    def inline_parent(self, nid: str) -> str | None:
        ps = self.parents(nid)
        if len(ps) != 1:
            return None
        return ps[0] if any(it.get("child") == nid for it in self.nodes[ps[0]].get("body", [])) else None

    # --- context lookups
    def entry(self, ref: str) -> tuple[str, str, dict] | None:
        """(kind-file, key, entry) for a term name or CTX id."""
        r = ref.strip()
        if is_ctx_id(r):
            f = "facts" if r[4] == "F" else "scenarios"
            e = self.data.get(f, {}).get(r)
            return (f, r, e) if e else None
        for k, e in self.data.get("terms", {}).items():
            if k.lower() == r.lower():
                return ("terms", k, e)
        return None

    def adrs(self) -> list[dict]:
        return parse_adrs(self.adr_dir(), self.files)

    def adr_dir(self) -> Path | None:
        if self.data.get("reconstruction"):
            return self.dir / "adr"
        staged = next((p.parent for p in self.files if p.parent.name == "adr"), None)
        return staged or next((p / "adr" for p in [self.dir, *self.dir.parents][:5] if (p / "adr").is_dir()), None)

    def resolves(self, ref: str) -> bool:
        return (is_node_id(ref) and (ref in self.nodes or ref in self.frontier())) or \
            (is_adr_id(ref) and any(a["id"] == ref for a in self.adrs())) or self.entry(ref) is not None

    def canonical(self, ref: str) -> str:
        e = self.entry(ref)
        return e[1] if e else ref.strip()

    def used_by(self) -> dict[str, list[str]]:
        idx: dict[str, list[str]] = {}
        for nid, n in self.nodes.items():
            for r in n.get("depends", []):
                e = self.entry(r)
                if e:
                    idx.setdefault(e[1], []).append(nid)
        for sid, s in self.data.get("scenarios", {}).items():
            for t in self.terms_in(s.get("settles", "")):
                idx.setdefault(t, []).append(sid)
        return {k: sorted(set(v)) for k, v in idx.items()}

    def terms_in(self, text: str) -> list[str]:
        low = f" {text.lower()} "
        return [t for t in self.data.get("terms", {}) if f" {t.lower()} " in low or low.strip().startswith(t.lower())]


def refresh_ledger(led: Ledger) -> None:
    led.source_scan = existing.refresh_sources(led)
    adrs = {a["id"]: a for a in led.adrs()}
    for nid, node in led.nodes.items():
        seen, context, queue = {nid}, {}, [nid]
        while queue:
            current_id = queue.pop()
            current = led.nodes[current_id]
            if current.get("bindings") or current.get("observation") or current.get("observed_children"):
                context["source:" + current_id] = current.get("source_scope_hash")
            refs = [*current.get("depends", []), *[it.get("child") or it.get("reuse") for it in current.get("body", [])]]
            for ref in refs:
                if not ref or ref in seen:
                    continue
                seen.add(ref)
                if ref in led.nodes:
                    dep = led.nodes[ref]
                    context[ref] = [dep.get("revision", 0), dep["design"], fingerprint(dep)]
                    queue.append(ref)
                elif ref in adrs:
                    context[ref] = adrs[ref]["lines"]
                elif entry := led.entry(ref):
                    context[ref] = [entry[2].get("status"), entry[2].get("changed", [])]
                else:
                    context[ref] = "unresolved"
        node["evidence_context"] = hashlib.sha256(json.dumps(context, sort_keys=True).encode()).hexdigest()
    refresh(led.nodes)
    existing.refresh_assessments(led, led.source_scan)


def node_unknowns(n: dict) -> list[str]:
    return unknowns(n.get("gloss", ""), n.get("effect", ""), *n.get("contract", {}).values())


# ----------------------------------------------------------------------------- ADR files (markdown, header only)


def set_header(lines: list[str], field: str, value: str) -> None:
    """Rewrite `field: …` in the ADR header block, adding the part if the line lacks it."""
    for i, ln in enumerate(lines[:8]):
        if ln.startswith("#") or ":" not in ln:
            continue
        parts = _header_parts(ln)
        if any(x.startswith(f"{field}:") for x in parts):
            lines[i] = " · ".join(f"{field}: {value}" if x.startswith(f"{field}:") else x for x in parts)
            return
    for i, ln in enumerate(lines[:8]):
        if ln.startswith("Kind:"):
            lines.insert(i + 1, f"{field}: {value}")
            return


def _header_parts(line: str) -> list[str]:
    return [p.strip() for p in line.replace(" | ", " · ").split(" · ")]


def parse_adrs(adr_dir: Path | None, staged: dict | None = None) -> list[dict]:
    out = []
    staged = staged or {}
    paths = set(adr_dir.glob("*.md")) if adr_dir else set()
    paths.update(p for p in staged if p.parent == adr_dir)
    for p in sorted(paths):
        lines = (staged[p] if p in staged else p.read_text(encoding="utf-8")).splitlines()
        aid, title = p.stem[:4], p.stem
        header: dict[str, str] = {}
        for ln in lines:
            if ln.startswith("# "):
                head = ln[2:].replace(" - ", " — ").replace(" – ", " — ")
                a, sep, t = head.partition(" — ")
                aid, title = (a.strip(), t.strip()) if sep else (head.strip(), head.strip())
            elif ln.startswith("## "):
                break
            else:
                for part in _header_parts(ln):
                    k, sep, v = part.partition(":")
                    if sep and k and k[0].isupper() and " " not in k.strip():
                        header[k.strip()] = v.strip()
        if not is_adr_id(aid):
            aid = f"ADR-{p.stem[:4]}" if p.stem[:4].isdigit() else p.stem
        constrains = [w.strip("[],") for w in header.get("Constrains", "").replace("(", " (").split() if is_node_id(w.strip("[],"))]
        out.append({"id": aid, "title": title, "status": header.get("Status", "?"), "constrains": constrains, "path": p, "lines": lines})
    return out


# ----------------------------------------------------------------------------- rendering


def rel(frm: Path, to: Path) -> str:
    return os.path.relpath(to, frm.parent)


def link_ref(led: Ledger, ref: str, frm: Path) -> str:
    if is_node_id(ref) and ref in led.nodes:
        return f"[{ref}]({rel(frm, led.dir / 'nodes' / f'{ref}.md')})"
    if is_adr_id(ref):
        a = next((a for a in led.adrs() if a["id"] == ref), None)
        return f"[{ref}]({rel(frm, a['path'])})" if a else ref
    e = led.entry(ref)
    if e:
        return f"[{e[1]}]({rel(frm, led.dir / 'CONTEXT.md')}#{anchor_of(e[1] if e[0] == 'terms' else e[1] + ' ' + e[2].get('name', ''))})"
    return ref


def state_line(n: dict) -> list[str]:
    """Why the node left `approved`, from the verb that moved it."""
    if n["design"] in ("draft", "approved"):
        return []
    last = next((h for h in reversed(n.get("history", [])) if h["event"] in ("stale", "superseded", "retired", "reopened")), None)
    if not last:
        return []
    line = f"{last['event'].title()}: {last['date']}" + (f" — {last['reason']}" if last.get("reason") else "")
    if n["design"] == "stale" and n.get("stale_by"):
        line += f" · invalidated by {', '.join(n['stale_by'])}"
    return [line]


def render_node(led: Ledger, nid: str) -> str:
    n = led.nodes[nid]
    p = led.dir / "nodes" / f"{nid}.md"
    L = [f"# {nid} — {fn_of(n['statement']) or nid}", "", GENERATED, "",
         f"Kind: node · Index: [../DESIGN.md](../DESIGN.md)",
         f"Design: {led.status(nid)} · Realization: {n['realization']} · Verification: {n['verification']}",
         f"Parents: {', '.join(link_ref(led, x, p) for x in led.parents(nid)) or '-'}",
         f"Depends on: {', '.join(link_ref(led, x, p) for x in n.get('depends', [])) or '-'}",
         f"Approved: {n.get('approved') or '-'}",
         *state_line(n), "",
         "## Statement", "", f"`{n['statement']}`" + (f" — {n['gloss']}" if n.get("gloss") else ""), "",
         "## Effect", "", n.get("effect") or "-", "",
         "## Contract", ""]
    L += [f"- {k.title()}: {v}" for k, v in n.get("contract", {}).items()] or ["-"]
    if n.get("body"):
        L += ["", "## Refinement", ""]
        if n.get("walkthrough"):
            L += ["What it does:", *[f"{ln}" for ln in n["walkthrough"]], ""]
        L += ["```pseudo", *algorithm_lines(nid, n, item_tag), "```"]
        lines = [(it.get("child") or it.get("reuse") or it.get("target", ""),
                  it.get("gloss") or led.nodes.get(it.get("child") or it.get("reuse", ""), {}).get("gloss", ""))
                 for it in n["body"] if any(k in it for k in ("child", "reuse", "target"))]
        if any(g for _, g in lines):
            L += ["", *[f"- {c} — {g}" for c, g in lines if g]]
    children = {it.get("child") for it in n.get("body", []) if it.get("child")}
    deferred = [*n.get("deferred", []), *[f"{a['claim']} — {a['conflict']} → {a['resolves_at']}" for a in led.data.get("ambiguities", []) if a["resolves_at"] in children]]
    for f, title, items in (("composition", "Composition argument", n.get("composition", [])), ("decisions", "Decisions", n.get("decisions", [])), ("deferred", "Deferred", deferred)):
        if items:
            L += ["", f"## {title}", "", *[f"- {b}" for b in items]]
    if s := n.get("superseded"):
        L += ["", f"## Superseded refinement", "", f"Replaced {s['date']}" + (f" — {s['reason']}" if s.get("reason") else "")]
        if s.get("body"):
            L += ["", "```pseudo", *body_text(s["body"]), "```"]
        for f, title in (("composition", "Composition argument"), ("decisions", "Decisions"), ("deferred", "Deferred")):
            if s.get(f):
                L += ["", f"Superseded {title.lower()}:", *[f"- {b}" for b in s[f]]]
    collapsed = not n.get("target") and led.is_collapsed(n)
    if n.get("target") or n.get("adaptation") or collapsed:
        L += ["", "## Realization", ""]
        if n.get("target"):
            L.append(f"Target: `{n['target']}`")
        elif collapsed:
            heads = dict.fromkeys(it["target"].split(":", 1)[0].strip() for it in n["body"] if it.get("target"))
            L.append("Collapsed leaf. Targets: " + ", ".join(f"`{h}`" for h in heads))
        L += [f"Adaptation: {a}" for a in n.get("adaptation", [])]
    if n.get("bindings") or n.get("observation") or n.get("origin") == "existing-code":
        L += ["", "## Existing implementation", f"Sources: {n.get('source_state', 'unbound')} · Conformance: {n.get('conformance', {}).get('status', 'unassessed')}",
              f"Current implementation: {n.get('current_implementation_version', 'unknown')}",
              f"Recorded implementation revision: {n.get('implementation_revision', 0)} · {n.get('implementation_version', 'none')}"]
        for sid, b in n.get("bindings", {}).items():
            L.append(f"- {sid}: `{b['path']}`" + (f" · {b['symbol']}" if b.get('symbol') else "") + f" · SHA-256 {b['baseline_sha256']}")
        if n.get("observed_children"):
            L += ["", "Observed children: " + ", ".join(link_ref(led, cid, p) for cid in n['observed_children'])]
        if obs := n.get("observation"):
            L += ["", "### Observed behavior", obs['effect'], f"Inspected: {obs['date']} by {obs['by']} · implementation {obs.get('implementation_version', 'unknown')}"]
            L += [f"- {c['basis']}: {c['text']} (sources: {', '.join(c['sources'])})" for c in obs['claims']]
            if obs.get("body"):
                L += ["", "```pseudo", *body_text(obs['body']), "```"]
            if obs.get("unknowns"):
                L += ["", "### Unknowns", *[f"- {v}" for v in obs['unknowns']]]
            for clause, value in obs.get("comparisons", {}).items():
                L.append(f"- Intended {clause}: {value['status']} — {value['reason']}")
    if n.get("implementation_plan"):
        L += ["", "## Implementation plan", *[f"- {k.title()}: {v}" for k, v in n["implementation_plan"].items()]]
    if n.get("behavior"):
        L += ["", "## Behavior diagrams", "```json", json.dumps(n["behavior"], indent=2), "```"]
    cov = coverage(n)
    L += ["", "## Evidence coverage", f"Covered: {', '.join(cov['covered']) or 'none'} · Missing: {', '.join(cov['missing']) or 'none'} · Failed: {', '.join(cov['failed']) or 'none'}"]
    if n.get("evidence"):
        L += ["", "## Evidence", ""]
        for i, ev in enumerate(n["evidence"], 1):
            L += [f"### EV-{i} {ev['kind']} — {ev['result']}", f"{ev['date']} · {ev['ref']} · Covers: {', '.join(ev.get('clauses') or ev.get('covers', []))} · revision {ev.get('revision', 'legacy')}" + (f" · Resolves: {', '.join(ev['resolves'])}" if ev.get("resolves") else "") + (f" · {ev['note']}" if ev.get("note") else "")]
    if n.get("history"):
        L += ["", "## History", "", *[f"- {h['date']} — {h['event']}" + (f": {h['reason']}" if h.get("reason") else "") for h in n["history"]]]
    return "\n".join(L) + "\n"


def tag_for(led: Ledger, cid: str, reuse: bool) -> str:
    n = led.nodes.get(cid)
    if n and n["design"] == "approved" and led.is_terminal(n):
        return f"{cid} {'✓' if n['verification'] == 'verified' else '⇒'} {n['target']}"
    if n and n["design"] == "approved" and n.get("implementation_plan"):
        return f"{cid} ◇ implementation-ready"
    if reuse or (n and len(led.parents(cid)) >= 2):
        return f"↗ {cid}"
    if not n:
        return f"{cid} (frontier)"
    if n["design"] == "draft":
        return f"{cid} ({led.status(cid)})"
    if n["design"] in ("stale", "superseded"):
        return f"{cid} ({led.status(cid)})"
    if led.is_terminal(n):
        return f"{cid} {'✓' if n['verification'] == 'verified' else '⇒'} {n['target']}"
    return cid


def render_program(led: Ledger) -> tuple[list[str], list[str]]:
    main, procs = [], []
    roots = set(led.roots())
    for nid, n in led.nodes.items():
        if (not n.get("body") and nid not in roots) or n["design"] in ("draft", "retired", "superseded"):
            continue
        destination = main if nid in roots else procs
        if destination:
            destination.append("")
        destination.append(f"{nid} · {led.status(nid)}")
        destination.extend(algorithm_lines(nid, n, item_tag))
    return main, procs


def render_design(led: Ledger) -> str:
    d = led.dir
    fr = led.frontier()
    frontier = sorted(set(fr) | {nid for nid, n in led.nodes.items() if n["design"] == "draft"})
    L = [f"# {led.title} — Design", "", GENERATED, "", "Kind: index · Context: [./CONTEXT.md](./CONTEXT.md)",
         f"Root: {', '.join(led.roots()) or '-'} · Active frontier: {', '.join(frontier) or '-'}", "", "## Applicable ADRs", ""]
    L += [f"- [{a['id']} {a['title']}]({rel(d / 'DESIGN.md', a['path'])}) — {a['status']} — constrains {', '.join(a['constrains']) or '-'}" for a in led.adrs()] or ["- none"]
    L += ["", "## Nodes", "", "| ID | Statement | Parents | Design | Realization | Verification | File |", "| --- | --- | --- | --- | --- | --- | --- |"]
    rows = [(nid, n["statement"].replace("|", "\\|"), ", ".join(led.parents(nid)) or "-", led.status(nid), n["realization"], n["verification"], f"[nodes/{nid}.md](nodes/{nid}.md)") for nid, n in led.nodes.items()]
    rows += [(fid, s.replace("|", "\\|"), p, "frontier", "not-started", "unverified", "-") for fid, (s, p) in fr.items()]
    L += ["| " + " | ".join(r) + " |" for r in sorted(rows)]
    main, procs = render_program(led)
    L += ["", "## Program", "", "```pseudo", *main, "```"]
    if procs:
        L += ["", "### Procedures", "", "```pseudo", *procs, "```"]
    observed = [(nid, n) for nid, n in led.nodes.items() if n.get("origin") == "existing-code" or n.get("observation")]
    if observed:
        L += ["", "## Observed implementation", "", "| Node | Observed children | Source state | Conformance |", "| --- | --- | --- | --- |"]
        L += [f"| [{nid}](nodes/{nid}.md) | {', '.join(n.get('observed_children', [])) or '-'} | {n.get('source_state', 'unbound')} | {n.get('conformance', {}).get('status', 'unassessed')} |" for nid, n in observed]
        L += ["", "Observed behavior is descriptive; it does not approve an intended contract. Use `scan` to find changes and unfinished inspection."]
    return "\n".join(L) + "\n"


def render_context(led: Ledger) -> str:
    D = led.data
    used = led.used_by()
    L = [f"# {led.title} — Shared Context", "", GENERATED, "", f"Kind: index · Status: active · Design: [./DESIGN.md](./DESIGN.md)", "",
         "## Scope", "", D.get("scope") or "-", "", "## Vocabulary", "", "| Term | Is | Avoid | Used by |", "| --- | --- | --- | --- |"]
    for k, e in sorted(D.get("terms", {}).items(), key=lambda kv: kv[0].lower()):
        L.append(f"| [{k}](#{anchor_of(k)}) | {e['definition'].split('. ')[0].rstrip('.')} | {', '.join(e.get('avoid', [])) or '-'} | {', '.join(used.get(k, [])) or '-'} |")
    L += ["", "## Facts and constraints", "", "| ID | Fact | Status | Used by |", "| --- | --- | --- | --- |"]
    for k, e in sorted(D.get("facts", {}).items()):
        L.append(f"| [{k}](#{anchor_of(k + ' ' + e['name'])}) | {e['definition'].split('. ')[0].rstrip('.')} | {e.get('status', 'confirmed')} | {', '.join(used.get(k, [])) or '-'} |")
    L += ["", "## Scenarios", "", "| ID | Scenario | Settles |", "| --- | --- | --- |"]
    for k, e in sorted(D.get("scenarios", {}).items()):
        L.append(f"| [{k}](#{anchor_of(k + ' ' + e['name'])}) | {e['name']} | {e.get('settles') or '-'} |")
    L += ["", "## Open ambiguities", "", "| Term / claim | Conflict | Resolves at |", "| --- | --- | --- |"]
    L += [f"| {a['claim']} | {a['conflict']} | {a['resolves_at']} |" for a in D.get("ambiguities", [])]
    L += ["", "## Explicit non-goals", "", *([f"- {g}" for g in D.get("nongoals", [])] or ["- none"])]
    L += ["", "## Terms", ""]
    for k, e in sorted(D.get("terms", {}).items(), key=lambda kv: kv[0].lower()):
        L += [f"### {k}", "", f"Confirmed: {e['confirmed']}" + (f" · Source: {e['source']}" if e.get("source") else ""), "", e["definition"]]
        for lab, key in (("Avoid", "avoid"), ("Not", "not")):
            if e.get(key):
                L.append(f"{lab}: {', '.join(e[key])}")
        if e.get("example"):
            L.append(f"Example: {e['example']}")
        L += [f"Used by: {', '.join(used.get(k, [])) or '-'}", *_changed(e), ""]
    L += ["## Facts", ""]
    for k, e in sorted(D.get("facts", {}).items()):
        L += [f"### {k} {e['name']}", "", f"Status: {e.get('status', 'confirmed')} · Confirmed: {e['confirmed']}" + (f" · Source: {e['source']}" if e.get("source") else ""), "",
              e["definition"], f"Used by: {', '.join(used.get(k, [])) or '-'}", *_changed(e), ""]
    L += ["## Scenario entries", ""]
    for k, e in sorted(D.get("scenarios", {}).items()):
        L += [f"### {k} {e['name']}", "", f"Confirmed: {e['confirmed']}" + (f" · Settles: {e['settles']}" if e.get("settles") else ""), ""]
        L += [f"{w.title()} {e[w]}" for w in ("given", "when", "then") if e.get(w)]
        if e.get("excludes"):
            L.append(f"Excludes: {e['excludes']}")
        L += _changed(e) + [""]
    return "\n".join(L).rstrip("\n") + "\n"


def _changed(e: dict) -> list[str]:
    return [f"Changed: {c['at'][:10]} — {c['reason']}" for c in e.get("changed", [])]


def render_all(led: Ledger) -> dict[Path, str]:
    out = {led.dir / "DESIGN.md": render_design(led), led.dir / "CONTEXT.md": render_context(led)}
    for nid in led.nodes:
        out[led.dir / "nodes" / f"{nid}.md"] = render_node(led, nid)
    return out


def check(led: Ledger, *, views: bool = True) -> None:
    E = led.errors.append
    W = led.warnings.append
    nodes = led.nodes
    led.errors.extend(existing.validate(led))
    fr = led.frontier()
    live_roots = [r for r in led.roots() if nodes[r]["design"] not in ("retired", "superseded")]
    if nodes and len(live_roots) != 1:
        first = min(live_roots, default="")
        orphans = [r for r in live_roots if r != first]
        E(f"ledger: expected exactly one root node; found {live_roots}."
          + (f" {', '.join(orphans)} lost every caller when a body was rewritten: `retire <dir> <id> \"reason\"` each node the design dropped, "
             "or restore the call in the body that used to make it. Never add a call back to satisfy this message." if orphans else ""))
    adrs = led.adrs()
    adr_ids = {a["id"] for a in adrs}
    for nid, n in nodes.items():
        where = f"{nid}"
        if not is_node_id(nid):
            E(f"{where}: invalid node ID")
        if n["design"] not in DESIGN:
            E(f"{where}: design {n['design']!r} not in {DESIGN}")
        if n["realization"] not in REALIZATION:
            E(f"{where}: realization {n['realization']!r} not in {REALIZATION}")
        if n["verification"] not in VERIFICATION:
            E(f"{where}: verification {n['verification']!r} not in {VERIFICATION}")
        if n["design"] == "superseded" and n.get("superseded_by") not in nodes and n.get("superseded_by") not in fr:
            E(f"{where}: superseded_by {n.get('superseded_by')!r} does not exist")
        if not fn_of(n["statement"]):
            E(f"{where}: statement {n['statement']!r} has no call `f(...)`")
        body = n.get("body", [])
        stmts = [it for it in body if stmt_kind(it["code"]) == "stmt"]
        for it in stmts:
            if not any(k in it for k in ("child", "reuse", "target")) and call_names(it["code"]):
                E(f"{where}: untagged call {it['code']!r}; tag `-- D-NNN` (new id), `-- ↗ D-NNN` (reuse) or `-- ⇒ <target>: <identifier>`")
            if n["design"] not in ("superseded", "retired") and (cid := it.get("child")) in nodes and nodes[cid]["design"] == "superseded":
                E(f"{where}: calls {cid} which is {led.status(cid)}; call the node that replaced it")
            if n["design"] not in ("superseded", "retired") and "reuse" in it and (it["reuse"] not in nodes or nodes[it["reuse"]]["design"] != "approved"):
                E(f"{where}: reuse ↗ {it['reuse']} but it is not an approved node")
            if "target" in it and (why := target_ok(it["target"])):
                E(f"{where}: {why}")
        if n["design"] == "approved":
            if n.get("approved_content_hash") != fingerprint(n):
                E(f"{where}: approved content changed; reopen and re-approve it")
            if node_unknowns(n):
                E(f"{where}: approved with unresolved ?{', ?'.join(node_unknowns(n))}")
            if not body and not n.get("target") and not n.get("implementation_plan"):
                E(f"{where}: approved needs a refinement body (`body`) or a target (`terminal`)")
            if body and not led.is_collapsed(n) and not n.get("composition"):
                E(f"{where}: approved composite lacks composition (`set {nid} composition ...`)")
            if n.get("approved_hash") and n["approved_hash"] != body_hash(body):
                E(f"{where}: body changed since approval; `reopen` then `approve` again")
            if n.get("adr_pending"):
                E(f"{where}: approved while {n['adr_pending']} is pending; `adr accept` first")
        for ad in n.get("adaptation", []):
            clause = ad.partition(":")[0].strip().lower()
            if "→" not in ad and "->" not in ad and clause not in n.get("contract", {}):
                E(f"{where}: adaptation {ad!r} must name the clause it maps — '<clause> → <concrete construct>' or '<Clause>: <concrete construct>' (query text, API call + args, type); behaviour prose is not adaptation")
        if n.get("implementation_plan") and (body or n.get("target")):
            E(f"{where}: implementation-ready leaves cannot also have a body or target")
        if n.get("behavior") and (why := validate_behavior(n["behavior"])):
            E(f"{where}: {why}")
        if n.get("target"):
            if (why := target_ok(n["target"])):
                E(f"{where}: {why}")
            if body and not led.is_collapsed(n):
                E(f"{where}: has target and child statements; a terminal has no body, a collapsed leaf tags every statement `-- ⇒`")
        for r in n.get("depends", []):
            if is_node_id(r) or is_adr_id(r):
                if not led.resolves(r):
                    E(f"{where}: depends on {r} which does not exist")
                elif is_node_id(r) and n["design"] == "approved" and (u := nodes.get(r)) and u["design"] in ("stale", "superseded", "retired"):
                    E(f"{where}: depends on {r} which is {led.status(r)}; `stale` this node and re-approve it against the live design, or re-point the dependency")
                continue
            e = led.entry(r)
            if not e:
                E(f"{where}: depends on {r!r}: no term / fact / scenario with that name or id (`entry` first)")
            elif n["design"] == "approved" and n.get("approved_at"):
                last = max((c["at"] for c in e[2].get("changed", [])), default="")
                if last > n["approved_at"]:
                    E(f"{where}: {e[1]} changed {last[:10]} after approval {n['approved_at'][:10]}; `stale` or `reopen`+`approve`")
        if n.get("adr_pending") and n["adr_pending"] not in adr_ids:
            E(f"{where}: adr_pending {n['adr_pending']} has no file")
    for a in adrs:
        for rid in a["constrains"]:
            if a["status"] not in ("superseded", "deprecated") and rid in nodes and nodes[rid]["design"] == "superseded":
                E(f"{a['path'].name}: constrains {rid} which is {led.status(rid)}; re-point to the live node")
            elif rid not in nodes and rid not in fr:
                E(f"{a['path'].name}: constrains {rid} which does not exist")
        if "<1–3 sentences" in "\n".join(a["lines"]):
            W(f"{a['path'].name}: paragraph still a placeholder")
    live = [n for n in nodes.values() if n["design"] not in ("retired", "superseded") and n.get("contract")]
    prose = " ".join(" ".join([n.get("statement", ""), n.get("effect", ""), *n.get("contract", {}).values()]).lower() for n in live)
    words = set("".join(c if c.isalnum() else " " for c in prose).split())
    if live and not fr and all(n["design"] == "approved" for n in live) and not led.data.get("scenarios") and words & {"state", "retry", "durable", "workflow", "transition", "concurrent", "concurrency"}:
        W("ledger: complete stateful design has no scenarios; record relevant success and failure paths")
    for amb in led.data.get("ambiguities", []):
        r = amb["resolves_at"]
        if r in nodes and nodes[r]["design"] == "approved":
            E(f"ambiguity {amb['claim']!r} resolves at {r} which is approved; re-point (`ambiguity`) or drop it")
    for f in ("terms", "facts", "scenarios"):
        for k, e in led.data.get(f, {}).items():
            if not (e.get("definition") or e.get("then")):
                E(f"{f}/{k}: empty definition")
            if f == "scenarios" and e.get("settles") and not led.terms_in(e["settles"]):
                W(f"{f}/{k}: settles {e['settles']!r} names no term")
            for t in e.get("not", []):
                if not led.entry(t):
                    W(f"{f}/{k}: not {t!r} is not a term")
    for p, text in (render_all(led).items() if views else []):
        if not p.exists():
            E(f"{p.name}: missing; run sync")
        elif p.read_text(encoding="utf-8") != text:
            E(f"{os.path.relpath(p, led.dir)}: generated view edited or stale; run sync (edit the ledger via the CLI, never the view)")


def compact_errors(errors: list[str]) -> list[str]:
    grouped: dict[str, list[str]] = {}
    rest = []
    for error in errors:
        _, marker, tail = error.partition(": constrains ")
        node = tail.split(" ", 1)[0] if marker else ""
        if marker and is_node_id(node):
            grouped.setdefault(node, []).append(error)
        else:
            rest.append(error)
    for node, items in sorted(grouped.items()):
        if len(items) == 1:
            rest.extend(items)
        else:
            rest.append(f"{len(items)} ADRs are blocked by {node}; run `repair` for dependency order")
    return rest


def report(led: Ledger, head: str = "") -> int:
    if head:
        print(head)
    for w in led.warnings:
        print(f"warn  {w}")
    for e in compact_errors(led.errors):
        print(f"error {e}")
    print(f"{'FAIL' if led.errors else 'ok'}  {led.dir.name}: {len(led.nodes)} nodes, {len(led.frontier())} frontier, {len(led.errors)} errors, {len(led.warnings)} warnings")
    return 1 if led.errors else 0


def derive_depends(led: Ledger) -> None:
    """A term / CTX id / ADR id named in a node's prose is a dependency; record it so `Used by` and staleness follow."""
    adrs = led.adrs()
    adr_ids = {a["id"] for a in adrs}
    for adr in adrs:
        for nid in adr["constrains"]:
            n = led.nodes.get(nid)
            if n is not None and adr["id"] not in n.setdefault("depends", []):
                n["depends"].append(adr["id"])
    for nid, n in led.nodes.items():
        text = " ".join([n.get("gloss", ""), n.get("effect", ""), *n.get("contract", {}).values()])
        deps = n.setdefault("depends", [])
        called = {it.get("child") or it.get("reuse") for it in n.get("body", [])}  # body edges already carry these
        for word in text.split():
            w = word.strip(",.;:()[]`")
            if (is_ctx_id(w) and led.entry(w)) or (is_adr_id(w) and w in adr_ids) \
                    or (is_node_id(w) and w != nid and w not in called and w in led.nodes):
                if w not in deps:
                    deps.append(w)
        for rows in n.get("behavior", {}).values():
            for row in rows:
                ref = row.get("node")
                if ref and ref != nid and ref not in deps:
                    deps.append(ref)
        padded = f" {text} "
        for t in led.data.get("terms", {}):
            if f" {t} " in padded.replace(",", " ").replace(".", " ").replace(";", " ").replace("(", " ").replace(")", " ") and t not in deps:
                deps.append(t)


def finish(led: Ledger, head: str = "") -> int:
    # Commands mutate only memory. The outer transaction validates and renders once.
    if head:
        led.messages.append(head)
    return 0


def fail(msg: str) -> int:
    print(f"error {msg}", file=sys.stderr)
    return 1


# ----------------------------------------------------------------------------- verbs


def need(led: Ledger, nid: str) -> dict | None:
    n = led.node(nid)
    if n is None:
        fail(f"{nid}: no such node" + (" — it is on the frontier; `new` it first" if nid in led.frontier() else ""))
    return n


def hist(n: dict, event: str, reason: str = "") -> None:
    n.setdefault("history", []).append({"date": today(), "event": event, **({"reason": reason} if reason else {})})


def v_frontier(led: Ledger, a) -> int:
    for fid, (stmt, parent) in sorted(led.frontier().items()):
        print(f"{fid}  frontier  {stmt}  (child of {parent})")
    drafts = [nid for nid, n in led.nodes.items() if n["design"] == "draft" and (n.get("origin") != "existing-code" or n.get("contract") or led.dependents(nid))]
    for nid in drafts:
        print(f"{nid}  {led.status(nid)}  {led.nodes[nid]['statement']}")
    if not led.frontier() and not drafts:
        print("design frontier empty; use scan for existing-code observation work" if any(n.get("origin") == "existing-code" for n in led.nodes.values()) else "frontier empty — check approval and leaf readiness" if led.nodes else 'no nodes — `new <dir> D-000 "outcome <- f(x)"`')
    return 0


def v_show(led: Ledger, a) -> int:
    if need(led, a.id) is None:
        return 1
    print(render_node(led, a.id), end="")
    return 0


def v_new(led: Ledger, a) -> int:
    if a.id in led.nodes:
        return fail(f"{a.id} already exists")
    fr = led.frontier()
    if a.id in fr:
        pid = fr[a.id][1]
        code = next(it["code"] for it in led.nodes[pid]["body"] if it.get("child") == a.id)
    elif a.statement and not led.nodes:
        code = a.statement
    elif a.statement:
        return fail(f"{a.id} is not on the frontier and a root already exists ({led.roots()}); pick from `frontier`")
    else:
        return fail(f"{a.id} is not on the frontier; a root needs its statement: new <dir> {a.id} \"outcome <- f(x)\"")
    if not fn_of(code):
        return fail(f"statement {code!r} has no call `f(...)`")
    led.nodes[a.id] = {"statement": code, "gloss": "", "effect": "", "contract": {}, "depends": [],
                       "design": "draft", "realization": "not-started", "verification": "unverified", "approved": ""}
    return finish(led, f"created {a.id} `{code}` (draft). Next: `set <dir> {a.id} '<json>'` with gloss, effect, and contract (unknowns as ?slug), then `answer`, `body`, `approve`.")


def content_edit_error(nid: str, n: dict) -> str:
    if n["design"] == "draft":
        return ""
    if TRANSITIONS.get((n["design"], "draft")) == "reopen":
        return f"{nid} is {n['design']}; `reopen {nid} \"reason\"` before changing approved design content"
    state = f"superseded by {n.get('superseded_by', '?')}" if n["design"] == "superseded" else n["design"]
    return f"{nid} is {state}; its historical content cannot be edited"


def v_set_json(led: Ledger, nid: str, n: dict, raw: str) -> int:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        return fail(f"{nid}: invalid JSON set payload at line {e.lineno}, column {e.colno}: {e.msg}")
    if not isinstance(payload, dict):
        return fail(f"{nid}: JSON set payload must be an object")
    if not payload:
        return fail(f"{nid}: JSON set payload is empty")
    unknown = sorted(set(payload) - set(JSON_SET_FIELDS))
    if unknown:
        return fail(f"{nid}: unknown JSON field(s) {', '.join(unknown)}; fields: {', '.join(JSON_SET_FIELDS)}")

    updates: dict[str, object] = {}
    for f, value in payload.items():
        if f in TEXT_FIELDS:
            if not isinstance(value, str):
                return fail(f"{nid}: JSON field {f!r} must be a string")
            updates[f] = value.strip()
        elif f == "contract":
            if not isinstance(value, dict):
                return fail(f"{nid}: JSON field 'contract' must be an object of lowercase label to clause")
            contract: dict[str, str] = {}
            for label, clause in value.items():
                if not label.isalpha() or not label.islower():
                    return fail(f"{nid}: contract label {label!r} must be one lowercase word")
                if not isinstance(clause, str):
                    return fail(f"{nid}: contract clause {label!r} must be a string")
                contract[label] = clause.strip()
            updates[f] = contract
        elif f in LIST_FIELDS:
            if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
                return fail(f"{nid}: JSON field {f!r} must be an array of strings")
            items = [item.strip() for item in value if item.strip()]
            updates[f] = items
        elif f == "depends":
            if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
                return fail(f"{nid}: JSON field 'depends' must be an array of entry, node, or ADR names")
            deps: list[str] = []
            for item in value:
                ref = led.canonical(item)
                if not led.resolves(ref):
                    return fail(f"{nid}: {item!r} is not a term / fact / scenario / node / ADR on disk — `entry` first")
                if ref not in deps:
                    deps.append(ref)
            updates[f] = deps
        elif f == "realization":
            if not isinstance(value, str) or value not in REALIZATION:
                return fail(f"{nid}: realization must be one of {REALIZATION}")
            updates[f] = value
        elif f == "verification":
            if value != coverage(n)["status"]:
                return fail(f"{nid}: verification is derived from current clause evidence; use `evidence --clause LABEL`")
        elif f == "implementation_plan":
            if not isinstance(value, dict) or set(value) != {"approach", "validation"} or not all(isinstance(v, str) and v.strip() for v in value.values()):
                return fail(f"{nid}: implementation_plan needs nonempty approach and validation strings")
            updates[f] = value
        elif f == "behavior":
            if why := validate_behavior(value):
                return fail(f"{nid}: {why}")
            updates[f] = value

    semantic_changed = any(f in DESIGN_CONTENT_FIELDS and n.get(f) != value for f, value in updates.items())
    historical_content_changed = n["design"] in ("superseded", "retired") and any(
        f in DESIGN_CONTENT_FIELDS and n.get(f) != value for f, value in updates.items()
    )
    if (semantic_changed or historical_content_changed) and (why := content_edit_error(nid, n)):
        return fail(why)
    n.update(updates)
    fields = ", ".join(payload)
    return finish(led, f"{nid} set from JSON: {fields}" + (f"; open ?: {node_unknowns(n)}" if node_unknowns(n) else ""))


def v_set(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    f, vals = a.field, a.value
    if not vals and f.lstrip().startswith(("{", "[")):
        return v_set_json(led, a.id, n, f)
    if not vals:
        return fail(f"{a.id}: field {f!r} needs a value; for several fields pass one quoted JSON object")
    if f.lstrip().startswith(("{", "[")):
        return fail(f"{a.id}: JSON set payload must be passed as one quoted argument")
    contract_field = f in CONTRACT_KEYS or (f.isalpha() and f.islower() and f not in LIST_FIELDS + ("realization", "verification", "depends"))
    if n["design"] in ("superseded", "retired") and (f in TEXT_FIELDS + LIST_FIELDS + ("depends",) or contract_field):
        return fail(content_edit_error(a.id, n))
    if (f in DESIGN_CONTENT_FIELDS or contract_field) and (why := content_edit_error(a.id, n)):
        return fail(why)
    if f in TEXT_FIELDS:
        n[f] = " ".join(vals).strip()
    elif contract_field:
        # any lowercase word is a contract clause label: pre, post, failure, invariant, budget, determinism, boundary, ...
        n.setdefault("contract", {})[f] = " ".join(vals).strip()
    elif f in LIST_FIELDS:
        n[f] = [v.strip() for v in vals if v.strip()]
    elif f == "depends":
        deps = n.setdefault("depends", [])
        if vals == ["-"]:  # a dependency named by mistake; derived ones come back on the next sync
            deps.clear()
            return finish(led, f"{a.id}.depends cleared")
        for v in vals:
            ref = led.canonical(v)
            if not led.resolves(ref):
                return fail(f"{v!r} is not a term / fact / scenario / node / ADR on disk — `entry` first")
            if ref not in deps:
                deps.append(ref)
        return finish(led, f"{a.id}.depends = {deps}")
    elif f == "realization":
        if vals[0] not in REALIZATION:
            return fail(f"realization must be one of {REALIZATION}")
        n[f] = vals[0]
    elif f == "verification":
        if vals[0] != coverage(n)["status"]:
            return fail("verification is derived from current clause evidence; use `evidence --clause LABEL`")
    else:
        return fail(f"unknown field {f!r}; fields: {TEXT_FIELDS + CONTRACT_KEYS + LIST_FIELDS + ('realization', 'verification')}")
    return finish(led, f"{a.id}.{f} set" + (f"; open ?: {node_unknowns(n)}" if node_unknowns(n) else ""))


def v_body(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    if why := content_edit_error(a.id, n):
        return fail(why)
    if a.file and a.text is not None:
        return fail("body accepts --file or --text, not both")
    text = a.text if a.text is not None else Path(a.file).read_text(encoding="utf-8") if a.file else sys.stdin.read()
    items = parse_body(text, fn_of(n["statement"]))
    if not items:
        return fail("empty body")
    n["body"] = items
    n.pop("implementation_plan", None)
    n.pop("target", None)
    autotag(led, a.id)
    new = [it["child"] for it in n["body"] if it.get("child") and it["child"] not in led.nodes]
    return finish(led, f"{a.id} body: {len(items)} lines; children {sorted(set(new)) or 'none new'}")


def autotag(led: Ledger, nid: str) -> None:
    by_fn: dict[str, list[str]] = {}
    for oid, o in led.nodes.items():
        if oid != nid and fn_of(o["statement"]):
            by_fn.setdefault(fn_of(o["statement"]), []).append(oid)
    for it in led.nodes[nid].get("body", []):
        if stmt_kind(it["code"]) != "stmt" or any(k in it for k in ("child", "reuse", "target")):
            continue
        calls = call_names(it["code"])
        if len(calls) == 1 and len(by_fn.get(calls[0], [])) == 1:
            it["child"] = by_fn[calls[0]][0]


def v_answer(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    if why := content_edit_error(a.id, n):
        return fail(why)
    slug = a.slug.lstrip("?")
    if slug not in node_unknowns(n):
        return fail(f"{a.id} has no ?{slug}; open: {node_unknowns(n) or 'none'}")
    ref = led.canonical(a.name)
    if not led.resolves(ref):
        return fail(f"{a.name!r} is not on disk — `entry <dir> term|fact|scenario \"{a.name}\" \"<definition>\"` first")

    def sub(t: str) -> str:
        words = t.split(" ")
        return " ".join(ref + w[len(slug) + 1:] if w.startswith("?" + slug) and w[len(slug) + 1:len(slug) + 2] in ("", ",", ".", ";", ":", ")", "]") else w for w in words)
    for f in TEXT_FIELDS:
        n[f] = sub(n.get(f, ""))
    n["contract"] = {k: sub(v) for k, v in n.get("contract", {}).items()}
    if ref not in n.setdefault("depends", []):
        n["depends"].append(ref)
    left = node_unknowns(n)
    return finish(led, f"{a.id}: ?{slug} -> {ref}; depends += {ref}" + (f"; open: {left}" if left else "; no ? left — propose the refinement"))


def v_terminal(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    if why := content_edit_error(a.id, n):
        return fail(why)
    t = a.target.strip().strip("`")
    if (why := target_ok(t)):
        return fail(why)
    if n.get("body") and not led.is_collapsed(n):
        return fail(f"{a.id} has child statements; a terminal has no body (drop it) — or collapse: tag every statement `-- ⇒ <target>: <identifier>`")
    n["target"] = t
    n.pop("implementation_plan", None)
    return finish(led, f"{a.id} terminal ⇒ {t}. Add `set <dir> {a.id} '{{\"adaptation\":[\"<clause> → <real>\"]}}'` when shape changes, then `approve {a.id}`")


def v_proposal(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    derive_depends(led)
    print(f"proposal {a.id} {proposal_hash(n)}")
    return 0


def v_approve(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    derive_depends(led)
    problems = []
    actor = a.actor.strip() or a.by.strip()
    if not actor:
        problems.append("approval actor missing; pass --by or --actor")
    if a.actor and not a.proposal_hash:
        problems.append("proposal hash missing; use proposal then --proposal-hash with --actor")
    if a.proposal_hash and a.proposal_hash != proposal_hash(n):
        problems.append(f"approval hash does not match current proposal {proposal_hash(n)}")
    if node_unknowns(n):
        problems.append(f"unresolved ?{', ?'.join(node_unknowns(n))} — `answer` each")
    for f in ("gloss", "effect"):
        if not n.get(f):
            problems.append(f"{f} empty — `set {a.id} {f} ...`")
    if any(not clause.strip() for clause in n.get("contract", {}).values()):
        problems.append("contract clauses must be nonempty")
    if not n.get("contract"):
        problems.append(f"contract empty — `set {a.id} pre|post|failure|invariant ...`")
    body = n.get("body", [])
    if not body and not n.get("target") and not n.get("implementation_plan"):
        problems.append("needs a body, terminal target, or bounded `ready` implementation plan")
    if body and not n.get("walkthrough"):
        problems.append(f"walkthrough missing — `set {a.id} walkthrough \"...\"` (what the function does)")
    if body and not led.is_collapsed(n) and not n.get("composition"):
        problems.append(f"composition missing — `set {a.id} composition ...`")
    for it in body:
        tagged = next((k for k in ("child", "reuse", "target") if k in it), "")
        known = led.nodes.get(it.get("child") or it.get("reuse", ""), {}).get("gloss")
        if tagged and not it.get("gloss") and not known:
            how = f"-- {it['child']}: <one line>" if tagged == "child" else f"-- {item_tag(it)} -- <one line>"
            problems.append(f"{it['code']!r} says nothing about what it does — tag it `{how}`")
    for it in body:
        if stmt_kind(it["code"]) == "stmt" and not any(k in it for k in ("child", "reuse", "target")) and call_names(it["code"]):
            problems.append(f"untagged call {it['code']!r}")
    if n.get("target") and (why := target_ok(n["target"])):
        problems.append(why)
    if n.get("adr_pending"):
        problems.append(f"{n['adr_pending']} pending — `adr accept {n['adr_pending']}` after the user accepts it")
    if problems:
        print(f"refused {a.id}:", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    if TRANSITIONS.get((n["design"], "approved")) is None:
        legal = sorted({v for (f, _), v in TRANSITIONS.items() if f == n["design"]})
        return fail(f"{a.id} is {n['design']}; `approve` moves a draft. From {n['design']}: {', '.join(legal) or 'none'}")
    re_approval = bool(n.get("approved"))
    contract_changed = re_approval and n.get("contract_hash", contract_hash(n)) != contract_hash(n)
    n.pop("stale_by", None)
    n["design"] = "approved"
    n["approved"] = f"{today()} by {actor}"
    n["approved_by"] = actor
    n["proposal_hash"] = proposal_hash(n)
    n["approved_at"] = now()
    n["revision"] = n.get("revision", 0) + 1
    n["approved_content_hash"] = fingerprint(n)
    n["approved_hash"] = body_hash(body)
    n["contract_hash"] = contract_hash(n)
    if re_approval:
        hist(n, "re-approved")
    cascaded = cascade_stale(led, a.id, "contract changed") if contract_changed else []
    ambs = led.data.get("ambiguities", [])
    resolved = [x["claim"] for x in ambs if x["resolves_at"] == a.id]
    ambs[:] = [x for x in ambs if x["resolves_at"] != a.id]
    rc = finish(led, f"approved {a.id}"
                + (f"; contract changed, now stale: {', '.join(cascaded)}" if cascaded else "")
                + (f"; resolved ambiguities dropped: {', '.join(resolved)}" if resolved else ""))
    fr = led.frontier()
    new = [it["child"] for it in body if it.get("child") in fr]
    if new:
        print(f"next: `new <dir> {new[0]}`  (frontier: {', '.join(sorted(fr))})")
    elif not fr and not any(x["design"] == "draft" for x in led.nodes.values()):
        print("frontier empty — check remaining stale or unapproved nodes before declaring completion")
    return rc


def flip(led: Ledger, nid: str, design: str, event: str, reason: str, **extra) -> int:
    n = need(led, nid)
    if n is None:
        return 1
    verb = TRANSITIONS.get((n["design"], design))
    if verb is None:
        legal = sorted({v for (f, _), v in TRANSITIONS.items() if f == n["design"]})
        return fail(f"{nid} is {n['design']}; it cannot become {design}. From {n['design']} the legal moves are: {', '.join(legal) or 'none'}")
    if design != "stale":
        n.pop("stale_by", None)
    n["design"] = design
    n.update(extra)
    if design != "approved" and n["verification"] == "verified":
        n["verification"] = "stale"
    hist(n, event, reason)
    cascaded = cascade_stale(led, nid, event) if design in ("stale", "superseded", "retired") else []
    return finish(led, f"{nid} -> {led.status(nid)}" + (f"; now stale: {', '.join(cascaded)}" if cascaded else ""))


def v_reopen(led: Ledger, a) -> int:
    n = led.nodes.get(a.id)
    if n and n["design"] in ("approved", "stale", "retired"):
        n.setdefault("revisions", []).append({"date": now(), "reason": a.reason, "approved": n.get("approved"), "revision": n.get("revision", 0), "content": {f: copy.deepcopy(n[f]) for f in CONTENT_FIELDS if f in n}})
    if n and n.get("body"):  # keep the refinement being replaced as a record
        n["superseded"] = {"date": today(), "reason": a.reason,
                           **{f: n.get(f) for f in ("body", "composition", "decisions", "deferred") if n.get(f)}}
    return flip(led, a.id, "draft", "reopened", a.reason)


def v_retire(led: Ledger, a) -> int:
    """The design dropped this node: no body calls it any more and none should."""
    if led.parents(a.id):
        return fail(f"{a.id} is still called by {', '.join(led.parents(a.id))}; remove the call first, or this node is not retired")
    return flip(led, a.id, "retired", "retired", a.reason)


def changed_deps(led: Ledger, n: dict) -> list[str]:
    """Entries this node depends on that changed after it was approved — the reason it is stale."""
    since, out = n.get("approved_at", ""), []
    for r in n.get("depends", []):
        if is_node_id(r):
            u = led.nodes.get(r)
            if u and (u["design"] in ("stale", "superseded", "retired") or u.get("approved_at", "") > since):
                out.append(f"{r} ({led.status(r)})")
        elif (e := led.entry(r)) and (last := max((c["at"] for c in e[2].get("changed", [])), default="")) > since:
            out.append(f"{e[1]} ({last[:10]})")
    return out


def cascade_stale(led: Ledger, origin: str, why: str) -> list[str]:
    """origin's contract changed or died; every approved node downstream of it rests on the old one, so it is stale."""
    seen, queue, out = {origin}, led.dependents(origin), []
    while queue:
        nid = queue.pop()
        if nid in seen:
            continue
        seen.add(nid)
        queue += led.dependents(nid)  # a dead contract travels the whole graph, not one hop
        n = led.nodes[nid]
        if n["design"] != "approved":
            continue
        n["design"] = "stale"
        n["stale_by"] = [f"{origin} ({why} {today()})"]
        if n["verification"] == "verified":
            n["verification"] = "stale"
        hist(n, "stale", f"{origin} {why}")
        out.append(nid)
    return sorted(out)


def v_stale(led: Ledger, a) -> int:
    n = led.nodes.get(a.id)
    if n is not None:
        n["stale_by"] = changed_deps(led, n)
    return flip(led, a.id, "stale", "stale", a.reason)


def v_reaffirm(led: Ledger, a) -> int:
    """A dependency's contract moved and cascaded this node stale, but the node itself is untouched. `reopen` + `approve`
    would demand a revision reason nobody has and overwrite the superseded-refinement record with a copy of the current body."""
    n = need(led, a.id)
    if n is None:
        return 1
    if n["design"] != "stale":
        return fail(f"{a.id} is {n['design']}; `reaffirm` returns a stale node, nothing else")
    if not (a.actor.strip() or a.by.strip()):
        return fail(f"approval actor missing — pass `--actor <name>`; a reaffirmation is still someone accepting {a.id}")
    if not intact(n):
        return fail(f"{a.id} changed since it was approved; `reopen {a.id} \"<reason>\"` then `proposal` + `approve` — "
                    "reaffirm only returns a node whose own statement, contract and body are untouched")
    why = ", ".join(n.pop("stale_by", [])) or "changed dependencies"
    n["design"] = "approved"
    n["approved"] = f"{n.get('approved', today())}; reaffirmed {today()} by {(a.actor.strip() or a.by.strip())}"
    n["approved_by"] = (a.actor.strip() or a.by.strip())
    n["approved_at"] = now()  # the node now stands against the dependency as it is today
    n["revision"] = n.get("revision", 0) + 1
    hist(n, "reaffirmed", why)
    refresh_ledger(led)
    return finish(led, f"reaffirmed {a.id} against {why}; verification stays {n['verification']}")


def v_supersede(led: Ledger, a) -> int:
    if not led.resolves(a.new_id):
        return fail(f"{a.new_id} does not exist and is not on the frontier")
    return flip(led, a.id, "superseded", "superseded", a.reason, superseded_by=a.new_id)


def v_evidence(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    clauses = comma_values([*a.clause, *a.covers])
    if not clauses:
        return fail("evidence requires --clause LABEL or --covers LABEL[,LABEL]")
    missing = set(clauses) - set(n.get("contract", {}))
    if missing:
        return fail(f"unknown contract clauses: {', '.join(sorted(missing))}")
    if n["design"] != "approved":
        return fail("approve the current design before recording scoped evidence")
    refresh_ledger(led)
    resolves = comma_values(a.resolves)
    if resolves and a.result != "pass":
        return fail("only passing evidence can resolve failed evidence")
    from stepwise_state import current_evidence
    current = dict(current_evidence(n))
    for ref in resolves:
        ev = current.get(ref)
        if not ev or ev.get("result") != "fail":
            return fail(f"{ref} is not current failed evidence on {a.id}")
        if not set(ev.get("clauses", [])) <= set(clauses):
            return fail(f"resolving {ref} must cover every failed obligation")
    n.setdefault("evidence", []).append({"date": now(), "kind": a.kind, "ref": a.ref, "result": a.result,
        "clauses": clauses, "resolves": resolves, "revision": n.get("revision", 0), "content_hash": fingerprint(n), "dependency_hash": n["evidence_context"],
        **({"note": a.note} if a.note else {})})
    n["verification"] = coverage(n)["status"]
    return finish(led, f"{a.id} evidence EV-{len(n['evidence'])}; verification {n['verification']}; missing clauses {coverage(n)['missing']}")


def v_ready(led: Ledger, a) -> int:
    n = need(led, a.id)
    if n is None:
        return 1
    if why := content_edit_error(a.id, n):
        return fail(why)
    if not a.approach.strip() or not a.validation.strip():
        return fail("ready requires a bounded implementation approach and a validation plan")
    n.pop("body", None)
    n.pop("target", None)
    n["implementation_plan"] = {"approach": a.approach.strip(), "validation": a.validation.strip()}
    return finish(led, f"{a.id} implementation-ready; approve its contract and plan")


def v_entry(led: Ledger, a) -> int:
    f = ENTRY_FILE[a.kind]
    store = led.data.setdefault(f, {})
    heading = a.heading.strip()
    if a.kind == "term":
        if led.entry(heading):
            return fail(f"{heading!r} already exists; `change <dir> \"{heading}\" --definition ... --reason ...`")
        key = heading
        e = {"definition": a.definition.strip(), "confirmed": today()}
        if a.avoid:
            e["avoid"] = [x.strip() for x in a.avoid.split(",") if x.strip()]
        if a.not_:
            e["not"] = [x.strip() for x in a.not_.split(",") if x.strip()]
        if a.example:
            e["example"] = a.example
    else:
        prefix = "CTX-F" if a.kind == "fact" else "CTX-S"
        if is_ctx_id(heading.split(" ", 1)[0]):
            key, heading = heading.split(" ", 1)[0], heading.split(" ", 1)[1].strip() if " " in heading else ""
            if key in store:
                return fail(f"{key} already exists; `change <dir> {key} ...`")
        else:
            key = f"{prefix}{max((int(k[5:]) for k in store), default=0) + 1:02d}"
        e = {"name": heading, "definition": a.definition.strip(), "confirmed": today()}
        if a.kind == "fact":
            e["status"] = "confirmed"
        else:
            for w in ("given", "when", "then", "excludes", "settles"):
                if getattr(a, w):
                    e[w] = getattr(a, w).strip()
    if a.source:
        e["source"] = a.source
    store[key] = e
    return finish(led, f"entry {f}/{key}" + (f" {heading}" if a.kind != "term" else "") + f"; refer to it as `{key}`")


def v_change(led: Ledger, a) -> int:
    hit = led.entry(a.ref)
    if not hit:
        return fail(f"{a.ref!r}: no term / fact / scenario")
    f, key, e = hit
    if a.definition:
        e["definition"] = a.definition.strip()
    if a.status:
        if f != "facts":
            return fail("--status applies to facts only")
        e["status"] = a.status
    if a.rename:
        head = a.rename.strip()
        store = led.data[f]
        if f == "terms":  # terms are keyed by their name; facts and scenarios by their CTX id
            if head in store:
                return fail(f"{head!r} already exists")
            store[head] = store.pop(key)
            for n in led.nodes.values():
                n["depends"] = [head if x == key else x for x in n.get("depends", [])]
            for x in led.data.get("ambiguities", []):
                if x["claim"] == key:
                    x["claim"] = head
            key = head
        else:
            e["name"] = head
    if a.minor:
        return finish(led, f"{f}/{key} reworded (minor, no invalidation)")
    e.setdefault("changed", []).append({"at": now(), "reason": a.reason})
    users = led.used_by().get(key, [])
    for nid in users:
        n = led.nodes.get(nid)
        if n and n["design"] == "approved":
            n["design"] = "stale"
            n["stale_by"] = [key]
            hist(n, "stale", f"{key} changed: {a.reason}")
            cascade_stale(led, nid, f"{key} changed")
    return finish(led, f"{f}/{key} changed; dependents to re-check: {', '.join(users) or 'none'} (`stale` or `reopen`+`approve` each approved one)")


def v_meta(led: Ledger, a) -> int:
    if a.field in ("title", "scope"):
        led.data[a.field] = " ".join(a.value).strip()
    elif a.field == "nongoals":
        led.data["nongoals"] = [v.strip() for v in a.value if v.strip()]
    else:
        return fail("meta field must be title | scope | nongoals")
    return finish(led, f"{a.field} set")


def v_ambiguity(led: Ledger, a) -> int:
    ambs = led.data.setdefault("ambiguities", [])
    ambs[:] = [x for x in ambs if x["claim"].lower() != a.claim.strip().lower()]
    if a.drop:
        return finish(led, f"ambiguity {a.claim!r} dropped")
    if not a.conflict or not a.resolves_at:
        return fail('ambiguity <dir> "claim" "conflict" D-NNN   (or --drop)')
    if not is_node_id(a.resolves_at):
        return fail(f"{a.resolves_at!r} is not a D-NNN id")
    ambs.append({"claim": a.claim.strip(), "conflict": a.conflict.strip(), "resolves_at": a.resolves_at})
    return finish(led, f"ambiguity {a.claim!r} -> resolves at {a.resolves_at}")


ADR_STUB = """# {id} — {title}

Kind: adr · Status: proposed · Date: {date}
Constrains: {constrains}
Supersedes: — · Superseded by: —

<1–3 sentences: what's the context, what did we decide, and why.>

## Invariants imposed

- <one line: property every constrained refinement must preserve>
"""


def v_adr(led: Ledger, a) -> int:
    if a.action == "new":
        ids = [w.strip() for w in (a.constrains or "").split(",") if is_node_id(w.strip())]
        if not a.title or not ids:
            return fail('adr <dir> new "Title" --constrains D-NNN[,D-MMM]')
        adr_dir = led.adr_dir() or (led.dir.parents[1] / "adr" if len(led.dir.parents) > 1 else led.dir / "adr")
        num = max((int(a["id"][4:]) for a in led.adrs() if is_adr_id(a["id"])), default=0) + 1
        slug = "-".join("".join(c.lower() if c.isalnum() else " " for c in a.title).split())[:50]
        path = adr_dir / f"{num:04d}-{slug}.md"
        aid = f"ADR-{num:04d}"
        led.files[path] = ADR_STUB.format(id=aid, title=a.title.strip(), date=today(), constrains=", ".join(ids))
        for nid in ids:
            if nid in led.nodes:
                led.nodes[nid]["adr_pending"] = aid
                if led.nodes[nid]["design"] == "approved":
                    led.nodes[nid]["design"] = "draft"
                    hist(led.nodes[nid], "reopened", f"{aid} proposed")
        return finish(led, f"created {os.path.relpath(path)} ({aid}, proposed). Write the paragraph + invariants by hand, then `sync`; after the user accepts: `adr accept {aid}`")
    if a.action == "accept":
        adr = next((x for x in led.adrs() if x["id"] == a.title), None)
        if not adr:
            return fail(f"{a.title!r}: no such ADR")
        lines = adr["lines"]
        set_header(lines, "Status", "accepted")
        led.files[adr["path"]] = "\n".join(lines) + "\n"
        freed = [nid for nid, n in led.nodes.items() if n.get("adr_pending") == adr["id"]]
        for nid in freed:
            del led.nodes[nid]["adr_pending"]
        return finish(led, f"{adr['id']} accepted; unblocked {', '.join(freed) or 'nothing'}")
    if a.action == "constrains":
        adr = next((x for x in led.adrs() if x["id"] == a.title), None)
        if not adr:
            return fail(f"{a.title!r}: no such ADR")
        ids = [w.strip() for w in (a.constrains or "").split(",") if is_node_id(w.strip())]
        if not ids:
            return fail('adr <dir> constrains ADR-NNNN --constrains D-NNN[,D-MMM]')
        missing = [x for x in ids if not led.resolves(x)]
        if missing:
            return fail(f"{', '.join(missing)}: not a node or frontier id")
        set_header(adr["lines"], "Constrains", ", ".join(ids))
        led.files[adr["path"]] = "\n".join(adr["lines"]) + "\n"
        return finish(led, f"{adr['id']} constrains {', '.join(ids)}")
    if a.action == "supersede":
        by_id = {x["id"]: x for x in led.adrs()}
        old, new = by_id.get(a.title), by_id.get(a.new_adr or "")
        if not old or not new:
            return fail("adr <dir> supersede ADR-OLD ADR-NEW (both must exist)")
        set_header(old["lines"], "Status", "superseded")
        set_header(old["lines"], "Superseded by", new["id"])
        set_header(new["lines"], "Supersedes", old["id"])
        led.files[old["path"]] = "\n".join(old["lines"]) + "\n"
        led.files[new["path"]] = "\n".join(new["lines"]) + "\n"
        return finish(led, f"{old['id']} superseded by {new['id']}")
    return fail("adr <dir> new ... | accept ADR-NNNN | supersede ADR-OLD ADR-NEW | constrains ADR-NNNN --constrains D-NNN")


def v_adopt(led: Ledger, a) -> int:
    if a.statement and not fn_of(a.statement):
        return fail("an adopted statement needs an abstract call such as result <- process(input)")
    return finish(led, existing.adopt(led, a.id, a.statement, a.parent))


def v_bind(led: Ledger, a) -> int:
    if need(led, a.id) is None:
        return 1
    return finish(led, existing.bind(led, a.id, a.path, root=a.repo, binding_id=a.binding, symbol=a.symbol, lines=a.lines))


def v_unbind(led: Ledger, a) -> int:
    if need(led, a.id) is None:
        return 1
    return finish(led, existing.unbind(led, a.id, a.binding, a.reason))


def v_observe(led: Ledger, a) -> int:
    if need(led, a.id) is None:
        return 1
    if bool(a.file) == bool(a.payload):
        return fail("observe needs either a JSON payload argument or --file")
    payload = json.loads(Path(a.file).read_text() if a.file else a.payload)
    refresh_ledger(led)
    return finish(led, existing.observe(led, a.id, payload, a.at, by=a.by, parse_body=parse_body, fn_of=fn_of))


def scan_text(report: dict) -> str:
    lines = []
    for nid, row in report['nodes'].items():
        lines.append(f"{nid} {row['state']} · conformance {row['conformance']['status']} · implementation {(row['implementation_version'] or 'unbound')[:12]} — {row['reason']}")
    lines.append(f"Inspection pending: {', '.join(report['pending']) or 'none'}; assessment pending: {', '.join(report['assessment_pending']) or 'none'}; recorded differences: {', '.join(report['differences']) or 'none'}")
    return "\n".join(lines)


def v_scan(led: Ledger, a) -> int:
    report = existing.scan(led, a.repo)
    print(json.dumps(report, indent=2) if a.json else scan_text(report))
    return 0


def v_reconcile(led: Ledger, a) -> int:
    destination = Path(a.output).expanduser().resolve() if a.output else led.dir.with_name(led.dir.name + "-rebuild-" + now().replace(":", "-"))
    if destination == led.dir or destination in led.dir.parents or led.dir in destination.parents:
        return fail("reconcile needs a separate output directory, outside the previous ledger")
    with locked(destination):
        if any(p.name != ".stepwise.lock" for p in destination.iterdir()):
            return fail("reconcile output must be empty; resume an existing rebuild with adopt/observe and sync")
        fresh = Ledger.create(destination, led.title)
        fresh.data["scope"] = led.data.get("scope", "")
        fresh.data["nongoals"] = copy.deepcopy(led.data.get("nongoals", []))
        fresh.data["reconstruction"] = {
            "previous_ledger": os.path.relpath(led.path, destination),
            "previous_sha256": hashlib.sha256(led.path.read_bytes()).hexdigest(),
            "started_at": now(),
        }
        repository = a.repo or (str((led.dir / led.data["source_root"]).resolve()) if led.data.get("source_root") else None)
        if repository:
            existing.set_repository(fresh, repository)
        fresh.operations.append("reconcile: initialize independent reconstruction")
        finish(fresh, f"Fresh reconstruction: {destination}. No nodes or approvals copied. Inspect source, then adopt/bind/observe the new hierarchy; initialization is not completion.")
        return finalize(fresh, "reconcile")


def v_sync(led: Ledger, a) -> int:
    if a.repo:
        existing.set_repository(led, a.repo)
    report = existing.refresh_sources(led)
    for nid, row in report['nodes'].items():
        existing.record_version(led.nodes[nid], row, report['commit'])
    return finish(led, scan_text(report))




def v_repair(led: Ledger, a) -> int:
    invalid_approved = {
        nid for nid, n in led.nodes.items()
        if n["design"] == "approved" and (
            changed_deps(led, n)
            or any(led.nodes.get(it.get("child") or it.get("reuse", ""), {}).get("design") in ("stale", "superseded", "retired") for it in n.get("body", []))
        )
    }
    pending = {nid for nid, n in led.nodes.items() if n["design"] in ("draft", "stale")} | invalid_approved
    pending = {nid for nid in pending if not (
        led.nodes[nid].get("origin") == "existing-code" and not led.nodes[nid].get("contract") and not led.dependents(nid))}
    if not pending:
        print("repair empty — no draft or stale nodes")
        return 0
    deps = {}
    for nid in pending:
        n = led.nodes[nid]
        called = {it.get("child") or it.get("reuse") for it in n.get("body", [])}
        deps[nid] = ({x for x in n.get("depends", []) if is_node_id(x)} | called) & pending
    order = []
    left = set(pending)
    while left:
        ready = sorted(nid for nid in left if not (deps[nid] & left))
        if not ready:
            ready = [min(left)]
        order.extend(ready)
        left.difference_update(ready)
    print("repair plan (group related changes in one batch):")
    for i, nid in enumerate(order, 1):
        n = led.nodes[nid]
        action = ("`stale` for later, or `reopen` and re-approve against changed dependencies" if nid in invalid_approved
                  else NEXT_STEP["stale-intact" if n["design"] == "stale" and intact(n) else n["design"]])
        print(f"{i}. {nid} ({led.status(nid)}) — {action}")
    constrained: dict[str, list[str]] = {}
    for adr in led.adrs():
        for nid in adr["constrains"]:
            if nid in pending:
                constrained.setdefault(nid, []).append(adr["id"])
    for nid, adrs in sorted(constrained.items()):
        print(f"ADRs blocked by {nid}: {len(adrs)} ({', '.join(adrs)})")
    return 0


def v_status(led: Ledger, a) -> int:
    for nid, n in led.nodes.items():
        state = n["design"]
        if state in ("superseded", "retired") and not a.all:
            continue
        if n.get("origin") == "existing-code" and not n.get("contract") and not led.dependents(nid):
            print(f"{nid}  observed-only ({n.get('source_state', 'unbound')})  inspect sources and record observations; no intended contract required")
        else:
            print(f"{nid}  {led.status(nid):28}  {NEXT_STEP['stale-intact' if state == 'stale' and intact(n) else state]}")
        if n.get("bindings") and n.get("source_state") != "current":
            print(f"  implementation notification: {n.get('source_state')} — `scan <dir> --json` for current versions and inspection tokens")
    for fid, (stmt, parent) in sorted(led.frontier().items()):
        print(f"{fid}  {'frontier':28}  `new <dir> {fid}` — {stmt} (child of {parent})")
    return 0


def v_html(led: Ledger, a) -> int:
    from stepwise_html import render_html

    output = Path(a.output).expanduser() if a.output else led.dir / "DESIGN.html"
    output = output.resolve()
    if output.suffix.lower() != ".html":
        return fail("HTML output must have a .html extension; ledger files and Markdown views are not export targets")
    try:
        adrs = [{"id": adr["id"], "text": "\n".join(adr["lines"])} for adr in led.adrs()]
        snapshot = copy.deepcopy(led.data)
        for nid, row in led.source_scan["nodes"].items():
            snapshot["nodes"][nid]["source_report"] = {**row, "commit": led.source_scan.get("commit")}
        for n in snapshot["nodes"].values():
            n["coverage"] = coverage(n)
        document = render_html(snapshot, title=led.title, exported_at=now(), adrs=adrs, review_key=hashlib.sha256(str(led.path).encode()).hexdigest())
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(document, encoding="utf-8")
    except OSError as exc:
        return fail(f"could not export HTML: {exc}")
    print(f"HTML snapshot: {output}")
    return 0


def v_check(led: Ledger, a) -> int:
    check(led)
    return report(led)


# ----------------------------------------------------------------------------- main


def parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="stepwise.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def add(name, *pos, **flags):
        s = sub.add_parser(name)
        s.add_argument("dir")
        for p in pos:
            s.add_argument(p[0], **p[1]) if isinstance(p, tuple) else s.add_argument(p)
        for k, kw in flags.items():
            s.add_argument("--" + k.rstrip("_").replace("_", "-"), dest=k, **kw)
        return s

    add("html", output={"default": "", "metavar": "FILE", "help": "HTML destination (default: <dir>/DESIGN.html)"})
    add("proposal", "id"); add("repair"); add("frontier"); add("sync", repo={"default": None}); add("check"); add("show", "id"); add("status", all={"action": "store_true"})
    add("new", "id", ("statement", {"nargs": "?"}))
    add("adopt", "id", ("statement", {"nargs": "?"}), parent={"default": None})
    add("bind", "id", "path", repo={"default": None}, binding={"default": None}, symbol={"default": ""}, lines={"default": None})
    add("unbind", "id", "binding", reason={"required": True})
    add("observe", "id", ("payload", {"nargs": "?"}), file={"default": ""}, at={"required": True}, by={"default": "agent inspection"})
    add("scan", repo={"default": None}, json={"action": "store_true"})
    add("reconcile", repo={"default": None}, output={"default": ""})
    add("set", "id", "field", ("value", {"nargs": "*"}))
    add("body", "id", file={"default": ""}, text={"default": None})
    add("batch", file={"default": ""})
    add("ready", "id", approach={"required": True}, validation={"required": True})
    add("answer", "id", "slug", "name")
    add("terminal", "id", "target")
    add("approve", "id", by={"default": "user"}, actor={"default": ""}, proposal_hash={"default": ""})
    add("reaffirm", "id", by={"default": ""}, actor={"default": ""})
    add("reopen", "id", "reason"); add("stale", "id", "reason"); add("retire", "id", "reason"); add("supersede", "id", "new_id", "reason")
    add("evidence", "id", kind={"required": True}, ref={"required": True}, result={"required": True, "choices": ["pass", "fail"]}, note={"default": ""}, clause={"action": "append", "default": []}, covers={"action": "append", "default": []}, resolves={"action": "append", "default": []})
    add("entry", ("kind", {"choices": list(ENTRY_FILE)}), "heading", "definition",
        source={"default": ""}, avoid={"default": ""}, not_={"default": ""}, example={"default": ""},
        given={"default": ""}, when={"default": ""}, then={"default": ""}, excludes={"default": ""}, settles={"default": ""})
    add("change", "ref", definition={"default": ""}, rename={"default": ""}, status={"default": "", "choices": ["", "confirmed", "stale"]}, reason={"required": True}, minor={"action": "store_true"})
    add("meta", "field", ("value", {"nargs": "+"}))
    add("ambiguity", "claim", ("conflict", {"nargs": "?"}), ("resolves_at", {"nargs": "?"}), drop={"action": "store_true"})
    add("adr", ("action", {"choices": ["new", "accept", "supersede", "constrains"]}), ("title", {"nargs": "?"}), ("new_adr", {"nargs": "?"}), constrains={"default": ""})
    return ap


# Commands that leave the input ledger unchanged; html/reconcile write separate outputs.
READ_ONLY = {"check", "show", "frontier", "status", "html", "scan", "proposal", "repair", "reconcile"}


def dispatch(led: Ledger, a) -> int:
    for key in ("id", "new_id", "parent"):
        if getattr(a, key, None) is not None and not is_node_id(getattr(a, key)):
            return fail(f"{getattr(a, key)!r}: expected a D-NNN node ID")
    if a.cmd not in READ_ONLY | {"batch"}:
        label = a.cmd + (" " + a.id if hasattr(a, "id") else "")
        if a.cmd == "set":
            try:
                payload = json.loads(a.field)
                label += " <json:" + ",".join(payload) + ">"
            except (ValueError, TypeError):
                label += " " + a.field if not a.field.lstrip().startswith(("{", "[")) else " <invalid-json>"
        led.operations.append(label)
    return globals()[f"v_{a.cmd}"](led, a)


def v_batch(led: Ledger, a) -> int:
    from stepwise_batch import operations
    raw = Path(a.file).read_text() if a.file else sys.stdin.read()
    try:
        commands = operations(json.loads(raw))
    except (ValueError, TypeError) as exc:
        return fail(f"invalid batch: {exc}")
    for index, args in enumerate(commands, 1):
        if not args or args[0] in READ_ONLY | {"batch"}:
            return fail(f"batch operation {index}: only ledger mutation commands are allowed")
        output = io.StringIO()
        with redirect_stdout(output), redirect_stderr(output):
            try:
                op = parser().parse_args([args[0], str(led.dir), *args[1:]])
                rc = dispatch(led, op)
            except SystemExit:
                rc = 1
        if rc:
            return fail(f"batch operation {index} failed; no changes committed: {output.getvalue().strip()}")
    return finish(led, f"batch: {len(commands)} operations")


def finalize(led: Ledger, command: str) -> int:
    derive_depends(led)
    for nid, n in led.nodes.items():
        if n["design"] == "approved" and n.get("approved_content_hash") != fingerprint(n):
            n["design"] = "stale"
            hist(n, "stale", "derived dependencies changed")
            cascade_stale(led, nid, "derived dependencies changed")
    refresh_ledger(led)
    for nid, row in led.source_scan["nodes"].items():
        if not led.nodes[nid].get("implementation_version"):
            existing.record_version(led.nodes[nid], row, led.source_scan["commit"])
    check(led, views=False)
    if led.errors:
        return report(led, "No changes committed. Resolve related changes together with `batch`.")
    files = {**led.files, **render_all(led)}
    audit = led.dir / LOG
    led.data["nodes"] = dict(sorted(led.nodes.items()))
    files[led.path] = json.dumps(led.data, indent=1, ensure_ascii=False) + "\n"
    before = hashlib.sha256(led.path.read_bytes()).hexdigest() if led.path.exists() else "-"
    after = hashlib.sha256(files[led.path].encode()).hexdigest()
    files[audit] = (audit.read_text() if audit.exists() else "") + f"{now()} exit=0 {command} operations={'; '.join(led.operations)} | result=applied applied=true before={before} after={after}\n"
    commit(led.dir, files)
    if led.source_scan["pending"] and command != "reconcile":
        print("Implementation inspection pending: " + ", ".join(led.source_scan["pending"]) + "; run scan --json")
    return report(led, led.messages[-1] if led.messages else command)


def main(argv: list[str]) -> int:
    a = parser().parse_args(argv[1:])
    d = Path(a.dir).resolve()
    if a.cmd in READ_ONLY and not (d / LEDGER).exists() and not (d / ".stepwise-transaction.json").exists():
        return fail(f"{d / LEDGER} missing")
    try:
        with locked(d):
            led = Ledger(d)
            if not led.data:
                if a.cmd in ("new", "entry", "meta", "batch", "adopt"):
                    led = Ledger.create(d, d.name.replace("-", " ").title())
                else:
                    return fail(f"{d / LEDGER} missing; start with `new` or `batch`")
            if a.cmd in READ_ONLY:
                return dispatch(led, a)
            output = io.StringIO()
            with redirect_stdout(output):
                rc = dispatch(led, a)
            if rc:
                if output.getvalue():
                    print(output.getvalue(), end="")
                return rc
            return finalize(led, a.cmd)
    except (OSError, ValueError, TypeError) as exc:
        recovery = " A prepared transaction remains; run sync to recover it before resubmitting changes." if (d / ".stepwise-transaction.json").exists() else ""
        return fail(str(exc) + recovery)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
