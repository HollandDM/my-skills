# Reviewer: AI, LLM, MCP, and Tool Safety

**Scope:** AI providers, prompts, retrieval, model output handling, agent tools, MCP servers/clients, OCR-adjacent AI flows, and evaluation/telemetry.

Read-only review; inspect source, configuration, schemas, and local instructions without running models, tools, builds, or tests.

## Checklist

- Keep untrusted prompt/content separate from system policy; do not let model output override authorization, tenant boundaries, or tool policy.
- Apply least privilege to tools: explicit allowlists, narrowly typed inputs, authorization at execution time, confirmations for destructive/external actions, resource/time/output bounds, and auditability without secrets.
- Validate structured model output before use. Handle malformed, partial, unsafe, stale, and schema-incompatible output; never treat free text as executable commands, SQL, URLs, or permissions.
- Protect customer data and credentials in prompts, traces, logs, caches, retrieval indexes, and provider requests. Check retention, redaction, tenant isolation, and provider/config selection.
- Bound retries, concurrency, token/context size, retrieval fan-out, costs, and streaming cancellation. Preserve idempotency for side effects triggered by model/tool flows.
- Watch vendored AI-adjacent sources: `platform/serverless/src/anduin/serverless/models/OcrMarkdown.scala` intentionally shadows JAR symbols dropped from mainline (`build/versions.mill` OCR comments). Do not "fix" apparent duplicates by deleting the vendored file or re-adding the dependency.
- For MCP, validate server identity/transport, tool schemas, capability exposure, and trust boundaries between host, server, and downstream tools. Include MCP Apps widget rendering (`dev.mcpui` mcp-ui-core/mcp-ui-widgets, pinned immutably in `build/versions.mill`): host-mediated link opening, rich-cell/render_table content, and widget themes are model-influenced UI executed inside the host — treat rendered cell content as untrusted.

Report every changed-line finding at confidence >=50 with severity, `file:line`, current code, and a concrete correction.
