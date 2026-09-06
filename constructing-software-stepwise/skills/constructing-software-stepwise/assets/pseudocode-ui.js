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
  expansion = null,
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
    if (expansion && target && nodes.has(target)) {
      const child = nodes.get(target),
        path = expansion.path + "/" + index;
      const childBody = expansion.observed
        ? child.observation?.body || []
        : child.body || [];
      if (expansion.ancestors.has(target)) {
        main.append(
          el(
            "div",
            "notice",
            "Recursive reference to " + target + "; expansion stops here.",
          ),
        );
      } else if (childBody.length) {
        const opened = expansion.choices.get(path) ?? expansion.all;
        const toggle = el(
          "button",
          "expand-procedure",
          (opened ? "Collapse " : "Expand ") + target + " · " + raw,
        );
        toggle.dataset.expandPath = path;
        toggle.setAttribute("aria-expanded", String(opened));
        toggle.onclick = () => {
          expansion.choices.set(path, !opened);
          expansion.redraw(path);
        };
        if (opened) main.replaceChildren(toggle);
        else main.append(toggle);
        if (opened) {
          if (++expansion.budget.count > 800) {
            main.append(
              el(
                "div",
                "notice",
                "Large expansion paused at 800 procedures. Open this node to continue.",
              ),
            );
          } else {
            const ancestors = new Set(expansion.ancestors);
            ancestors.add(target);
            main.append(
              renderCode(
                child,
                childBody,
                false,
                expansion.observed ? "Observed implementation" : null,
                { ...expansion, path, ancestors },
              ),
            );
          }
        }
      } else {
        const detail =
          child.target ||
          child.implementation_plan?.approach ||
          "No pseudocode recorded";
        main.append(
          el(
            "div",
            "line-note",
            target +
              ": " +
              (expansion.observed ? "No observed pseudocode recorded" : detail),
          ),
        );
      }
    }
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

function pseudocode(n, into) {
  let all = false,
    observed = observedOnly(n);
  const choices = new Map();
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
  const expand = el("button", "", "Expand all descendants");
  const collapse = el("button", "", "Collapse all calls");
  const algorithms = el("div", "pseudocode-tree");
  const redraw = (focusPath) => {
    algorithms.replaceChildren();
    const body = observed ? n.observation?.body || [] : n.body || [];
    if (body.length)
      algorithms.append(
        renderCode(
          n,
          body,
          false,
          observed ? "Observed implementation" : null,
          {
            all,
            observed,
            choices,
            redraw,
            path: n.id,
            ancestors: new Set([n.id]),
            budget: { count: 1 },
          },
        ),
      );
    else
      algorithms.append(
        el(
          "div",
          "empty",
          observed
            ? "No observed pseudocode recorded for this node."
            : n.target
              ? "Implementation target: " + n.target
              : n.implementation_plan
                ? "Implementation approach: " + n.implementation_plan.approach
                : "No pseudocode recorded for this node.",
        ),
      );
    if (focusPath)
      [...algorithms.querySelectorAll("[data-expand-path]")]
        .find((b) => b.dataset.expandPath === focusPath)
        ?.focus();
  };
  basis.onchange = () => {
    observed = basis.value === "observed";
    choices.clear();
    redraw();
  };
  expand.onclick = () => {
    all = true;
    choices.clear();
    redraw();
  };
  collapse.onclick = () => {
    all = false;
    choices.clear();
    redraw();
  };
  controls.append(basis, expand, collapse);
  into.append(
    controls,
    el(
      "p",
      "muted",
      "Expand calls in place. Shared procedures repeat at each call site; each procedure keeps its own locals and returns.",
    ),
    algorithms,
  );
  redraw();
}
