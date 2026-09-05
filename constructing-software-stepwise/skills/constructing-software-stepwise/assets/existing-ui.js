// Descriptive observations and source versions never stand in for intended contracts.
function observedOnly(n) {
  return (
    !!(
      n.origin === "existing-code" ||
      n.observation ||
      Object.keys(n.bindings || {}).length
    ) && !Object.keys(n.contract || {}).length
  );
}
function hasObserved(n) {
  return (
    n.origin === "existing-code" ||
    !!n.observation ||
    Object.keys(n.bindings || {}).length > 0
  );
}
function observed(n, into) {
  const obs = n.observation,
    report = n.source_report || {};
  const conformance = n.conformance ||
    report.conformance || {
      status: "unassessed",
      reason: "No intended contract is recorded.",
    };
  into.append(
    el(
      "p",
      "lead",
      "This records inspected implementation behavior. It does not approve that behavior as a requirement.",
    ),
  );
  if (n.source_state && n.source_state !== "current")
    into.append(
      el(
        "div",
        "notice",
        "Source inspection: " +
          n.source_state +
          " · " +
          (report.reason ||
            "Reinspect this implementation before relying on its observations."),
      ),
    );
  const versions = el("details", "card change-record");
  versions.open = true;
  versions.append(
    el("summary", "", "Implementation versions"),
    el("div", "clause-label", "Current source SHA-256"),
    el(
      "pre",
      "",
      n.current_implementation_version ||
        report.implementation_version ||
        "No sources bound",
    ),
  );
  if (obs)
    versions.append(
      el("div", "clause-label", "Inspected source SHA-256"),
      el("pre", "", obs.implementation_version || "Not recorded"),
    );
  if (n.implementation_revision)
    versions.append(
      el(
        "p",
        "",
        "Recorded implementation revision: " + n.implementation_revision,
      ),
    );
  if (report.commit || obs?.implementation_commit)
    versions.append(
      el(
        "p",
        "",
        "Git context: " +
          (report.commit || obs.implementation_commit) +
          " · Source fingerprints include working-tree edits.",
      ),
    );
  into.append(versions);
  if (obs) {
    into.append(
      section(
        "Observed effect",
        list([obs.effect]),
        "Inspection " + obs.revision,
      ),
    );
    const claims = el("div", "card");
    for (const claim of obs.claims || []) {
      const record = el("div", "record");
      record.append(
        el(
          "span",
          "badge " + (claim.basis === "inferred" ? "inference" : ""),
          claim.basis,
        ),
        el("p", "", claim.text),
      );
      const refs = el("div", "chips");
      for (const sid of claim.sources) {
        const b = el("button", "chip", sid);
        b.onclick = () =>
          document
            .getElementById("binding-" + sid)
            ?.scrollIntoView({ block: "center" });
        refs.append(b);
      }
      record.append(refs);
      claims.append(record);
    }
    into.append(section("Source-backed claims", claims));
    if (obs.body?.length)
      into.append(
        section(
          "Observed pseudocode",
          renderCode(n, obs.body, false, "Observed implementation"),
        ),
      );
    if (obs.unknowns?.length)
      into.append(section("Unresolved questions", list(obs.unknowns)));
    into.append(el("p", "muted", "Inspected " + obs.date + " by " + obs.by));
  } else
    into.append(
      el(
        "div",
        "empty",
        "No behavior has been recorded yet. Bind the sources, inspect the code, and record an observation using the scan token.",
      ),
    );
  const comparison = el("div", "card");
  const status = el("div", "record");
  status.append(
    el("h4", "", conformance.status),
    el("p", "", conformance.reason),
  );
  comparison.append(status);
  for (const [clause, value] of Object.entries(obs?.comparisons || {})) {
    const row = el("div", "record");
    row.append(
      el("h4", "", clause + " · " + value.status),
      el("p", "", value.reason),
    );
    comparison.append(row);
  }
  into.append(
    section(
      "Comparison with intended contract",
      comparison,
      "Inspection assessment, not verification",
    ),
  );
  const bindings = el("div", "card");
  for (const [sid, binding] of Object.entries(n.bindings || {})) {
    const row = el("div", "record");
    row.id = "binding-" + sid;
    const current = report.bindings?.[sid];
    row.append(el("h4", "", sid + " · " + binding.path));
    if (binding.symbol) row.append(el("p", "mono", binding.symbol));
    if (binding.lines)
      row.append(
        el("small", "", "Location hint: lines " + binding.lines.join("–")),
      );
    if (current)
      row.append(
        el(
          "p",
          "",
          current.current.state +
            (current.changed ? " · changed since inspection" : ""),
        ),
      );
    const version = current?.current?.sha256 || binding.baseline_sha256;
    row.append(el("pre", "", version));
    bindings.append(row);
  }
  if (!bindings.childElementCount)
    bindings.append(el("div", "empty", "No source bindings."));
  into.append(
    section(
      "Source bindings",
      bindings,
      "Whole-file fingerprints; symbols are location hints",
    ),
  );
  if (n.implementation_history?.length)
    into.append(
      section(
        "Implementation version history",
        list(
          [...n.implementation_history]
            .reverse()
            .map(
              (v) =>
                "Revision " +
                v.revision +
                " · " +
                v.date +
                "\n" +
                v.version +
                (v.commit ? "\nGit context: " + v.commit : ""),
            ),
        ),
      ),
    );
  if (n.observation_history?.length) {
    const history = el("div");
    for (const previous of [...n.observation_history].reverse()) {
      const card = el("details", "card change-record");
      card.append(
        el(
          "summary",
          "",
          "Inspection " + previous.revision + " · " + previous.date,
        ),
        el("p", "lead", previous.effect),
        el("pre", "", previous.implementation_version || previous.scope_hash),
      );
      card.append(
        list((previous.claims || []).map((c) => c.basis + ": " + c.text)),
      );
      if (previous.body?.length)
        card.append(
          renderCode(
            n,
            previous.body,
            true,
            "Previous observed implementation",
          ),
        );
      if (previous.bindings)
        card.append(
          list(
            Object.entries(previous.bindings).map(
              ([id, b]) =>
                id + ": " + b.path + (b.symbol ? " · " + b.symbol : ""),
            ),
          ),
        );
      history.append(card);
    }
    into.append(section("Previous observations", history));
  }
}
