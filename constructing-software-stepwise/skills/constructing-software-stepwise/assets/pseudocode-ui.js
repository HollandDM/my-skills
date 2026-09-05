// All source text is inserted as text nodes, including highlighted keywords.
function algorithmSignature(statement) {
  return snapshot.pseudocode?.signatures[statement] || statement;
}
function algorithmCode(raw) {
  const value = snapshot.pseudocode?.code[raw] || raw;
  const code = el("code", "");
  const keyword = value.match(
    /^(end (?:procedure|function|if|while|for|upon|atomic|parallel)|else if|for each|parallel for each|procedure|function|return|if|else|while|for|repeat|until|assert|invariant|upon|atomic|await|raise|break|continue)\b/i,
  );
  if (keyword) {
    code.append(
      el("strong", "algorithm-keyword", keyword[0]),
      document.createTextNode(value.slice(keyword[0].length)),
    );
  } else code.textContent = value;
  return code;
}
function renderCode(
  n,
  body = n.body || [],
  historical = false,
  caption = null,
) {
  const card = el("div", "card code-card algorithm-card"),
    bar = el("div", "code-bar");
  bar.append(
    el("span", "", "ALGORITHM"),
    el(
      "span",
      "",
      caption ||
        (historical
          ? "Superseded body"
          : state(n) === "approved"
            ? "Approved refinement"
            : "Unapproved refinement"),
    ),
  );
  card.append(
    bar,
    el("div", "algorithm-title", `Algorithm ${n.id} · ${n.gloss || name(n)}`),
  );
  // Observed and superseded bodies must never inherit today's intended contract.
  if (!historical && !caption && n.contract && Object.keys(n.contract).length) {
    const meta = el("dl", "algorithm-meta");
    for (const [key, value] of Object.entries(n.contract)) {
      const label =
        { pre: "Require", post: "Ensure", input: "Input", output: "Output" }[
          key
        ] || key[0].toUpperCase() + key.slice(1);
      meta.append(el("dt", "", label), el("dd", "", txt(value)));
    }
    card.append(meta);
  }
  const appendLine = (raw, index, indent = 0, line = {}) => {
    const row = el("div", "code-line"),
      main = el("div", "line-content");
    main.style.setProperty(
      "--indent",
      Math.min(Math.max(indent, 0), 80) * 7 + "px",
    );
    main.append(algorithmCode(raw));
    const target = line.child || line.reuse;
    const note =
      line.gloss || (target && nodes.get(target)?.gloss) || line.note;
    if (note) main.append(el("div", "line-note", "▷ " + txt(note)));
    if (line.target) main.append(el("div", "line-note", "▷ " + line.target));
    row.append(el("span", "line-no", index), main);
    if (target && nodes.has(target))
      row.append(linkTo(target, (line.reuse ? "↗ " : "") + target, "code-ref"));
    card.append(row);
  };
  appendLine("procedure " + algorithmSignature(n.statement || n.id), 1);
  body.forEach((line, i) =>
    appendLine(line.code || "", i + 2, 2 + (Number(line.indent) || 0), line),
  );
  appendLine("end procedure", body.length + 2);
  return card;
}
