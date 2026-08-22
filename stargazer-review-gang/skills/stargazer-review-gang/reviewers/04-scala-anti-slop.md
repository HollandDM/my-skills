# Reviewer: Scala Anti-Slop and Functional Design

**Scope:** Changed Scala source, shared models, and Scala language/tooling configuration. This is exactly the same assigned file and hunk scope as reviewer 01.

Review whether changed code makes domain alternatives, validation, effects, dependencies, and unsafe assumptions explicit in types and at their owner boundary. Preserve precise compile-time evidence from input boundary to use, parse representations once, model valid states explicitly, and keep unavoidable runtime assumptions locally visible and justified.

Prefer a functional core of deterministic transformations and thin effectful orchestration when that division removes a demonstrated ambiguity or hidden input. This is not a mandate for Haskell syntax in Scala: do not require point-free code, universal ADTs/opaque types, artificial `ZIO` wrappers, or extraction of straightforward orchestration.

This reviewer is read-only. Do not edit or run compilation, tests, linting, formatting, builds, generation, or dependency installation.

## Authoritative Guidance

Read the repository-root `scala-anti-slop-review.md` in full before reviewing. It is the authoritative, evolving Stargazer guidance for this specialist. Also inspect the target module's effective compiler options and applicable local instructions. If the canonical file is unavailable, use the rules below as the minimum fallback.

Review the diff first. Report only issues introduced, worsened, or newly relied upon by changed code. Use unchanged source to establish contracts and affected consumers, not as an independent source of findings.

## Boundary Classification

Before applying a rule, classify the code as domain/service code or as framework, interop, serialization, generated, test, dynamic-schema, or generic-infrastructure code. Broad representations and runtime recovery may be necessary at an owner boundary; the defect is allowing them to escape that boundary or hiding an assumption without evidence.

Do not report a pattern by itself. Identify the evidence discarded or assumption hidden, the concrete failure or maintenance risk, and the smallest appropriate correction.

## Core Checks

### Functional design: values, effects, and valid states

- Flag a changed domain function returning a plain value, `Option`, or `Either` when it directly reads time, randomness, process configuration, mutable global state, performs I/O, or changes external state, and that hidden input/effect can change the result, repeat the action, or prevent deterministic testing. Pass the value/capability explicitly or lift the operation into the established effect boundary.
- Flag mixed business decision and direct effect only when the same decision cannot be tested, reused, or made exhaustive without executing the effect, or when the mixing hides an ordering/failure requirement. Do not demand extraction for linear, single-use orchestration.
- A ZIO value is an explicit description of an effect, not an impurity by itself. ZIO environments/layers, effectful adapters, entrypoints, factories, and framework callbacks are legitimate dependency boundaries; do not require every dependency to become an ordinary parameter or every effect to move to one outermost method.
- Model expected, caller-relevant alternatives with `Option`, `Either`, a closed ADT, or a precise ZIO error channel. Flag a changed domain representation that encodes an expected caller-relevant alternative as an unmodelled sentinel, invalid partial state, or unchecked assumption when callers lose information needed to recover or choose behavior. Reviewer 01 owns the concrete partial operation itself. Do not require one specific error carrier or an elaborate error hierarchy callers cannot use.
- Flag a changed record with a discriminator plus conditionally meaningful fields, mutually exclusive booleans/options, sentinel values, or stringly-typed cases only when it admits a concrete invalid or ambiguously handled state. Prefer an enum or sealed ADT for a closed domain choice; preserve deliberately open protocol, generated, database/JSON, generic-infrastructure, or externally extensible hierarchies.
- At a new public/domain module boundary, minimize the exposed representation surface first. When callers do not need the full underlying algebra, prefer an opaque type, validated value, private/smart constructor, or typed ID over exposing a raw carrier.
- Flag a changed public/domain boundary that accepts or returns same-representation values—such as `String`, `Long`, `UUID`, `BigDecimal`, or raw collections—when their roles or invariants differ and the API permits accidental interchange, invalid construction, or carrier operations that bypass the boundary. Do not require wrappers for every primitive, DTO field, private local value, wire-format value, generated model, or value whose role is fixed by its enclosing type.
- An opaque type should minimize exposed representation surface: keep its carrier and narrowly scoped construction/validation inside its owner and expose only the constructors, eliminators, operations, and explicit boundary conversions callers need. Do not use the owner to hide mutable state or backend effects; retain those at their explicit service/effect boundary. An explicit `toUnderlying`/`lower` is legitimate at a named serialization, Java-interop, persistence, or backend-adapter boundary; an implicit/general widening is not.
- Opaque types are representation abstractions, not runtime tags. Do not use `isInstanceOf`, `getClass`, reflection, or class-name dispatch to distinguish them; cross Java/DB/JSON boundaries through the owning companion or named adapter, where conversion to/from the underlying representation is intentional.

### Compose functions; localize proven mutation

