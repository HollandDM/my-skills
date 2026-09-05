// State and sequence charts render explicit design records, never inferred behavior.
let chartMode = "design";
function behaviorLink(element, node, fallback) {
  element.setAttribute("tabindex", "0");
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", node ? "Open " + node : fallback);
  const activate = () => {
    if (node && nodes.has(node)) navigate(node);
    else $("chart-selection").textContent = fallback;
  };
  element.onclick = activate;
  element.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  };
}
function behaviorCanvas(width, height) {
  graphWidth = width;
  graphHeight = height;
  const svg = $("graph");
  svg.replaceChildren();
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const defs = svgEl("defs"),
    marker = svgEl("marker", {
      id: "behavior-arrow",
      viewBox: "0 0 10 10",
      refX: 9,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: "auto",
    });
  marker.append(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#007c78" }));
  defs.append(marker);
  svg.append(defs);
  return svg;
}
function chartLabel(svg, x, y, value, cls = "behavior-label") {
  const text = svgEl(
    "text",
    { x, y, class: cls, "text-anchor": "middle" },
    value,
  );
  text.append(svgEl("title", {}, value));
  svg.append(text);
  return text;
}
function drawBehavior() {
  const n = nodes.get(selected),
    behavior = n?.behavior || {};
  const rows =
    chartMode === "states"
      ? behavior.states || []
      : behavior.participants || [];
  $("focus-node").disabled = true;
  if (!rows.length) {
    const svg = behaviorCanvas(400, 200);
    chartLabel(
      svg,
      200,
      70,
      chartMode === "states"
        ? "No state model recorded."
        : "No interaction sequence recorded.",
    );
    chartLabel(
      svg,
      200,
      100,
      "Add explicit behavior to this node to see it here.",
    );
    $("edge-count").textContent = "No behavior model";
    setZoom(zoom);
    return;
  }
  if (chartMode === "states") {
    const edges = behavior.transitions || [];
    const width = 420,
      height = Math.max(260, rows.length * 140 + 50);
    const svg = behaviorCanvas(width, height),
      places = new Map(rows.map((r, i) => [r.id, { x: 115, y: 45 + i * 140 }]));
    edges.forEach((edge, i) => {
      const a = places.get(edge.from),
        b = places.get(edge.to);
      if (!a || !b) return;
      let d, x, y;
      if (edge.from === edge.to) {
        d = `M ${a.x + 30} ${a.y} C ${a.x + 20} ${a.y - 55},${a.x + 135} ${a.y - 55},${a.x + 125} ${a.y}`;
        x = a.x + 80;
        y = a.y - 34;
      } else if (b.y === a.y + 140) {
        d = `M ${a.x + 80} ${a.y + 60} L ${b.x + 80} ${b.y}`;
        x = a.x + 130;
        y = (a.y + 60 + b.y) / 2 - 8;
      } else {
        const lane = b.y > a.y ? 365 : 45;
        const side = b.y > a.y ? 160 : 0;
        d = `M ${a.x + side} ${a.y + 30} H ${lane} V ${b.y + 30} H ${b.x + side}`;
        x = lane;
        y = (a.y + b.y) / 2 + 20;
      }
      const path = svgEl("path", {
        d,
        class: "behavior-edge",
        "marker-end": "url(#behavior-arrow)",
      });
      path.append(
        svgEl(
          "title",
          {},
          edge.event +
            (edge.guard ? " [" + edge.guard + "]" : "") +
            (edge.action ? " / " + edge.action : ""),
        ),
      );
      svg.append(path);
      const label = chartLabel(
        svg,
        x,
        y,
        edge.event + (edge.guard ? " [" + edge.guard + "]" : ""),
      );
      behaviorLink(
        label,
        edge.node,
        edge.event + (edge.action ? " → " + edge.action : ""),
      );
    });
    for (const row of rows) {
      const p = places.get(row.id),
        g = svgEl("g", {
          transform: `translate(${p.x},${p.y})`,
          class: "behavior-state",
        });
      g.append(svgEl("rect", { width: 160, height: 60, rx: 12 }));
      if (row.terminal)
        g.append(svgEl("rect", { x: 4, y: 4, width: 152, height: 52, rx: 9 }));
      if (row.initial)
        g.append(svgEl("circle", { cx: -12, cy: 30, r: 5, fill: "#007c78" }));
      g.append(
        svgEl("text", { x: 80, y: 34, "text-anchor": "middle" }, row.label),
      );
      g.append(svgEl("title", {}, row.label));
      behaviorLink(g, row.node, row.label);
      svg.append(g);
    }
    $("edge-count").textContent =
      rows.length + " states · " + edges.length + " transitions";
  } else {
    const messages = behavior.messages || [],
      width = Math.max(360, rows.length * 180 + 60),
      height = Math.max(260, messages.length * 88 + 170);
    const svg = behaviorCanvas(width, height),
      places = new Map(rows.map((row, i) => [row.id, 100 + i * 180]));
    for (const row of rows) {
      const x = places.get(row.id);
      svg.append(
        svgEl("path", {
          d: `M ${x} 70 L ${x} ${height - 30}`,
          class: "lifeline",
        }),
      );
      const g = svgEl("g", { class: "behavior-state" });
      g.append(
        svgEl("rect", { x: x - 72, y: 20, width: 144, height: 44, rx: 8 }),
        svgEl("text", { x, y: 47, "text-anchor": "middle" }, row.label),
      );
      behaviorLink(g, row.node, row.label);
      svg.append(g);
    }
    messages.forEach((m, i) => {
      const x = places.get(m.from),
        to = places.get(m.to),
        y = 125 + i * 88;
      if (x === undefined || to === undefined) return;
      const d =
        x === to ? `M ${x} ${y} h 52 v 30 h -52` : `M ${x} ${y} H ${to}`;
      const path = svgEl("path", {
        d,
        class: "behavior-edge" + (m.kind === "return" ? " returning" : ""),
        "marker-end": "url(#behavior-arrow)",
      });
      svg.append(path);
      const label = chartLabel(
        svg,
        x === to ? x + 55 : (x + to) / 2,
        y - 10,
        i + 1 + ". " + m.label,
      );
      behaviorLink(label, m.node, m.label);
    });
    $("edge-count").textContent =
      rows.length + " participants · " + messages.length + " messages";
  }
  setZoom(zoom);
}
