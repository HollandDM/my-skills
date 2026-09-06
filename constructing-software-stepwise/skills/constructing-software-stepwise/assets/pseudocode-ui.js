// Source content always enters the document as inert text.
function algorithmSignature(statement) {
  return snapshot.pseudocode?.signatures[statement] || statement;
}
function algorithmCode(raw) {
  const value = snapshot.pseudocode?.code[raw] || raw;
  const code = el("code", "");
  const keyword = value.match(
    /^(end (?:procedure|function|if|while|for|upon|atomic|parallel)|else if|for each|parallel for each|procedure|function|return|if|else|while|for|repeat|until|assert|invariant|upon|atomic|await|raise|break|continue)\b/i,
  );
  if (keyword)
    code.append(
      el("strong", "algorithm-keyword", keyword[0]),
      document.createTextNode(value.slice(keyword[0].length)),
    );
  else code.textContent = value;
  return code;
}
function renderCode(
  n,
  body = n.body || [],
  historical = false,
  caption = null,
  onReference = null,
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
    if (target && nodes.has(target)) {
      const link = linkTo(
        target,
        (line.reuse ? "↗ " : "") + target,
        "code-ref",
      );
      if (onReference)
        link.onclick = (event) => {
          event.preventDefault();
          onReference(target);
        };
      row.append(link);
    }
    card.append(row);
  };
  appendLine("procedure " + algorithmSignature(n.statement || n.id), 1);
  body.forEach((line, i) =>
    appendLine(line.code || "", i + 2, 2 + (Number(line.indent) || 0), line),
  );
  appendLine("end procedure", body.length + 2);
  return card;
}

function reachableProcedures(root, observed) {
  const visited = new Set(),
    result = [],
    pending = [root.id];
  while (pending.length) {
    const id = pending.pop();
    if (visited.has(id) || !nodes.has(id)) continue;
    visited.add(id);
    const node = nodes.get(id);
    result.push(node);
    const body = observed ? node.observation?.body || [] : node.body || [];
    const refs = body
      .flatMap((line) => [line.child, line.reuse])
      .filter(Boolean);
    if (observed) refs.push(...(node.observed_children || []));
    else refs.push(...(node.depends || []).filter((ref) => nodes.has(ref)));
    pending.push(...refs.reverse());
  }
  return result;
}

function pseudocode(n, into) {
  let observed = observedOnly(n);
  const controls = el("div", "pseudocode-controls");
  const basis = el("select");
  basis.setAttribute("aria-label", "Pseudocode source");
  for (const [value, label] of [
    ["intended", "Intended design"],
    ["observed", "Observed implementation"],
  ]) {
    const option = el("option", "", label);
    option.value = value;
    basis.append(option);
  }
  basis.value = observed ? "observed" : "intended";
  const count = el("span", "muted");
  const navigation = el("div", "chips pseudocode-index");
  const algorithms = el("div", "pseudocode-tree");
  const redraw = () => {
    algorithms.replaceChildren();
    navigation.replaceChildren();
    const procedures = reachableProcedures(n, observed),
      cards = new Map();
    count.textContent = procedures.length + " reachable procedures";
    const jump = (id) => {
      const card = cards.get(id);
      if (card) {
        card.scrollIntoView({ block: "start" });
        card.focus({ preventScroll: true });
      }
    };
    for (const node of procedures) {
      const body = observed ? node.observation?.body || [] : node.body || [];
      let card;
      if (body.length)
        card = renderCode(
          node,
          body,
          false,
          observed ? "Observed implementation" : null,
          jump,
        );
      else {
        card = el("div", "card code-card algorithm-card");
        card.append(
          el(
            "div",
            "code-bar",
            observed ? "Observed implementation" : state(node),
          ),
          el(
            "div",
            "algorithm-title",
            `Algorithm ${node.id} · ${node.gloss || name(node)}`,
          ),
        );
        card.append(
          el(
            "div",
            "empty",
            observed
              ? "No observed pseudocode recorded for this node."
              : node.target
                ? "Implementation target: " + node.target
                : node.implementation_plan
                  ? "Implementation approach: " +
                    node.implementation_plan.approach
                  : "No pseudocode recorded for this node.",
          ),
        );
        if (!observed && node.implementation_plan)
          card.append(
            el(
              "div",
              "empty",
              "Validation: " + node.implementation_plan.validation,
            ),
          );
      }
      card.dataset.procedure = node.id;
      card.tabIndex = -1;
      cards.set(node.id, card);
      algorithms.append(card);
      const link = el("button", "chip", node.id + " · " + name(node));
      link.onclick = () => jump(node.id);
      navigation.append(link);
    }
  };
  basis.onchange = () => {
    observed = basis.value === "observed";
    redraw();
  };
  controls.append(basis, count);
  into.append(
    controls,
    el(
      "p",
      "muted",
      "Selected procedure and everything reachable below it, each shown once. Follow a call to jump to its procedure.",
    ),
    navigation,
    algorithms,
  );
  redraw();
}