- Prefer changed domain logic whose inputs, result, expected failure, and required capability are visible in its ordinary or ZIO type. A helper that builds `ZIO[R, E, A]` is a pure description; execution belongs at an established runtime/boundary.
- A pure domain function body should compose its inputs, pure constructors, and other pure transformations. Direct `if`, `match`, arithmetic, and collection operations are ordinary pure composition; do not require point-free syntax, higher-order wrappers, a `for` comprehension, or a separate helper merely to look functional.
- Flag a composable domain helper that evaluates an effect through `Unsafe`, a runtime, a global callback, or another terminal operation when that prevents callers from composing, sequencing, testing, or handling its result/failure. Reviewer 02 owns generic runtime/resource/concurrency mechanics.
- Treat a public function as pure only when it has no hidden I/O, mutation, clock, randomness, configuration, or global-state input. The private implementation may use mutation only as a proven optimization while preserving the same immutable result and observable failure behavior for all inputs.
- The optimization exception permits only method-local, non-escaping state confined to one evaluation. It does not cover mutable fields, caches, singleton state, shared `Ref`s, callback captures, fiber hand-offs, returned aliases, hidden mutable reads, or I/O.
- Require strong evidence before introducing that exception: a benchmark/profile, documented input-size/latency/allocation constraint, or source-evident asymptotic cost on an actually exercised hot path.
- Immediately above an optimized mutable function, require both a `PERFORMANCE:` comment stating that evidence and a `REFERENCE PURE:` comment with the equivalent pure formulation or a stable local reference to it. The reference need not run in production, but must be precise enough to audit equivalence. If the implementation needs a forbidden mutable construct, it also requires the narrowest justified local suppression.
- This optimization rule does not apply to mutation required by a Java/framework/generated adapter at its owner boundary. Keep that mutation local and non-escaping, but do not demand a fictional pure formulation; review it under the applicable interop/boundary contract.

### Preserve precise evidence

- Every changed domain/service/API value and collection element needs the narrowest honest static type; compiler inference satisfies this rule, so do not require redundant annotations. Do not expose `Any`, `AnyRef`, `Object`, `Matchable`, `Product`, `Serializable`, generic maps, or untyped tuples outside their owner boundary when a more precise type is known.
- Flag a known precise value widened to `Any`, `AnyRef`, `Object`, `Matchable`, `Product`, `Serializable`, `Map[String, Any]`, an untyped tuple, or a domain/service API widened to `Throwable` when meaningful owner evidence is lost. For `Throwable`, require that the changed code already distinguishes recoverable domain cases or callers consequently lose a needed recovery decision.
- Distinguish legitimate subtype widening to a domain trait from evidence erasure.
- A discarded successful result should normally become `Unit`; `Task[Any]` widens the value rather than discarding it.
- Do not hide a low-evidence contract behind a type alias.
- Do not widen a value merely to route it through a generic helper if that helper can be parameterized by the precise type; do not require precision a real external boundary cannot establish.

### Parse at owner boundaries

- Decode and validate HTTP, JSON/YAML, database, configuration, queue, JavaScript, reflection, and third-party values at the closest owner boundary.
- Normalize incoming JVM `null` before exposing a Scala domain value.
- Keep genuinely heterogeneous rows or schemaless data behind a named decoder, typed accessor, or explicit boundary API.
- Flag precise values converted to strings or generic nodes and reparsed across internal layers without a real wire/storage boundary.
- A validation function must return a value that forces the caller to account for failure—`Either`, `Option`, a validated domain value, or the established typed error effect—when ignoring failure would admit an invalid state. Do not report boolean predicates used only for branching or filtering.

### Contextual abstractions must carry real evidence

- Treat `given`/`using` as appropriate for dictionary-like, type-directed capabilities such as ordering, codecs, and derivation evidence.
- Prefer a type class when an operation is orthogonal to the represented data, applies coherently by static type, can serve types the module does not own, and is independent of request, tenant, clock, connection, or other runtime identity. Prefer an enum/sealed ADT for closed data alternatives; a trait/abstract class for an object with identity, lifecycle, protected state, or required runtime dependency; and a ZIO environment or ordinary parameter for application services.
- A type class is a dictionary selected by static type, not a service locator. Flag a newly introduced `given` only when its hidden selection can choose materially different application behavior, conceal a request/tenant/resource dependency, or make the required test capability unavailable or ambiguous. Do not introduce `F[_]`/`Monad`/`Sync` merely to imitate tagless-final style in an application module with one real runtime, ZIO, and meaningful `R`/`E` evidence.
- Do not flag established local instances, derivation, or context bounds merely because they are contextual.

### Do not erase and recreate types

- Trace values widened and later recovered through unchecked patterns, `@unchecked`, reflection, string tags, manual field probing, `asMatchable`, or unsafe generic helpers.
- Remember that erased parameterized patterns do not validate element type. `ClassTag` usually proves only runtime class; `TypeTest` is explicit runtime-test evidence but its implementation still requires review.
- Prefer a typed ADT, a safe local union, or one named decoder at the actual boundary.
- In changed domain/service code, never use `isInstanceOf` to rediscover a value's case. Where code owns the alternatives, model them as an enum/sealed ADT and use exhaustive matching. Report only the separate loss of a closed domain model or boundary containment; Reviewer 01 owns configured-rule and erased-pattern findings.
- At a Java, reflection, generated, plugin, or dynamic-schema boundary, localize any required runtime matching to the adapter and immediately produce a typed boundary value—an owned closed ADT where alternatives are closed—or a named decode error. Do not let a tested `Any`/open hierarchy leak into domain code, and do not treat `case x: F[T]` over an erased JVM generic as proof of `T`.

