"""Self-contained, read-only HTML snapshot of a Stepwise ledger."""
from __future__ import annotations

import json
from pathlib import Path


def render_html(ledger: dict, *, title: str, exported_at: str, adrs: list[dict], review_key: str = "") -> str:
    """Embed inert JSON safely; the client creates DOM text nodes for all content."""
    payload = {"ledger": ledger, "title": title, "exported_at": exported_at, "adrs": adrs, "review_key": review_key}
    encoded = json.dumps(payload, ensure_ascii=True).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    template = Path(__file__).resolve().parent.parent / "assets" / "design-view.html"
    document = template.read_text(encoding="utf-8")
    for marker, filename in [("__STEPWISE_REVIEW_JS__", "review-ui.js"), ("__STEPWISE_BEHAVIOR_JS__", "behavior-ui.js"), ("__STEPWISE_EXISTING_JS__", "existing-ui.js")]:
        document = document.replace(marker, (template.parent / filename).read_text(encoding="utf-8"), 1)
    return document.replace("__STEPWISE_DATA__", encoded, 1)
