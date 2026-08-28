#!/usr/bin/env python3
"""Stepwise ledger tooling — the mechanical half of the skill. Agent-agnostic CLI; call it from any agent.

  stepwise.py new   <design-dir> D-NNN ["statement"]   draft stub for a frontier id (statement + parent prefilled); root needs the statement
  stepwise.py sync  <design-dir>                       after every edit: linkify, auto-tag, fill meta, regenerate DESIGN.md + CONTEXT tables,
                                                       then lint. Exit 1 with `error file:line: msg` lines when something must be fixed.
  stepwise.py check <design-dir>                       lint only, no writes (CI / read-only review)

Agent writes (reasoning and content only):
  nodes/D-NNN-<slug>.md                header + Statement / Effect / Contract / Refinement / Composition / Decisions / Deferred / Realization / Evidence
  context/{terms,facts,scenarios}.md   one `##` section per entry: heading + definition (+ Source / Avoid / Not / Given-When-Then)
  CONTEXT.md                           Scope, Open ambiguities, Explicit non-goals
  ../adr/NNNN-<slug>.md                decisions

sync derives (never hand-edit):
  DESIGN.md                            Nodes table, frontier, ADR list, Program (approved bodies substituted, tags from status)
  CONTEXT.md tables                    Vocabulary / Facts and constraints / Scenarios
  `Used by:` lines                     from node `Depends on:` and scenario `Settles:`
  links                                write bare names (`Run Key`, `CTX-F05`, `D-060`, `ADR-0002`) in Parents / Depends on /
                                       Not / Settles / Constrains; sync turns them into links
  `-- D-NNN` tags                      an untagged body line calling `f(...)` gets tagged when exactly one node's signature is `f(`
  `Confirmed:` / `Status:`             filled with today / confirmed when an entry has no meta line

Stdlib only.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

CODE_COL = 58
ID_RE = re.compile(r"\bD-\d{3}\b")
CTX_RE = re.compile(r"\bCTX-[FS]\d+\b")
ADR_RE = re.compile(r"\bADR-\d{4}\b")
TAG_RE = re.compile(r"^(?P<code>.*?)\s*--\s*(?P<tag>.*)$")
CHILD_TAG_RE = re.compile(r"^(?P<reuse>↗\s*)?(?P<id>D-\d{3})\b")
UNKNOWN_RE = re.compile(r"\?[a-z][a-z0-9-]*")
CALL_RE = re.compile(r"(?:^|<-|←|->|→|\s|\()([a-z_][a-z0-9_]*)\s*\(")
DESIGN_STATUS_RE = re.compile(r"^(draft( \((\d+ \?|ADR pending)\))?|approved|stale(\b.*)?|superseded by D-\d{3}\b.*)$")
REALIZATION_VOCAB = {"not-started", "partial", "implemented"}
VERIFICATION_VOCAB = {"unverified", "partial", "verified", "stale"}
LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
SIDECAR = ".stepwise.json"
CONTEXT_FILES = ("terms.md", "facts.md", "scenarios.md")
META_KEYS = ("Confirmed", "Status", "Source", "Avoid", "Not", "Used by", "Example", "Changed", "Settles", "Excludes")
META_PREFIX = tuple(k + ":" for k in META_KEYS) + ("Given ", "When ", "Then ")
CONTROL_RE = re.compile(r"^(if|else|elif|loop|while|for|until)\b.*:$")


def uniq(xs):
    return list(dict.fromkeys(xs))


def anchor_of(heading: str) -> str:
    s = re.sub(r"[^\w\s-]", "", heading.strip().lower())
    return re.sub(r"\s+", "-", s).strip("-")


def today() -> str:
    return _dt.date.today().isoformat()


# ----------------------------------------------------------------------------- model


@dataclass
class Entry:
    file: str
    heading: str
    anchor: str
    line: int
    body: str
    used_by: set[str]
    changed: str
    nonempty: int

    @property
    def id(self) -> str | None:
        m = CTX_RE.match(self.heading)
        return m.group(0) if m else None

    @property
    def key(self) -> str:
        return f"{self.file}#{self.anchor}"

    def meta(self, name: str) -> str:
        m = re.search(rf"(?:^|[·|]\s*){name}:\s*(.*?)(?=\s+[·|]\s+[A-Z][a-z ]*:|$)", self.body, re.M)
        return m.group(1).strip() if m else ""

    def definition(self) -> str:
        for ln in self.body.splitlines():
            s = ln.strip()
            if s and not s.startswith(META_PREFIX) and not s.startswith("#"):
                return s
        return ""


@dataclass
class Node:
    id: str
    path: Path
    header: dict[str, str]
    sections: dict[str, str]
    lines: list[str]
    heading_id: str | None
    parents: list[str]
    depends_raw: str
    design: str
    realization: str
    verification: str
    approved: str
    statement: str
    signature: str
    body: list[str]              # logical statements (continuation lines joined)
    fence_span: tuple[int, int]  # line indexes of the pseudo fence content in `lines` (start, end exclusive)
    target: str
    depends: list[str] = field(default_factory=list)

    @property
    def is_draft(self): return self.design.startswith("draft")
    @property
    def is_approved(self): return self.design == "approved"
    @property
    def is_stale(self): return self.design.startswith("stale") or self.design.startswith("superseded")
    @property
    def is_terminal(self): return bool(self.target) and not self.body
    @property
    def fn(self) -> str:
        m = re.match(r"([a-z_][a-z0-9_]*)\s*\(", self.signature or self.statement.split("<-")[-1].split("←")[-1].strip())
        return m.group(1) if m else ""

    @property
    def is_collapsed(self) -> bool:
        stmts = [ln for ln in self.body if _is_statement_line(ln)]
        return bool(stmts) and all(("⇒" in ln or "✓" in ln) for ln in stmts)

    def child_refs(self) -> list[tuple[str, bool, str]]:
        out = []
        for ln in self.body:
            m = TAG_RE.match(ln)
            if not m:
                continue
            cm = CHILD_TAG_RE.match(m.group("tag").strip())
            if cm:
                out.append((cm.group("id"), bool(cm.group("reuse")), ln))
        return out

    def references(self, cid: str) -> bool:
        return any(c == cid for c, _, _ in self.child_refs())

    def body_hash(self) -> str:
        return hashlib.sha1("\n".join(ln.rstrip() for ln in self.body).encode()).hexdigest()[:12]


@dataclass
class Adr:
    id: str
    title: str
    status: str
    constrains: str
    path: Path
    lines: list[str]


@dataclass
class Ledger:
    root: Path
    nodes: dict[str, Node]
    entries: dict[str, Entry]
    adrs: list[Adr]
    frontier: dict[str, tuple[str, str]] = field(default_factory=dict)  # id -> (statement, parent)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def entry_by_ref(self, ref: str) -> Entry | None:
        r = ref.strip()
        if CTX_RE.fullmatch(r):
            return next((e for e in self.entries.values() if e.id == r), None)
        return next((e for e in self.entries.values() if e.file == "terms.md" and e.heading.lower() == r.lower()), None)

    def adr_by_ref(self, ref: str) -> Adr | None:
        return next((a for a in self.adrs if a.id == ref), None)

    def canonical(self, ref: str) -> str:
        r = ref.strip().strip("`")
        for rx in (ID_RE, CTX_RE, ADR_RE):
            m = rx.search(r)
            if m:
                return m.group(0)
        e = self.entry_by_ref(r)
        return e.heading if e else r

    def resolves(self, ref: str) -> bool:
        return bool((ID_RE.fullmatch(ref) and ref in self.nodes) or (ADR_RE.fullmatch(ref) and self.adr_by_ref(ref)) or self.entry_by_ref(ref))

    def link(self, ref: str, from_file: Path) -> str:
        """Markdown link for a canonical ref relative to `from_file`; bare ref when unresolvable."""
        from_dir = from_file.parent
        if ID_RE.fullmatch(ref):
            n = self.nodes.get(ref)
            return f"[{ref}]({os.path.relpath(n.path, from_dir)})" if n else ref
        if ADR_RE.fullmatch(ref):
            a = self.adr_by_ref(ref)
            return f"[{ref}]({os.path.relpath(a.path, from_dir)})" if a else ref
        e = self.entry_by_ref(ref)
        if not e:
            return ref
        target = self.root / "context" / e.file
        href = f"#{e.anchor}" if target == from_file else f"{os.path.relpath(target, from_dir)}#{e.anchor}"
        return f"[{e.id or e.heading}]({href})"

    def terms_longest_first(self) -> list[Entry]:
        return sorted((e for e in self.entries.values() if e.file == "terms.md"), key=lambda e: -len(e.heading))

    def linkify_terms_in(self, text: str, from_file: Path) -> str:
        """Link every plain occurrence of a term heading in free text (existing links normalized first)."""
        plain = LINK_RE.sub(lambda m: m.group(1), text)
        out, i = [], 0
        terms = self.terms_longest_first()
        while i < len(plain):
            for e in terms:
                h = e.heading
                if plain.startswith(h, i) and (i == 0 or not plain[i - 1].isalnum()) and (i + len(h) == len(plain) or not plain[i + len(h)].isalnum()):
                    out.append(self.link(h, from_file))
                    i += len(h)
                    break
            else:
                out.append(plain[i])
                i += 1
        return "".join(out)

    def terms_in(self, text: str) -> list[str]:
        plain = LINK_RE.sub(lambda m: m.group(1), text)
        return [e.heading for e in self.terms_longest_first() if re.search(rf"(?<!\w){re.escape(e.heading)}(?!\w)", plain)]


def _is_statement_line(ln: str) -> bool:
    s = ln.strip()
    return bool(s) and not s.startswith("{") and not s.startswith("--") and not CONTROL_RE.match(s)


def split_refs(raw: str) -> list[str]:
    raw = LINK_RE.sub(lambda m: m.group(1), raw)
    return [t.strip().strip("`") for t in raw.split(",") if t.strip() and t.strip() not in ("-", "—")]


def _split_header(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        for part in re.split(r"\s+[·|]\s+", line.strip()):
            if ":" in part:
                k, v = part.split(":", 1)
                if re.fullmatch(r"[A-Z][A-Za-z]*( [a-z]+)?", k.strip()):
                    out[k.strip()] = v.strip()
    return out


def _sections(text: str) -> tuple[str, dict[str, str]]:
    parts = re.split(r"^## (.+)$", text, flags=re.M)
    return parts[0], {parts[i].strip(): parts[i + 1] for i in range(1, len(parts), 2)}


def _fence_span(lines: list[str], section: str) -> tuple[int, int]:
    """(start, end) indexes of pseudo fence content inside `## <section>`; (-1, -1) if absent."""
    in_sec = False
    start = -1
    for i, ln in enumerate(lines):
        if ln.startswith("## "):
            in_sec = ln[3:].strip() == section
            continue
        if in_sec and ln.startswith("```") and start < 0:
            start = i + 1
        elif in_sec and ln.startswith("```") and start >= 0:
            return start, i
    return -1, -1


def join_continuations(raw: list[str]) -> list[str]:
    """Merge lines while parentheses stay open: `f(\\n a, b\\n)  -- D-1` -> `f(a, b)  -- D-1`."""
    out: list[str] = []
    buf, depth = "", 0
    for ln in raw:
        if depth > 0:
            buf = buf.rstrip() + (" " if not ln.strip().startswith(")") else "") + ln.strip()
        else:
            buf = ln
        depth += ln.count("(") - ln.count(")")
        if depth <= 0:
            out.append(buf)
            buf, depth = "", 0
    if buf:
        out.append(buf)
    return out


def parse_node(path: Path) -> Node:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    m = re.match(r"(D-\d{3})-(.+)\.md$", path.name)
    nid = m.group(1) if m else path.stem
    head, secs = _sections(text)
    header = _split_header(head)
    hm = re.search(r"^# (D-\d{3})\b", head, re.M)
    stmt_sec = secs.get("Statement", "")
    sm = re.search(r"`([^`]+)`", stmt_sec)
    statement = sm.group(1).strip() if sm else (stmt_sec.strip().splitlines()[0] if stmt_sec.strip() else "")
    span = _fence_span(lines, "Refinement")
    fence = lines[span[0]:span[1]] if span[0] >= 0 else []
    body = join_continuations(fence[1:]) if fence else []
    tm = re.search(r"Target:\s*`?([^`\n]+?)`?\s*$", secs.get("Realization", ""), re.M)
    return Node(
        id=nid, path=path, header=header, sections=secs, lines=lines,
        heading_id=hm.group(1) if hm else None, parents=uniq(ID_RE.findall(header.get("Parents", ""))),
        depends_raw=header.get("Depends on", ""),
        design=header.get("Design", "").strip(), realization=header.get("Realization", "").strip(),
        verification=header.get("Verification", "").strip(), approved=header.get("Approved", "").strip(),
        statement=statement, signature=fence[0].strip() if fence else "", body=body, fence_span=span,
        target=tm.group(1).strip() if tm else "",
    )


def find_adr_dir(design_dir: Path) -> Path | None:
    return next((p / "adr" for p in [design_dir, *design_dir.parents][:5] if (p / "adr").is_dir()), None)


def parse_adrs(design_dir: Path) -> list[Adr]:
    adr_dir = find_adr_dir(design_dir)
    out: list[Adr] = []
    for p in sorted(adr_dir.glob("*.md")) if adr_dir else []:
        text = p.read_text(encoding="utf-8")
        tm = re.search(r"^# (ADR-\d{4})\s*[-—–]\s*(.+)$", text, re.M)
        header = _split_header(_sections(text)[0])
        out.append(Adr(tm.group(1) if tm else p.stem, tm.group(2).strip() if tm else p.stem,
                       header.get("Status", "?"), header.get("Constrains", ""), p, text.splitlines()))
    return out


def parse_context(design_dir: Path) -> dict[str, Entry]:
    out: dict[str, Entry] = {}
    for fname in CONTEXT_FILES:
        p = design_dir / "context" / fname
        if not p.exists():
            continue
        parts = re.split(r"^## (.+)$", p.read_text(encoding="utf-8"), flags=re.M)
        line = parts[0].count("\n") + 1
        for i in range(1, len(parts), 2):
            heading, body = parts[i].strip(), parts[i + 1]
            um = re.search(r"^Used by:(.*)$", body, re.M)
            cm = re.search(r"^Changed:.*$", body, re.M)
            e = Entry(fname, heading, anchor_of(heading), line, body,
                      set(ID_RE.findall(um.group(1))) if um else set(),
                      max(DATE_RE.findall(cm.group(0)), default="") if cm else "",
                      len([ln for ln in body.splitlines() if ln.strip()]))
            out[e.key] = e
            line += body.count("\n") + 1
    return out


def load(design_dir: Path) -> Ledger:
    nodes_dir = design_dir / "nodes"
    nodes: dict[str, Node] = {}
    for p in sorted(nodes_dir.glob("D-*.md")) if nodes_dir.is_dir() else []:
        n = parse_node(p)
        nodes[n.id] = n
    led = Ledger(design_dir, nodes, parse_context(design_dir), parse_adrs(design_dir))
    for n in nodes.values():
        n.depends = uniq(led.canonical(t) for t in split_refs(n.depends_raw))
        if n.is_draft:
            continue
        for cid, _reuse, ln in n.child_refs():
            if cid not in nodes and cid not in led.frontier:
                led.frontier[cid] = (_frontier_statement(ln), n.id)
    return led


def _code_of(ln: str) -> str:
    m = TAG_RE.match(ln)
    return (m.group("code") if m else ln).strip()


def _frontier_statement(ln: str) -> str:
    code = _code_of(ln)
    m = re.match(r"^(\w+)\s*(?:<-|←)\s*(.+)$", code)
    return f"{m.group(2).strip()} -> {m.group(1)}" if m else re.sub(r"^(?:->|→)\s*", "", code)


# ----------------------------------------------------------------------------- linkify + autofill (rewrites sources)


def _rewrite_header_line(lines: list[str], key: str, value: str) -> bool:
    for i, ln in enumerate(lines):
        if ln.startswith("## "):
            break
        parts = re.split(r"(\s+[·|]\s+)", ln)
        for j in range(0, len(parts), 2):
            if parts[j].startswith(key + ":"):
                new = f"{key}: {value}"
                if parts[j] == new:
                    return False
                parts[j] = new
                lines[i] = "".join(parts)
                return True
    return False


def autotag_body(led: Ledger, n: Node, lines: list[str]) -> bool:
    """Tag untagged statement lines whose call name matches exactly one node signature."""
    s, e = n.fence_span
    if s < 0:
        return False
    by_fn: dict[str, list[str]] = {}
    for o in led.nodes.values():
        if o.fn and o.id != n.id:
            by_fn.setdefault(o.fn, []).append(o.id)
    changed = False
    depth = 0
    for i in range(s + 1, e):
        ln = lines[i]
        opened = depth > 0
        depth += ln.count("(") - ln.count(")")
        if opened or depth > 0 or "--" in ln or not _is_statement_line(ln):
            continue
        cm = CALL_RE.search(" " + ln.strip())
        if not cm:
            continue
        ids = by_fn.get(cm.group(1), [])
        if len(ids) == 1:
            lines[i] = _fmt(ln.rstrip(), ids[0], 0) if len(ln.rstrip()) < CODE_COL else f"{ln.rstrip()}  -- {ids[0]}"
            changed = True
    return changed


def linkify_nodes(led: Ledger) -> list[Path]:
    changed = []
    for n in led.nodes.values():
        lines = list(n.lines)
        c1 = _rewrite_header_line(lines, "Parents", ", ".join(led.link(p, n.path) for p in n.parents) or "-")
        c2 = _rewrite_header_line(lines, "Depends on", ", ".join(led.link(r, n.path) for r in n.depends) or "-")
        c3 = autotag_body(led, n, lines)
        if c1 or c2 or c3:
            n.path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            changed.append(n.path)
    return changed


def reverse_index(led: Ledger) -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {k: [] for k in led.entries}
    for n in led.nodes.values():
        for r in n.depends:
            e = led.entry_by_ref(r)
            if e:
                idx[e.key].append(n.id)
    for e in led.entries.values():
        if e.file == "scenarios.md" and e.id:
            for t in led.terms_in(e.meta("Settles")):
                te = led.entry_by_ref(t)
                if te:
                    idx[te.key].append(e.id)
    return {k: sorted(uniq(v)) for k, v in idx.items()}


def linkify_context(led: Ledger) -> list[Path]:
    idx = reverse_index(led)
    changed = []
    for fname in CONTEXT_FILES:
        p = led.root / "context" / fname
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        parts = re.split(r"(^## .+$)", text, flags=re.M)
        for i in range(1, len(parts), 2):
            e = led.entries.get(f"{fname}#{anchor_of(parts[i][3:])}")
            if not e:
                continue
            body = parts[i + 1]
            blines = body.split("\n")
            # meta autofill: first non-empty line must carry Confirmed: (and Status: for facts)
            first = next((k for k, ln in enumerate(blines) if ln.strip()), None)
            if first is not None and not blines[first].startswith("#"):
                if not re.search(r"\bConfirmed:", blines[first]) and not blines[first].startswith(META_PREFIX[1:]):
                    meta = f"Confirmed: {today()}"
                    if fname == "facts.md":
                        meta = "Status: confirmed · " + meta
                    blines.insert(first, meta)
                    blines.insert(first + 1, "")
                elif fname == "facts.md" and not re.search(r"\bStatus:", blines[first]):
                    blines[first] = "Status: confirmed · " + blines[first]
            body = "\n".join(blines)
            users = idx.get(e.key, [])
            used_line = "Used by: " + (", ".join(led.link(u, p) for u in users) or "-")
            if re.search(r"^Used by:.*$", body, re.M):
                body = re.sub(r"^Used by:.*$", used_line.replace("\\", "\\\\"), body, count=1, flags=re.M)
            elif users:
                body = body.rstrip("\n") + "\n" + used_line + "\n\n"
            body = re.sub(r"^(Not:\s*)(.+)$", lambda m: m.group(1) + led.linkify_terms_in(m.group(2), p), body, flags=re.M)
            body = re.sub(r"(Settles:\s*)([^·|\n]+)", lambda m: m.group(1) + led.linkify_terms_in(m.group(2).rstrip(), p) + (" " if m.group(2).endswith(" ") else ""), body)
            parts[i + 1] = body
        new = "".join(parts)
        if new != text:
            p.write_text(new, encoding="utf-8")
            changed.append(p)
    return changed


def linkify_adrs(led: Ledger) -> list[Path]:
    changed = []
    for a in led.adrs:
        if not a.constrains:
            continue
        lines = list(a.lines)
        plain = LINK_RE.sub(lambda m: m.group(1), a.constrains)
        new = ID_RE.sub(lambda m: led.link(m.group(0), a.path), plain)
        if _rewrite_header_line(lines, "Constrains", new):
            a.path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            changed.append(a.path)
    return changed


# ----------------------------------------------------------------------------- CONTEXT.md tables


def _first_sentence(s: str) -> str:
    s = LINK_RE.sub(lambda m: m.group(1), s).strip()
    m = re.match(r"(.+?\.)(\s|$)", s)
    return (m.group(1) if m else s).rstrip(".")


def context_tables(led: Ledger) -> dict[str, list[str]]:
    idx = reverse_index(led)
    terms, facts, scen = [], [], []
    for e in sorted(led.entries.values(), key=lambda e: (e.file, e.id or e.heading.lower())):
        entry = f"[{e.file}#{e.anchor}](context/{e.file}#{e.anchor})"
        name = e.heading[len(e.id) + 1:] if e.id else e.heading
        if e.file == "terms.md":
            terms.append(f"| {e.heading} | {_first_sentence(e.definition())} | {e.meta('Avoid') or '-'} | {entry} |")
        elif e.file == "facts.md":
            facts.append(f"| {e.id or '-'} | {_first_sentence(e.definition())} | {e.meta('Status') or '-'} | {', '.join(idx.get(e.key, [])) or '-'} | {entry} |")
        else:
            scen.append(f"| {e.id or '-'} | {name} | {LINK_RE.sub(lambda m: m.group(1), e.meta('Settles')) or '-'} | {entry} |")
    return {
        "Vocabulary": ["| Term | Is | Avoid | Entry |", "| --- | --- | --- | --- |", *terms],
        "Facts and constraints": ["| ID | Fact (one line) | Status | Used by | Entry |", "| --- | --- | --- | --- | --- |", *facts],
        "Scenarios": ["| ID | Scenario | Settles | Entry |", "| --- | --- | --- | --- |", *scen],
    }


def render_context_index(led: Ledger) -> bool:
    p = led.root / "CONTEXT.md"
    if not p.exists():
        return False
    text = p.read_text(encoding="utf-8")
    tables = context_tables(led)
    parts = re.split(r"(^## .+$)", text, flags=re.M)
    present = {parts[i][3:].strip() for i in range(1, len(parts), 2)}
    for i in range(1, len(parts), 2):
        name = parts[i][3:].strip()
        if name in tables:
            parts[i + 1] = "\n\n" + "\n".join(tables[name]) + "\n\n"
    out = "".join(parts)
    for name in tables:
        if name not in present:
            out = out.rstrip("\n") + f"\n\n## {name}\n\n" + "\n".join(tables[name]) + "\n"
    out = re.sub(r"\n{3,}", "\n\n", out)
    if out != text:
        p.write_text(out, encoding="utf-8")
        return True
    return False


# ----------------------------------------------------------------------------- DESIGN.md


def _tag_for(led: Ledger, cid: str, reuse: bool) -> str:
    n = led.nodes.get(cid)
    if reuse or (n and len(n.parents) >= 2):
        return f"↗ {cid}"
    if not n:
        return f"{cid} (frontier)"
    if n.is_draft:
        m = re.match(r"draft \((.+)\)", n.design)
        return f"{cid} (draft, {m.group(1)})" if m else f"{cid} (draft)"
    if n.design.startswith("superseded"):
        return f"{cid} ({n.design})"
    if n.is_stale:
        return f"{cid} (stale)"
    if n.is_terminal:
        return f"{cid} {'✓' if n.verification == 'verified' else '⇒'} {n.target}"
    return cid


def _fmt(code: str, tag: str, indent: int) -> str:
    left = " " * indent + code
    return f"{left}{' ' * max(CODE_COL - len(left), 1)}-- {tag}"


def _inline_parent(led: Ledger, n: Node) -> Node | None:
    """The single parent whose body substitutes `n` inline; None when `n` is a procedure root."""
    if len(n.parents) != 1:
        return None
    p = led.nodes.get(n.parents[0])
    return p if p and p.references(n.id) else None


def _emit(led: Ledger, node: Node, indent: int, out: list[str], emitted: set[str]) -> None:
    emitted.add(node.id)
    base = min((len(ln) - len(ln.lstrip()) for ln in node.body if ln.strip()), default=0)
    for ln in node.body:
        if not ln.strip():
            continue
        here = indent + (len(ln) - len(ln.lstrip()) - base)
        m = TAG_RE.match(ln)
        tag = m.group("tag").strip() if m else ""
        cm = CHILD_TAG_RE.match(tag) if m else None
        if cm:
            cid, reuse = cm.group("id"), bool(cm.group("reuse"))
            out.append(_fmt(_code_of(ln), _tag_for(led, cid, reuse), here))
            child = led.nodes.get(cid)
            if child and child.is_approved and child.body and not reuse and _inline_parent(led, child) is node and cid not in emitted:
                _emit(led, child, here + 2, out, emitted)
        elif m and ("⇒" in tag or "✓" in tag):
            out.append(_fmt(_code_of(ln), tag, here))
        else:
            out.append(" " * here + ln.strip())


def render_program(led: Ledger) -> tuple[list[str], list[str]]:
    main: list[str] = []
    emitted: set[str] = set()
    for root in [n for n in led.nodes.values() if not n.parents]:
        sig = root.signature.rstrip(":") + ":" if root.signature else root.statement
        main.append(_fmt(sig, _tag_for(led, root.id, False), 0))
        if root.body and not root.is_draft:
            _emit(led, root, 2, main, emitted)
    procs: list[str] = []
    for n in sorted(led.nodes.values(), key=lambda x: x.id):
        if n.id in emitted or not n.body or n.is_draft or n.parents == [] or _inline_parent(led, n):
            continue
        sig = n.signature.rstrip(":") + ":" if n.signature else n.statement
        if procs:
            procs.append("")
        status = _tag_for(led, n.id, False).replace(n.id, "").strip()
        procs.append(_fmt(sig, f"{n.id}{' ' + status if status and not status.startswith('↗') else ''} (used by {', '.join(n.parents)})", 0))
        _emit(led, n, 2, procs, emitted)
    return main, procs


def render_design(led: Ledger) -> str:
    d = led.root
    title = f"# {d.name} — Design"
    existing = d / "DESIGN.md"
    if existing.exists():
        first = existing.read_text(encoding="utf-8").splitlines()[:1]
        if first and first[0].startswith("# "):
            title = first[0]
    roots = [n.id for n in led.nodes.values() if not n.parents]
    frontier = sorted(set(led.frontier) | {n.id for n in led.nodes.values() if n.is_draft})
    lines = [title, "", "Kind: index · Context: [./CONTEXT.md](./CONTEXT.md)",
             f"Root: {', '.join(roots) or '-'} · Active frontier: {', '.join(frontier) or '-'}", "",
             "_Generated by `stepwise.py sync` from nodes/, context/ and ADRs. Edit those; never this file._", "",
             "## Applicable ADRs", ""]
    lines += [f"- [{a.id} {a.title}]({os.path.relpath(a.path, d)}) — {a.status} — constrains {LINK_RE.sub(lambda m: m.group(1), a.constrains) or '-'}" for a in led.adrs] or ["- none"]
    lines += ["", "## Nodes", "", "| ID | Statement | Parents | Design | Realization | Verification | File |",
              "| --- | --- | --- | --- | --- | --- | --- |"]
    rows = [(n.id, n.statement.replace("|", "\\|"), ", ".join(n.parents) or "-", n.design, n.realization, n.verification,
             f"[{os.path.relpath(n.path, d)}]({os.path.relpath(n.path, d)})") for n in led.nodes.values()]
    rows += [(fid, stmt.replace("|", "\\|"), parent, "frontier", "not-started", "unverified", "-") for fid, (stmt, parent) in led.frontier.items()]
    lines += ["| " + " | ".join(r) + " |" for r in sorted(rows, key=lambda r: r[0])]
    main, procs = render_program(led)
    lines += ["", "## Program", "", "```pseudo", *main, "```"]
    if procs:
        lines += ["", "### Procedures", "", "```pseudo", *procs, "```"]
    return "\n".join(lines) + "\n"


def _sidecar(d: Path) -> dict:
    p = d / SIDECAR
    try:
        return json.loads(p.read_text()) if p.exists() else {}
    except json.JSONDecodeError:
        return {}


def body_violations(led: Ledger) -> dict[str, str]:
    side = _sidecar(led.root)
    return {n.id: side[n.id]["hash"] for n in led.nodes.values()
            if n.is_approved and n.body and n.id in side
            and side[n.id].get("hash") != n.body_hash() and side[n.id].get("approved") == n.approved}


def do_render(design_dir: Path) -> list[str]:
    led = load(design_dir)
    touched = linkify_nodes(led) + linkify_adrs(led) + linkify_context(led)
    led = load(design_dir)
    if render_context_index(led):
        touched.append(design_dir / "CONTEXT.md")
    (design_dir / "DESIGN.md").write_text(render_design(led), encoding="utf-8")
    side = _sidecar(design_dir)
    bad = body_violations(led)
    for n in led.nodes.values():
        if n.is_approved and n.body and n.id not in bad:
            side[n.id] = {"hash": n.body_hash(), "approved": n.approved}
    (design_dir / SIDECAR).write_text(json.dumps(side, indent=1, sort_keys=True) + "\n")
    return [os.path.relpath(p, design_dir.parent) for p in touched]


# ----------------------------------------------------------------------------- new


STUB = """# {id} — {fn}