### Audit runtime escape hatches

Review every changed or newly relied-upon use of `.runtimeChecked`, `@unchecked`, `scala.compiletime.asMatchable`, `@nowarn`, `scalafix:ok`, and `scalafix:off`.

- `.runtimeChecked` opts into possible runtime pattern failure; it does not prove erased arguments.
- `@unchecked` can suppress evidence the JVM never established.
- `asMatchable` bypasses matchability restrictions.
- warning and Scalafix suppressions hide diagnostics rather than add proof.
- Evidence-bypassing assertions require an adjacent `SAFETY:` comment naming the invariant, the code/boundary that establishes it, and why the unsafe scope is minimal. A comment does not substitute for an available type-level proof.
- Ordinary lint suppressions must name the exact rule, use the narrowest practical scope, and explain the external constraint or invariant.

### Use typed elimination and valid-state models

- Pattern matching over sealed ADTs, enums, `Option`, and `Either` is normal typed elimination, not a smell.
- Flag wildcard cases on closed domain ADTs only when a new state could be silently mishandled.
- Flag boolean/option/sentinel combinations or partially populated domain models only when the changed contract makes a concrete invalid state reachable.

### Preserve domain error and dependency evidence in ZIO signatures

- Flag a changed domain-facing ZIO API that collapses known recoverable alternatives into `Throwable`, defects, strings, or an undifferentiated error when callers lose a concrete recovery decision.
- Flag removal of a required domain capability from `R` only when the implementation now obtains it through hidden global/ambient state rather than an explicit Layer/environment boundary.
- `ZIO[R, E, A]` documents typed failures only; it does not prove absence of defects or interruption. Do not claim otherwise.
- Reviewer 02 owns retries, defects, resource safety, interruption, concurrency, streams, logging, and operational error handling. Do not report those here.

### Keep dependencies and dispatch explicit

- In tests, flag static/singleton/classloader replacement only when it mocks implementation detail and can bypass the behavior claimed by the test. Prefer an established service, layer, or client seam.
- Flag runtime reflection, structural/dynamic access, string-keyed service lookup, or class-name dispatch only when the changed code has a closed typed alternative and the late runtime failure or unhandled case is concrete. Do not flag a genuine plugin/dynamic-schema boundary.
- Compile-time `Mirror` or quoted derivation is not runtime reflection; review its generated contract instead.

### Preserve collection contracts

- Report only when changed collection composition obscures a required result, error, ordering, or bulk boundary. Reviewer 02 and backing-store specialists own I/O, batching, scheduling, parallelism bounds, streams, and datastore-specific mechanics.

## Ownership Boundaries

- Reviewer 01 owns effective compiler/Scalafix rules, Scala 3.8 mechanics and desugaring, and local partiality/correctness. Report one of those here only when it also creates a distinct functional-design/evidence defect.
- Reviewer 02 owns ZIO runtime semantics and operational performance; reviewer 04 owns only domain error/dependency evidence and hidden input/effect boundaries.
- Reviewer 03 owns module boundaries and serialization wire compatibility; reviewer 04 owns representation leakage beyond the serialization boundary.
- Reviewer 11 owns general assertions, fixtures, cleanup, and coverage quality; reviewer 04 owns tests that replace the wrong dependency seam.

Do not duplicate another specialist's finding. If one changed line has both consequences, report the anti-slop consequence distinctly or leave the issue to the specialist with the more specific contract.

## Common False Positives

Do not report:

- exhaustive matching over a sealed ADT
- widening to a meaningful domain trait
- framework-required `Any`/`Matchable`/generic infrastructure
- genuinely schemaless rows at their owner boundary
- a real ZIO dependency seam
- an invariant-centralizing helper
- a wildcard required for an open third-party hierarchy
- a narrow generated/interop suppression with concrete justification
- the absence of an enum, opaque type, given, extension method, `for` alias, or point-free syntax
- a service trait with one implementation
- an effectful adapter, application composition root, callback, boundary decoder, or normal `for` comprehension
- a boolean predicate whose caller only filters or branches
- a method-local, non-escaping mutable implementation that satisfies the proven-optimization exception, including its `PERFORMANCE:` and `REFERENCE PURE:` evidence
- a localized Java/reflection/generated-code match that immediately decodes an open value into a closed typed result or named error
- intentional unwrap/wrap operations in the owning opaque-type companion, codec, database mapper, or Java adapter
- unrelated legacy code

## Finding Format

For every finding include severity (`BLOCKER`, `SUGGESTION`, or `NITPICK`), confidence, causal changed `file:line`, the evidence discarded or assumption hidden, concrete impact, current code, and the smallest concrete correction. Include an affected unchanged location as supporting evidence when relevant. Report every issue at confidence >=50 without stylistic or speculative filler.
