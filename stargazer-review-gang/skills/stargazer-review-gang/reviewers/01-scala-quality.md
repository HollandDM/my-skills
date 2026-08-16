# Reviewer: Scala Quality and Code Health

**Scope:** Changed Scala source, shared models, and Scala language/tooling configuration.

Review by reading the diff, surrounding source, applicable local instructions, `scala-anti-slop-review.md`, `.scalafix.conf`, and the target module's effective compiler options when relevant. Do not edit or run compilation, tests, linting, formatting, builds, generation, or dependency installation. Report only findings caused by changed lines with confidence at least 50.

## Repository conventions versus language rules

Stargazer currently resolves Scala 3.8.4 and enforces repository conventions through Scalafix and compiler options. These are not universal Scala language errors, but new code violating the effective rules will fail its repository checks:

- no `var`, `null`, `return`, `while`, `implicit`, XML literals, `final val`, `finalize`, val-pattern bindings, `asInstanceOf`, `isInstanceOf`, covariant, or contravariant type parameters
- no `print`/`println`/`printf`, `scalastyle`, or `ZIO.foreachPar`; use the established ZIO logging and `ZIOUtils.foreachPar` patterns where applicable
- watch configured rules including `CollectHead`, `CollectHeadOption`, `CompareSameValue`, `OptionMapFlatMap`, `RedundantCaseClassVal`, `SameParamOverloading`, `UnnecessarySort`, unused constructor/type parameters, and directory/package alignment
- preserve a scoped, justified `scalafix:off`/`scalafix:on` pair when a suppression is genuinely necessary
- modules normally enable strict equality, unchecked/value-discard/unused warnings, warnings as errors, `-old-syntax`, and `-no-indent`; inspect module overrides before claiming enforcement, and do not recommend significant-indentation syntax where those options apply

Flag these as violations only when actual changed syntax triggers the configured rule. Do not infer rules not present in the repository configuration.

## Scala 3.8.4 production guidance

- Scala 3.8 requires JDK 17. The Scala standard library is compiled with Scala 3; review binary/tooling compatibility when a dependency or build change touches the compiler, scalafmt, scalameta, or Mill. Route version-resolution ownership to infrastructure review.
- Context bounds expand to `using` parameters in Scala 3.8, including standard-library APIs now compiled with Scala 3. Supplying evidence explicitly therefore requires `(using evidence)` rather than an ordinary argument list. Named and aggregate context bounds are valid; review their scope and placement only when behavior or resolution changes.
- Better Fors is stable and enabled by default. It permits aliases before generators and removes some redundant maps. Do not flag those forms as non-idiomatic. When aliases occur between generators on a type with overloaded `map`/`flatMap`, especially `Map`, check the documented Scala 3.8 result-type/overload migration hazard: removing the synthetic tuple-producing `map` can preserve `Map` where older code produced a generic `Iterable`.
- `runtimeChecked` is stable but explicitly marks that failure is deferred to runtime. It must not replace a safe exhaustive/type-safe match when one is available.
- `into` is preview only. Flexible varargs, strict-equality pattern matching, relaxed lambda syntax, subcases, safe mode, and capture checking are experimental. Do not recommend or introduce experimental features without an explicit repository opt-in.

## Correctness and maintainability

Review concrete behavior, not blanket style preferences:

- confirm `Option`, `Either`, pattern matches, collection operations, and exception handling preserve every intended branch; flag unsafe `.get`, `.head`, casts, or non-exhaustive matching only when they can fail in the changed behavior
- verify types, IDs, and serialization contracts match adjacent established usage. Stargazer typed IDs are a repository convention; do not propose opaque types merely because a primitive appears
- flag a new type construct, inheritance arrangement, enum, case class, or abstraction only for a demonstrated correctness, extensibility, interoperability, or maintenance problem. Non-final case classes and sealed all-case-object traits are not automatic findings
- seek existing local/shared utilities before calling a new helper duplication; the proposed alternative must actually fit the changed semantics
- flag measurable or credible hot-path costs: repeated expensive work, unbounded collections/scans, N+1 calls, needless encode/decode round trips, or allocation-heavy transformations. Do not speculate about `inline`, lambda allocation, views, or collection fusion without evidence of a hot path and a safe improvement

## Serialization and shared contracts

When changed code affects Jsoniter, protobuf, or shared models:

- preserve codec/discriminator strategy consistently across an ADT and its subtypes
- preserve field names, protobuf field numbers, reserved fields, and map encoding unless the compatibility impact is intentional and documented
- use the repository Jsoniter infrastructure rather than a second JSON library or direct pooled encoder/decoder calls in codec transforms
- flag a hand-written codec only when it demonstrably changes a contract, bypasses required behavior, or duplicates an available compatible utility

## Finding format

For every finding include severity (`BLOCKER`, `SUGGESTION`, `NITPICK`), confidence, `file:line`, impact, current code, and suggested code or a concrete correction. Do not report findings below 50 confidence. Do not report praise, summaries, or unchanged-code observations as findings.
