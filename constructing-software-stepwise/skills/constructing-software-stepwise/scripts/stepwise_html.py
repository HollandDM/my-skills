"""Self-contained, read-only HTML snapshot of a Stepwise ledger."""
from __future__ import annotations

import json
from pathlib import Path


def render_html(ledger: dict, *, title: str, exported_at: str, adrs: list[dict]) -> str:
    """Embed inert JSON safely; the client creates DOM text nodes for all content."""
    payload = {"ledger": ledger, "title": title, "exported_at": exported_at, "adrs": adrs}
    encoded = json.dumps(payload, ensure_ascii=True).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    template = Path(__file__).resolve().parent.parent / "assets" / "design-view.html"
    return template.read_text(encoding="utf-8").replace("__STEPWISE_DATA__", encoded, 1)
