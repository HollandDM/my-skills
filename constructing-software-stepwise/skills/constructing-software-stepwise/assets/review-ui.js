// Review baselines stay in the browser or an explicitly downloaded JSON file.
const reviewStorageKey =
  "stepwise-review:" + (snapshot.review_key || snapshot.title);
let baseline = { source: reviewStorageKey, nodes: {} };
let reviewFilter = "all";
try {
  const saved = JSON.parse(localStorage.getItem(reviewStorageKey));
  if (saved?.source === reviewStorageKey && saved.nodes) baseline = saved;
} catch (_) {
  /* File-origin storage can be disabled. Export/import still works. */
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])]),
    );
  return value;
}
function reviewRecord(n) {
  const related = {};
  for (const dep of n.depends || [])
    for (const group of ["terms", "facts", "scenarios"]) {
      const record =
        ledger[group]?.[dep] ||
        Object.values(ledger[group] || {}).find((v) => v.name === dep);
      if (record) related[dep] = record;
    }
  return stable({
    node: n,
    scope: ledger.scope || "",
    nongoals: ledger.nongoals || [],
    context: related,
    adrs: snapshot.adrs.filter((a) => (n.depends || []).includes(a.id)),
  });
}
function isChanged(id) {
  const old = baseline.nodes[id];
  return (
    !old ||
    JSON.stringify(old.record) !== JSON.stringify(reviewRecord(nodes.get(id)))
  );
}
function agentChosen(n) {
  const text = [n.approved || "", ...(n.decisions || [])]
    .join(" ")
    .toLowerCase();
  if (
    text.includes("standing approval") ||
    text.includes("agent recommendation")
  )
    return true;
  return Object.values(reviewRecord(n).context).some((e) =>
    (e.source || "").toLowerCase().includes("agent recommendation"),
  );
}
function matchesReview(n) {
  if (reviewFilter === "changed") return isChanged(n.id);
  if (reviewFilter === "stale")
    return (
      n.design === "stale" ||
      n.verification === "stale" ||
      n.verification === "failed"
    );
  if (reviewFilter === "agent") return agentChosen(n);
  if (reviewFilter === "open") return n.placeholder || n.design === "draft";
  return true;
}
function reviewMessage(message) {
  $("review-message").textContent = message;
}
function persistReview() {
  try {
    localStorage.setItem(reviewStorageKey, JSON.stringify(baseline));
    reviewMessage("Review baseline saved in this browser.");
  } catch (_) {
    reviewMessage(
      "Baseline kept for this page only. Download it to preserve your review.",
    );
  }
  renderTree();
  renderReader();
}
function markReviewed(ids) {
  const at = new Date().toISOString();
  for (const id of ids)
    baseline.nodes[id] = { at, record: reviewRecord(nodes.get(id)) };
  persistReview();
}
function review(n, into) {
  const old = baseline.nodes[n.id];
  into.append(
    el(
      "p",
      "lead",
      old
        ? "Compared with your review on " + old.at.replace("T", " ")
        : "This operation has no review baseline yet. Mark it reviewed after reading the contract and its supporting evidence.",
    ),
  );
  const mark = el("button", "", "Mark this node reviewed");
  mark.onclick = () => markReviewed([n.id]);
  into.append(mark);
  if (old) {
    const current = reviewRecord(n),
      changes = [];
    function compare(before, after, path) {
      if (JSON.stringify(before) === JSON.stringify(after)) return;
      if (
        before &&
        after &&
        !Array.isArray(before) &&
        !Array.isArray(after) &&
        typeof before === "object" &&
        typeof after === "object"
      ) {
        for (const k of new Set([
          ...Object.keys(before),
          ...Object.keys(after),
        ]))
          compare(before[k], after[k], path ? path + "." + k : k);
      } else changes.push({ path, before, after });
    }
    compare(old.record, current, "");
    if (!changes.length)
      into.append(el("p", "lead", "No changes since your last review."));
    for (const change of changes) {
      const card = el("details", "card change-record"),
        head = el("summary", "", change.path.replace(/^node\./, ""));
      const before = el(
        "pre",
        "",
        change.before === undefined
          ? "Not recorded"
          : JSON.stringify(change.before, null, 2),
      );
      const after = el(
        "pre",
        "",
        change.after === undefined
          ? "Removed"
          : JSON.stringify(change.after, null, 2),
      );
      card.append(
        head,
        el("div", "clause-label", "Previously reviewed"),
        before,
        el("div", "clause-label", "Current snapshot"),
        after,
      );
      into.append(card);
    }
  }
  const removed = Object.keys(baseline.nodes).filter((id) => !nodes.has(id));
  if (removed.length)
    into.append(
      section(
        "Removed since review",
        list(
          removed.map(
            (id) =>
              id + " · " + (baseline.nodes[id].record?.node?.statement || ""),
          ),
        ),
      ),
    );
}
function initReview() {
  $("review-filter").onchange = (e) => {
    reviewFilter = e.target.value;
    renderTree();
  };
  $("review-all").onclick = () => {
    baseline.nodes = {};
    markReviewed([...nodes.keys()]);
  };
  $("review-download").onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(baseline, null, 2)], {
        type: "application/json",
      }),
    );
    const a = el("a");
    a.href = url;
    a.download = "stepwise-review.json";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("review-upload").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (
        imported.source !== reviewStorageKey ||
        !imported.nodes ||
        typeof imported.nodes !== "object" ||
        Array.isArray(imported.nodes) ||
        Object.values(imported.nodes).some(
          (v) => !v || typeof v.at !== "string" || !v.record || !v.record.node,
        )
      )
        throw Error("The file is not a review baseline for this design.");
      baseline = imported;
      persistReview();
    } catch (err) {
      reviewMessage(err.message);
    }
    e.target.value = "";
  };
}