Kind: node · Index: [../DESIGN.md](../DESIGN.md)
Design: draft · Realization: not-started · Verification: unverified
Parents: {parent}
Depends on: -
Approved: -

## Statement

`{statement}` — <one line: what this statement achieves>

## Effect

<1–2 sentences: net observable behavior>

## Contract

- Pre: <one line>
- Post: <one line>
- Failure: <one line>
- Invariant: <one line>
"""


def do_new(design_dir: Path, nid: str, statement: str | None) -> int:
    led = load(design_dir)
    if nid in led.nodes:
        print(f"error {nid} already exists: {led.nodes[nid].path}", file=sys.stderr)
        return 1
    if nid in led.frontier:
        stmt, parent = led.frontier[nid]
        code = next(_code_of(ln) for n in led.nodes.values() for c, _r, ln in n.child_refs() if c == nid)
    elif statement:
        code, parent = statement, "-"
    else:
        print(f"error {nid} is not on the frontier; pass the statement for a root: new <dir> {nid} \"outcome <- f(x)\"", file=sys.stderr)
        return 1
    m = re.search(r"([a-z_][a-z0-9_]*)\s*\(", code)
    fn = m.group(1) if m else nid.lower()
    path = design_dir / "nodes" / f"{nid}-{fn.replace('_', '-')}.md"
    path.write_text(STUB.format(id=nid, fn=fn, parent=parent, statement=code), encoding="utf-8")
    do_render(design_dir)
    print(f"created {_show(path)} (draft). Fill Statement gloss, Effect, Contract; mark unknowns ?slug; then sync.")
    return 0


# ----------------------------------------------------------------------------- check


def _line_of(lines: list[str], pattern: str) -> int:
    return next((i for i, ln in enumerate(lines, 1) if re.search(pattern, ln)), 1)


def check(led: Ledger) -> None:
    d = led.root

    def rel(p: Path) -> str: return os.path.relpath(p, d.parent)
    def E(path: Path, line: int, msg: str): led.errors.append(f"{rel(path)}:{line}: {msg}")
    def W(path: Path, line: int, msg: str): led.warnings.append(f"{rel(path)}:{line}: {msg}")

    nodes = led.nodes
    roots = [n for n in nodes.values() if not n.parents]
    if nodes and len(roots) != 1:
        E(d / "DESIGN.md", 1, f"expected exactly one root node (empty Parents); found {[r.id for r in roots]}")

    for n in nodes.values():
        L = n.lines
        hl = _line_of(L, r"^Design:")
        if n.heading_id != n.id:
            E(n.path, 1, f"heading id {n.heading_id!r} != filename id {n.id}")
        if not DESIGN_STATUS_RE.match(n.design):
            E(n.path, hl, f"Design {n.design!r} not in: draft | draft (k ?) | draft (ADR pending) | approved | stale | superseded by D-NNN — re-approval = keep 'approved', bump Approved:")
        if n.realization not in REALIZATION_VOCAB:
            E(n.path, hl, f"Realization {n.realization!r} not in {sorted(REALIZATION_VOCAB)}")
        if n.verification not in VERIFICATION_VOCAB:
            E(n.path, hl, f"Verification {n.verification!r} not in {sorted(VERIFICATION_VOCAB)}")
        if n.is_approved and not DATE_RE.search(n.approved):
            E(n.path, _line_of(L, r"^Approved:"), "approved node needs 'Approved: YYYY-MM-DD by <who>'")
        if len(L) > 120:
            E(n.path, len(L), f"node file {len(L)} lines > 120")
        if re.search(r"<one line|<1–2 sentences", "\n".join(L)):
            E(n.path, _line_of(L, r"<one line|<1–2"), "stub placeholders still present")
        unknowns = sorted(set(UNKNOWN_RE.findall("\n".join(L))))
        km = re.match(r"draft \((\d+) \?\)", n.design)
        if unknowns and not n.is_draft:
            E(n.path, _line_of(L, r"\?[a-z]"), f"`?` marks in non-draft node: {unknowns}")
        elif km and int(km.group(1)) != len(unknowns):
            E(n.path, hl, f"header says {km.group(1)} ? but text has {len(unknowns)}: {unknowns}")
        elif n.is_draft and not km and unknowns and n.design != "draft (ADR pending)":
            E(n.path, hl, f"draft has {len(unknowns)} ? marks; header must read 'draft ({len(unknowns)} ?)'")
        stmts = [ln for ln in n.body if ln.strip()]
        if len(stmts) > 12:
            E(n.path, _line_of(L, r"^## Refinement"), f"Refinement body {len(stmts)} statements > 12")
        for ln in n.body:
            if _is_statement_line(ln) and not TAG_RE.match(ln) and CALL_RE.search(" " + ln.strip()):
                E(n.path, _line_of(L, re.escape(ln.strip()[:30])), f"untagged call {ln.strip()!r}: add `-- D-NNN` (new id) or `-- ⇒ <target>: <identifier>`")
        if n.is_approved and not n.body and not n.target:
            E(n.path, _line_of(L, r"^## Refinement|^## Realization"), "approved node needs a Refinement body (composite) or a Target (terminal)")
        if n.is_approved and n.body and "Composition argument" not in n.sections:
            E(n.path, _line_of(L, r"^## Refinement"), "approved composite lacks '## Composition argument'")
        if n.target:
            tl = _line_of(L, r"Target:")
            if not re.match(r"^[a-z][a-z0-9_-]*: \S", n.target):
                E(n.path, tl, f"Target {n.target!r} must read '<target>: <identifier>' (e.g. 'dbos: DBOS.startWorkflow', 'postgres: SELECT ... ORDER BY seq')")
            if re.match(r"^(service|module|application[- ]?service|app|own|internal|our|runtime)\b", n.target, re.I):
                E(n.path, tl, f"Target {n.target!r} names design-owned code; a target must exist outside the design (platform, language, repo fn on disk)")
            if n.body and not n.is_collapsed:
                E(n.path, tl, "node has Target and child statements; terminal has no body, collapsed leaf tags every statement '-- ⇒ <target>: <identifier>'")
        for cid, reuse, _ln in n.child_refs():
            child = nodes.get(cid)
            if child and not n.is_draft and n.id not in child.parents:
                E(child.path, _line_of(child.lines, r"^Parents:"), f"{n.id} body calls {cid} but {cid} Parents = {child.parents}")
            if reuse and child and not child.is_approved:
                E(n.path, _line_of(L, re.escape(cid)), f"reuse ↗ {cid} but {cid} is {child.design!r}; only approved nodes are reusable")
        for pid in n.parents:
            parent = nodes.get(pid)
            if not parent:
                E(n.path, _line_of(L, r"^Parents:"), f"parent {pid} has no node file")
            elif not parent.references(n.id) and n.id not in "\n".join(parent.lines):
                E(n.path, _line_of(L, r"^Parents:"), f"Parents lists {pid} but {pid} never references {n.id}")
        for rec in re.split(r"^### ", n.sections.get("Evidence", ""), flags=re.M)[1:]:
            cnt = len([x for x in rec.splitlines() if x.strip()])
            if cnt > 4:
                E(n.path, _line_of(L, r"^### EV-"), f"evidence record {rec.splitlines()[0].strip()!r} has {cnt} lines > 4")
        appr = DATE_RE.findall(n.approved)
        for r in n.depends:
            if ID_RE.fullmatch(r) or ADR_RE.fullmatch(r):
                if not led.resolves(r) and r not in led.frontier:
                    E(n.path, _line_of(L, r"^Depends on:"), f"Depends on {r} but it does not exist")
                continue
            e = led.entry_by_ref(r)
            if not e:
                E(n.path, _line_of(L, r"^Depends on:"), f"Depends on {r!r}: no term / fact / scenario with that heading or id in context/")
            elif e.changed and appr and e.changed > appr[0] and not n.is_stale:
                E(n.path, hl, f"{e.key} changed {e.changed} after approval {appr[0]}; node must be stale or re-approved")

    for e in led.entries.values():
        if e.nonempty > 10:
            E(d / "context" / e.file, e.line, f"section {e.heading!r} has {e.nonempty} non-empty lines > 10")
        if not e.definition() and not re.search(r"^(Given|When|Then) ", e.body, re.M):
            E(d / "context" / e.file, e.line, f"section {e.heading!r} has no definition sentence")
        if e.file != "terms.md" and not e.id:
            E(d / "context" / e.file, e.line, f"heading {e.heading!r} must start with CTX-F<n> / CTX-S<n>")
        if e.file == "scenarios.md" and e.meta("Settles") and not led.terms_in(e.meta("Settles")):
            W(d / "context" / e.file, e.line, f"Settles {e.meta('Settles')!r} names no term from terms.md")
        for t in split_refs(e.meta("Not")):
            if not led.entry_by_ref(t):
                W(d / "context" / e.file, e.line, f"Not: {t!r} is not a term in terms.md")

    ctx = d / "CONTEXT.md"
    if ctx.exists():
        lines = ctx.read_text(encoding="utf-8").splitlines()
        in_amb = False
        for i, ln in enumerate(lines, 1):
            if ln.startswith("## "):
                in_amb = ln.strip() == "## Open ambiguities"
            if in_amb and ln.startswith("|") and "Resolves at" not in ln and "---" not in ln:
                cells = [c.strip() for c in ln.strip("|").split("|")]
                if len(cells) >= 3 and "child of" not in cells[2]:
                    for rid in ID_RE.findall(cells[2]):
                        n = nodes.get(rid)
                        if n and n.is_approved:
                            E(ctx, i, f"open ambiguity resolves at {rid} but {rid} is approved; re-point to a child or delete the row")
    elif led.entries:
        E(ctx, 1, "CONTEXT.md missing while context/ has entries")

    for a in led.adrs:
        if len(a.lines) > 40:
            E(a.path, len(a.lines), f"ADR {len(a.lines)} lines > 40")
        cl = _line_of(a.lines, r"^Constrains:")
        for rid in uniq(ID_RE.findall(a.constrains)):
            n = nodes.get(rid)
            if n and n.is_stale:
                E(a.path, cl, f"Constrains {rid} which is {n.design!r}; re-point to the live node")
            elif not n and rid not in led.frontier:
                E(a.path, cl, f"Constrains {rid} which does not exist")

    for nid, prev in body_violations(led).items():
        n = nodes[nid]
        E(n.path, _line_of(n.lines, r"^## Refinement"), f"Refinement changed since last sync (was {prev}) while still approved with the same Approved: value; mark stale or re-approve (bump Approved:)")

    design = d / "DESIGN.md"
    if not design.exists() and nodes:
        E(design, 1, "DESIGN.md missing; run sync")
    elif design.exists() and _norm(design.read_text(encoding="utf-8")) != _norm(render_design(led)):
        E(design, 1, "DESIGN.md out of date; run `stepwise.py sync <design-dir>` (generated — edit nodes/, not DESIGN.md)")


def _norm(s: str) -> str:
    return re.sub(r"[ \t]+", " ", "\n".join(ln.rstrip() for ln in s.strip().splitlines()))


def do_check(design_dir: Path) -> int:
    led = load(design_dir)
    check(led)
    for w in led.warnings:
        print(f"warn  {w}")
    for e in led.errors:
        print(f"error {e}")
    if not led.errors:
        print(f"ok    {design_dir.name}: {len(led.nodes)} nodes, {len(led.frontier)} frontier, {len(led.warnings)} warnings")
    return 1 if led.errors else 0


# ----------------------------------------------------------------------------- sync


def do_sync(design_dir: Path) -> int:
    touched = do_render(design_dir)
    led = load(design_dir)
    check(led)
    print(f"synced {_show(design_dir / 'DESIGN.md')}" + (f"; rewrote {len(touched)}: {', '.join(touched)}" if touched else ""))
    for w in led.warnings:
        print(f"warn  {w}")
    for e in led.errors:
        print(f"error {e}")
    print(f"{'FAIL' if led.errors else 'ok'}  {design_dir.name}: {len(led.nodes)} nodes, {len(led.frontier)} frontier, {len(led.errors)} errors, {len(led.warnings)} warnings")
    return 1 if led.errors else 0


def _show(p: Path) -> str:
    r = os.path.relpath(p)
    return str(p) if r.startswith("..") else r


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] not in ("sync", "check", "new"):
        print(__doc__)
        return 64
    d = Path(argv[2]).resolve()
    if argv[1] == "new":
        if len(argv) < 4 or not ID_RE.fullmatch(argv[3]):
            print("usage: stepwise.py new <design-dir> D-NNN [\"statement\"]", file=sys.stderr)
            return 64
        (d / "nodes").mkdir(parents=True, exist_ok=True)
        return do_new(d, argv[3], argv[4] if len(argv) > 4 else None)
    if not (d / "nodes").is_dir():
        print(f"error {d}: no nodes/ directory", file=sys.stderr)
        return 1
    return do_sync(d) if argv[1] == "sync" else do_check(d)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
