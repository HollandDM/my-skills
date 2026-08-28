# Reviewer: Infrastructure, SRE, Build, and Supply Chain

**Scope:** Rivendell TypeScript/Bun (`ci/rivendell-v2`, `bunfig.toml`, `bun.lock`), Java/Python/shell operational tooling (`scripts/`, `project/tools/`), Kubernetes/Tilt (`Tiltfile`), CI (`ci/tasks`, `ci/scripts`, `ci/docker-images`, `ci/credentials`, `ci/vars`), deployment/configuration, Mill/build tooling (`build/*.mill`), dependencies, lockfiles, images, mobile fastlane lanes, and supply chain (incl. vendored deps).

Read-only review. Inspect manifests, CI, package/build files, lockfiles, and relevant consumers. Do not run builds, linters, tests, installs, image commands, or deployments.

## Checklist

- Check configuration defaults, required secrets, validation, environment precedence, and safe failure modes. Never expose credentials in source, logs, CI output, manifests, or generated artifacts.
- For Kubernetes/Rivendell changes, verify selectors, labels, namespaces, service accounts/RBAC, network exposure, resource requests/limits, probes, rollout strategy, disruption behavior, and observability match the workload.
- Check CI/build changes for deterministic inputs, pinned/locked dependencies where the ecosystem supports them, correct cache invalidation, least-privilege tokens, artifact provenance, and no unreviewed remote execution/download paths.
- Review dependency and lockfile changes for unexpected package additions, unsafe lifecycle scripts, vulnerable/abandoned substitutions when evident from supplied metadata, and incompatible runtime/tool versions.
- Check vendored dependencies explicitly: JS vendor pipeline (`scripts/bun-vendor-build.js`, `scripts/gen-vendor-entries.js`) and vendored Scala sources shadowing JAR symbols (e.g. `platform/serverless/src/anduin/serverless/models/OcrMarkdown.scala`, see `build/versions.mill` OCR comments). Vendored copies bypass normal lockfile/package-addition review — verify provenance and sync intent. For CI-published snapshot SDKs (mcp-ui-scala `0.3.0-<commits>-<sha>` pins in `build/versions.mill`), confirm the pin comment identifies source commit and publishing CI before approving bumps.
- For Scala compiler/scalafmt/scalameta/Mill changes, assess compatibility with the repo's effective Scala toolchain (verify the resolved version — currently 3.8.x via Mill default) and the JDK configured via Mill/CI images (`.mill-jvm-version` = `system`, no hard pin); verify actual pins before assuming versions. Coordinate language semantics with the Scala reviewer.
- Check operational blast radius: migration/config ordering, backward compatibility during rollout, rate limits, timeouts, autoscaling, alerting, and rollback viability.

Report every changed-line finding at confidence >=50 with severity, `file:line`, current code, and a concrete correction.
