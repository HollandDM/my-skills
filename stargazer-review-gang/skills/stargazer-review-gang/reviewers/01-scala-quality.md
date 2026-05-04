# Reviewer: Scala Quality

**Scope:** All code (frontend, backend, shared)
**Model:** standard

Scala quality reviewer for Stargazer codebase. Sections 1-4 mechanical pattern scans (banned syntax, formatting). Sections 5-9 evaluate Scala 3 idioms, type design, performance patterns.

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. Do NOT use Bash tool for compilation
> or linting. Analyze code **by reading files only**. If unsure, report as `[NITPICK]`, not `[BLOCKER]`.

---

## 1. Banned Syntax

Scan for these patterns. Each severity `[BLOCKER]`. Only flag Scala keyword/call,
not occurrences inside strings, comments, unrelated identifiers.

| What to find | Rule | Fix |
|-------------|------|-----|
| `var ` as keyword (not inside string/comment, not part of another word) | DisableSyntax.var | `val` or ZIO `Ref`. OK inside `// scalafix:off` blocks |
| `null` as keyword (not `"null"` in string, not `nullable`) | DisableSyntax.null | `Option[T]` |
| `return ` as keyword | DisableSyntax.return | Remove; last expression is the result |
| `while ` / `while(` as keyword | DisableSyntax.while | Tail recursion, `.map`, or ZIO |
| `implicit ` as keyword | DisableSyntax.implicit | `given` / `using` |
| `.asInstanceOf[` | DisableSyntax.asInstanceOf | Pattern matching |
| `.isInstanceOf[` | DisableSyntax.isInstanceOf | Pattern matching with `TypeTest` |
| `println(` / `printf(` as standalone calls | Regex rule | `ZIO.logInfo()` or `scribe` |
| `System.out.print` | Regex rule | `ZIO.logInfo()` |
| `ZIO.foreachPar` (not `ZIOUtils.foreachPar`) | Regex rule | `ZIOUtils.foreachPar` |
| `[+` or `[-` in type parameter position | DisableSyntax.covariantTypeParam | Invariant type params |
| `override def finalize` | DisableSyntax.finalize | `ZIO.scoped` |
| `scalastyle` in comments | Regex rule | Remove |

---

## 2. Suppression Checks

If find `// scalafix:off`:
1. Verify matching `// scalafix:on` below
2. Flag any suppression lacking comment explaining **why**

---

## 3. Mechanical Anti-Patterns

| Pattern | Rule | Fix |
|---------|------|-----|
| `.collect{...}.head` | CollectHead | `.collectFirst{...}.get` or handle None |
| `.collect{...}.headOption` | CollectHeadOption | `.collectFirst{...}` |
| `.sorted.head` / `.sorted.last` | UnnecessarySort | `.min` / `.max` |
| `val ` inside case class parameter list | RedundantCaseClassVal | Remove `val` keyword |

---

## 4. File Header

Every `.scala` file must start with:
```
// Copyright (C) 2014-2026 Anduin Transactions Inc.
```

---

## 5. Type Definitions: case class, sealed trait, enum, abstract class

Pick right type construct for job.

### Case Class vs Class

```scala
// GOOD: final case class for data or services with DI
final case class GetEmailTemplateParams(
  fundSubId: FundSubId, lpIdOpt: Option[FundSubLpId]
) derives JsoniterCodec.WithDefaultsValue

// GOOD: final class for stateful services (no copy/equality needed)
final class SchedulableActionRegistry(actions: Map[String, SchedulableAction])

// ISSUE: non-final case class / bare class when final case class is better
```

| Construct | Use for | Why |
|-----------|---------|-----|
| `final case class` | Data (DTOs, params, configs, domain models), services with DI | Free `copy`, `equals`, `hashCode`, pattern matching, constructor injection |
| `final class` | Stateful services, registries, mutable wrappers | No misleading `copy`/`equals` when identity matters over structure |
| `class` (non-final) | Almost never -- only for framework extension points | Prefer `final` by default; open classes invite fragile inheritance |

Flag:
- Non-final `case class` -- always use `final case class`
- Bare `class` could be `final case class` (immutable data, no inheritance need)
- `final class` holding only immutable data with no mutation -- consider `final case class` instead

### Sealed Trait vs Enum

```scala
// GOOD: enum for closed, fixed set of values
enum OrchestrationError {
  case InvalidInput(message: String)
  case ValidationFailed(rule: String, details: String)
}

// GOOD: sealed trait when variants have different shapes
sealed trait EngagementId derives CanEqual, JsoniterCodec.WithDefaultsAndTypeNameValue
object EngagementId {
  final case class FundSub(fundSubId: FundSubId) extends EngagementId
  case object Unrecognized extends EngagementId
}
```

| Construct | Use for | Why |
|-----------|---------|-----|
| `enum` | Closed set of values, string/int enumerations, simple ADTs | Concise syntax, built-in `values`/`valueOf`/`ordinal`, Java interop |
| `sealed trait` | ADTs where variants carry different data shapes, need shared methods, or need nested hierarchies | More flexible -- variants can be full case classes with independent fields |

Flag:
- Sealed trait where all variants are case objects -- should be `enum`
- Sealed trait where all variants have same field shape -- consider `enum` with parameters
- `enum` trying to extend another enum (not supported) -- use sealed trait hierarchy

### Abstract Class vs Trait

```scala
// GOOD: abstract class for infrastructure bases
abstract class AuthenticatedEndpointServer extends EndpointServer {
  protected def authorizationService: AuthorizationService
}
// GOOD: trait for cross-cutting mixins
trait EnvironmentValidationEndpointServer { self: AuthenticatedEndpointServer => }
```

| Construct | Use for | Why |
|-----------|---------|-----|
| `abstract class` | Base infrastructure/framework classes, Java interop bases | Single inheritance, cleaner Java interop, can have constructor params |
| `trait` | Mixins, cross-cutting concerns, capabilities, multi-composition | Multiple inheritance, stackable composition |
| `sealed trait` | ADT hierarchies (see above) | Exhaustive pattern matching |
| `sealed abstract class` | Rarely -- sealed ADTs needing Java interop or constructor params | Slightly better JVM performance, cleaner Java interop |

Flag:
- Abstract class used as mixin (should be trait -- abstract class blocks other inheritance)
- Trait used as base when Java interop needed (abstract class safer for Java callers)
- Deep inheritance chains (3+ levels) -- prefer composition over inheritance

---

## 6. Opaque Types, Type-Safe Wrappers & AnyVal

Opaque types = Scala 3 zero-cost abstraction for type safety. Compile away entirely at
runtime -- no boxing, no wrapper objects. Codebase use them extensively for IDs. **Actively
recommend** introducing opaque types where raw primitives used for domain concepts.

### Opaque Type vs AnyVal

| Construct | Use for | Trade-off |
|-----------|---------|-----------|
| `opaque type` | IDs, keys, domain strings/longs, most wrappers | Zero cost but invisible at runtime -- no `isInstanceOf`, no `ClassTag` |
| `extends AnyVal` | Types needing runtime pattern matching, custom `equals`/`toString`, or Java interop as real class | Real class at runtime but boxes in generics and collections |

### When to Recommend Opaque Types

Recommend for: IDs (`*Id`/`*id` typed as `String`/`Long`/`UUID`), domain quantities (amounts,
percentages, timestamps), constrained strings (emails, URLs, slugs), external keys.

Don't recommend for: truly generic strings (log messages, display names), one-off locals that
never cross function boundaries, parameters from external APIs where raw type is contract.

### Complete Companion Pattern

Every opaque type companion should have essential members. Missing pieces = review finding.

```scala
opaque type DocumentStorageId = String

object DocumentStorageId {
  def apply(id: String): DocumentStorageId = id
  def unsafe(str: String): DocumentStorageId = str
  extension (id: DocumentStorageId) { def value: String = id }
  given CanEqual[DocumentStorageId, DocumentStorageId] = CanEqual.derived
  // When used in APIs/storage:
  given JsonValueCodec[DocumentStorageId] =
    JsoniterCommonCodecs.stringCodec[DocumentStorageId](_.value, DocumentStorageId(_))
}
```

### Companion Completeness Checklist

| Required | When |
|----------|------|
| `apply` / `unsafe` | Always |
| `extension` with `.value` | Always |
| `CanEqual` given | Always |
| `JsonValueCodec` | If serialized to/from JSON |
| `JsonKeyCodec` | If used as `Map` key in JSON |
| `TypeTest` | If pattern matched with `match` |
| `Ordering` | If sorted or compared with `<`/`>` |

Flag:
- Raw `String`/`Long`/`Int` parameters named `*Id`/`*id` -- recommend opaque type (or AnyVal if runtime matching needed)
- Raw primitives representing domain concepts (amounts, percentages, keys) -- recommend opaque type
- New `extends AnyVal` where runtime type identity not needed -- suggest opaque type
- Opaque type used with `isInstanceOf`/`ClassTag`/runtime match -- won't work, suggest AnyVal
- Opaque types missing `CanEqual` -- almost always needed
- Opaque types missing `.value` extension -- blocks extraction outside companion
- Opaque types used in JSON APIs missing `JsonValueCodec`
- Opaque types used as Map keys missing `JsonKeyCodec`

---

## 7. Given / Using & Contextual Abstractions

Scala 3 replaced overloaded `implicit` keyword with purpose-specific features. Section 1
catches raw `implicit` usage. This section ensures code uses **correct Scala 3 replacement**.

### Scala 2 -> Scala 3 Migration Map

| Scala 2 (old) | Scala 3 (use this) | Purpose |
|----------------|---------------------|---------|
| `implicit val x: T = ...` | `given T = ...` | Provide a typeclass instance |
| `implicit object X extends T` | `given X: T with { ... }` | Named typeclass instance with body |
| `implicit def f(using ...): T` | `given (using ...): T = ...` | Parameterized/derived instance |
| `implicit def f(x: A): B` | `given Conversion[A, B] = ...` | Implicit conversion (use sparingly) |
| `implicit class C(x: A) { ... }` | `extension (x: A) { ... }` | Add methods to existing types |
| `def f(implicit x: T)` | `def f(using x: T)` | Context parameter |
| `implicitly[T]` | `summon[T]` | Summon an instance from context |

### Given Instances

```scala
// GOOD: anonymous given in companion -- auto-discovered
object FundSubId { given JsonValueCodec[FundSubId] = ... }

// GOOD: named given -- only when you need to reference it by name
object MyModule { given defaultOrdering: Ordering[Priority] = Ordering.by(_.weight) }
```

Flag:
- Named `given` when name never referenced -- use anonymous `given T = ...`
- `given` at package/top level with broad scope -- prefer companion object scoping
- `given Conversion[A, B]` without strong justification -- prefer explicit conversion or extension methods

### Extension Methods

```scala
// SCALA 3: extension method replaces implicit class
extension (s: String) { def toUserId: UserId = UserId(s) }
```

Flag:
- `implicit class` -- should be `extension` method in Scala 3
- Extension methods doing implicit conversion in disguise -- prefer explicit calls

### Using Clauses

```scala
// GOOD: using clause (named when referenced, anonymous when passed through)
def encode[A](value: A)(using codec: JsonValueCodec[A]): String = writeToString(value)(codec)
def encode[A](value: A)(using JsonValueCodec[A]): String = writeToString(value)
// GOOD: context bound shorthand
def encode[A: JsonValueCodec](value: A): String = writeToString(value)
```

Flag:
- `implicit` parameter lists -- should be `using`
- Named `using` parameter never referenced in body -- make anonymous
- `implicitly[T]` -- should be `summon[T]`

### Given Imports

Use `import foo.given` to import given instances. `import foo.*` does NOT import givens in Scala 3.

Flag:
- Missing `import ...given` when given instances from another scope needed
- Relying on `import foo.*` to bring in givens -- need `import foo.given`

---

## 8. Scala Performance Patterns

Flag these common pitfalls when spotted.

| Bad | Good | Why |
|-----|------|-----|
| `.size == 0` / `.length == 0` | `.isEmpty` | Avoids full traversal |
| `.size > 0` / `.length > 0` | `.nonEmpty` | Avoids full traversal |
| `.map(f).flatten` | `.flatMap(f)` | One pass, no intermediate collection |
| `.filter(p).map(f)` | `.collect { case x if p(x) => f(x) }` | One pass |
| `foldLeft(List()) { acc ++ x }` | `.flatMap(f)` or prepend + reverse | O(n) vs O(n^2) |
| `.isDefined` + `.get` | `.foreach` / `match` / `.fold` | Safe, no double lookup |
| `.get` on Option | `.getOrElse` / `.fold` | No `NoSuchElementException` |
| `"a" + "/" + "b"` | `s"$a/$b"` | Clearer, same performance |
| `.toList` on a `List` | Remove redundant conversion | No-op allocation |
| `.contains` on `List` in loop | Convert to `Set` first | O(1) vs O(n) lookup |
| `.sortBy(_.field).reverse` | `.sortBy(v => -v.field)` | Negate in sort key directly — avoids extra list reversal allocation |

**Lazy evaluation:** Use `.view` or `.iterator` when chaining 3+ collection operations on large data
to avoid intermediate collections.

**`.copy()` in tight loops:** Fine for small collections, flag on large datasets -- allocates per
iteration. Consider mutable builder internally if performance matters.

---

## 9. Inline Usage

Scala 3 `inline` eliminates method call and lambda allocation overhead at compile time.
Most impactful on **higher-order methods with small function bodies** -- each call site gets
body inlined directly, avoiding anonymous class allocation.

### Inline Higher-Order Methods (lambda elimination)

```scala
// GOOD: inline method + inline function param = zero-cost lambda
inline def map[B](inline f: A => B): Maybe[B] =
  if isEmpty then Absent else f(get)

inline def flatMap[B](inline f: A => Maybe[B]): Maybe[B] =
  if isEmpty then Maybe.empty else f(get)

inline def fold[B](inline ifEmpty: => B)(inline ifDefined: A => B): B =
  if isEmpty then ifEmpty else ifDefined(get)
```

**How it works:** `maybe.map(x => x + 1)` inlines to `if maybe.isEmpty then Absent else maybe.get + 1`
-- no `Function1` allocation, no virtual dispatch.

**When to apply:** Methods on frequently-instantiated types (Option-like wrappers, Result types),
combinators in tight loops (`map`, `flatMap`, `fold`, `filter`, `foreach`), small bodies only.

### When NOT to inline

- Methods with large bodies (>10 lines) -- bytecode bloat, hurts JIT optimization
- Methods where function parameter does IO (network, DB, file) -- IO cost dwarfs lambda cost
- Public API methods where inlining leaks implementation details across module boundaries
- `transparent inline` not used in this codebase -- flag if introduced without justification

Flag:
- Higher-order methods on hot-path types with small bodies that could benefit from `inline`
- `inline` on methods with large bodies (>10 lines) -- bytecode bloat risk
- `inline` on IO-heavy methods where lambda allocation negligible
- Missing `inline` on function parameters when method already `inline` (both should be inline)
- `val fn: A => B = ...` in hot paths (loops, reactive callbacks) -- use `inline def` (zero
  allocation) or `def` (compiler hoists to method) instead of val lambda (allocates `Function1`)

---

## Diff-Bound Rule

Only flag issues on lines **added or modified in the diff**. Don't critique pre-existing code author didn't touch. If pre-existing code has genuine safety issue, mention as `[NOTE]` only, not blocker or suggestion. If can't identify exact line number from diff, don't report.

## Output Format

For each issue found, report:
- **File**: path
- **Line**: number (if identifiable)
- **Severity**: `[BLOCKER]`, `[SUGGESTION]`, or `[NITPICK]`
- **Confidence**: 0–100 (90+ certain, 70–89 strong signal, 50–69 suspicious, <50 don't report)
- **Rule**: rule name (from tables above) or pattern name (from sections 5-9)
- **Issue**: what's wrong and why it matters
- **Current code**: fenced code block showing actual code from file (3-5 lines context)
- **Suggested fix**: fenced code block with concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, AND nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings without code blocks rejected by aggregator.

Only report actual violations. No praise, no summaries, no filler.
Skip anything inside string literals or comments (except `scalastyle` comment check).

---

# Section: Code Health Checks (merged from code-health)

# Reviewer: Code Health — Reuse, Quality & Efficiency

**Scope:** All code (frontend, backend, shared)
**Model:** standard

Code health reviewer for Stargazer codebase. Catch duplicated functionality,
hacky patterns, inefficient code at application logic level. NOT checking
Scala syntax (reviewer 1), ZIO patterns (reviewer 2), or framework-specific idioms (reviewers 5-11)
— check whether code well-structured, avoids reinventing existing utilities,
does work efficiently.

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. Do NOT use Bash tool for compilation
> or linting. Analyze code **by reading files only**. If unsure, report as `[NITPICK]`, not `[BLOCKER]`.

---

## 1. Code Reuse

For each changed file, **search for existing utilities and helpers** that could replace newly
written code. Common locations: `**/utils/**`, `**/common/**`, `**/shared/**`, companion objects,
files adjacent to changed ones.

### What to search for

| New code pattern | Search for | Where to look |
|-----------------|-----------|---------------|
| Hand-rolled string manipulation | `StringUtils`, extension methods on `String` | `**/utils/**`, `**/common/**` |
| Manual collection transformations | Utility methods in companion objects, `CollectionUtils` | Adjacent files, `**/utils/**` |
| Custom retry/timeout/scheduling logic | `ZIOUtils`, `Schedule` combinators | `**/zio/utils/**` |
| Manual JSON encoding/decoding | `JsoniterCodec`, existing codec derivations | Companion objects of types |
| Custom error construction | `GeneralServiceException`, domain error types | `**/errors/**`, `**/exceptions/**` |
| Ad-hoc ID generation/parsing | Opaque type companions with `apply`/`unsafe` | Companion objects |
| Manual resource cleanup | `ZIO.acquireRelease`, `ZIO.scoped` | `**/utils/**` |
| Custom date/time formatting | Existing formatters, `TimeUtils`, `DateUtils` | `**/utils/**`, `**/common/**` |
| Manual config reading | Existing config case classes, `ZLayer` providers | `**/config/**` |

### How to search

1. Read new/changed code to understand what it does
2. Use Grep/Glob to search for similar function names, type signatures, or patterns
3. Check module's own utils/common directories first, then cross-module shared code
4. If Scala intelligence tools available, use them to find related definitions

### Flag when

- New function duplicates existing functionality — suggest existing function instead
- Inline logic reimplements utility already exists in codebase
- Helper created in local scope when broadly useful version already exists elsewhere
- Code copies logic from another file with minor variations instead of extracting shared function

**Severity:** `[SUGGESTION]` — unless existing utility has better error handling or edge case
coverage, then `[BLOCKER]` (new code may silently miss cases utility handles).

---

## 2. Code Quality

### 2a. Redundant State

Flag state that duplicates or can be derived from existing state:

| Pattern | Issue | Fix |
|---------|-------|-----|
| `Ref` mirroring another `Ref` | Redundant state — will drift | Derive from source of truth |
| Cached value computable from existing state | Extra state to maintain | Compute on access, or use `ZIO.memoize` |
| Separate "loading" flag alongside loaded data | `Option`/`Either` already encodes this | Use `Option[Data]` — `None` means loading |

### 2b. Parameter Sprawl

Flag functions where parameters keep growing instead of being restructured:

```scala
// BAD: parameter sprawl — grew organically, hard to call correctly
def processDocument(
  docId: DocumentId, fundSubId: FundSubId, lpId: Option[FundSubLpId],
  includeAttachments: Boolean, format: String, retryCount: Int,
  timeout: Duration, notifyOnComplete: Boolean
): Task[Document]

// GOOD: group related params into case classes
final case class ProcessDocumentParams(
  docId: DocumentId, fundSubId: FundSubId, lpId: Option[FundSubLpId]
) derives JsoniterCodec.WithDefaultsValue
final case class ProcessDocumentOptions(
  includeAttachments: Boolean = false, format: Format = Format.Default,
  retryCount: Int = 3, timeout: Duration = 30.seconds, notifyOnComplete: Boolean = false
)
def processDocument(params: ProcessDocumentParams, options: ProcessDocumentOptions = ProcessDocumentOptions()): Task[Document]
```

Flag when:
- Function gains new `Boolean` or `String` parameter in diff — often sign of parameter sprawl
- Function has 5+ parameters of same type (easy to mix up positionally)
- Multiple functions take same cluster of parameters — extract params case class

### 2c. Copy-Paste with Slight Variation

Flag near-duplicate code blocks that should be unified:

- Two or more code blocks with same structure but different field names or types
- Pattern: same control flow, same error handling, different entity — extract generic function
- Repeated match/case blocks with identical structure across different ADTs

**How to detect:** When reviewing changed file, search for distinctive parts of new code
(method names, error messages, log strings) in rest of file and adjacent files. If find
near-duplicates, flag them.

### 2d. Leaky Abstractions

| Pattern | Issue | Fix |
|---------|-------|-----|
| Service method returns internal types (`FDBRecord`, `Chunk[Byte]`) | Leaks storage/transport details | Return domain types, convert at boundary |
| Public method exposes implementation (`getFromFDB`, `queryPostgres`) | Callers coupled to storage choice | Name by intent (`getDocument`, `findUsers`) |
| Breaking existing abstraction boundary | Makes future changes harder | Keep internal details behind interface |

### 2e. Stringly-Typed Code

Flag raw strings used where type-safe alternatives exist:

| Pattern | Issue | Fix |
|---------|-------|-----|
| Raw `String` for known finite set of values | No compile-time safety | Use `enum` or `sealed trait` |
| String comparison (`== "active"`, `== "pending"`) | Typo-prone, no exhaustiveness check | Pattern match on enum variants |
| String keys in `Map[String, _]` for known keys | No type safety | Use case class or enum-keyed map |
| Magic strings passed between functions | Invisible contract | Define as `val` constant or opaque type |

**Note:** Reviewer 1 (Scala Quality) handles opaque type mechanics. This reviewer catches
higher-level smell of using strings where types should exist.

### 2f. Unnecessary Comments

Flag comments that add no value:

| Comment type | Example | Action |
|-------------|---------|--------|
| States what code does | `// increment counter` above `counter += 1` | Delete |
| Narrates change | `// Added for JIRA-1234` | Delete (use git blame) |
| References caller/task | `// Called by processDocument` | Delete (use find-usages) |
| Commented-out code | `// val oldImpl = ...` | Delete (use git history) |
| Redundant ScalaDoc | `/** Gets the name. */ def getName` | Delete |

**Keep:** comments explaining **why** — hidden constraints, subtle invariants, workarounds for
known issues, non-obvious performance reasons.

---

## 3. Efficiency

### 3a. Unnecessary Work

| Pattern | Issue | Fix |
|---------|-------|-----|
| Same value computed multiple times in method | Wasted CPU | Extract to `val` |
| Same ZIO effect executed multiple times | Redundant I/O | Execute once, reuse result |
| Repeated collection traversals | Multiple passes | Combine into single `foldLeft` or `map` |
| N+1 queries (loop calling DB/service per item) | O(n) round trips | Batch query, then join in memory |
| Re-reading file/resource already available | Redundant I/O | Pass result through |

### 3b. Missed Concurrency

Flag independent operations run sequentially that could run in parallel:

```scala
// BAD: sequential when independent
for {
  users    <- fetchUsers(orgId)
  settings <- fetchSettings(orgId)
  roles    <- fetchRoles(orgId)
} yield combine(users, settings, roles)

// GOOD: parallel since they're independent
(fetchUsers(orgId) zipPar fetchSettings(orgId) zipPar fetchRoles(orgId))
  .map { case ((users, settings), roles) => combine(users, settings, roles) }
```

Flag when:
- For-comprehension steps don't depend on prior results
- Sequential `.flatMap` chains where effects use different inputs
- Multiple service calls in handler that could be `zipPar`

### 3c. Hot-Path Bloat

Flag new blocking or expensive work added to:
- Application startup / `ZLayer` construction
- Per-request handler paths (endpoint handlers, middleware)
- Per-render paths (Laminar `Signal` / `EventStream` combinators, scalajs-react render methods)
- Event listeners and observers that fire frequently

### 3d. Recurring No-Op Updates

Flag unconditional state updates in loops or event handlers:

```scala
// BAD: fires update even when value hasn't changed
eventStream.foreach(event => stateVar.set(event.value))

// GOOD: only update when changed
eventStream.foreach(event =>
  if (stateVar.now() != event.value) stateVar.set(event.value)
)
```

Also flag:
- `Ref.set` / `Ref.update` inside polling loops without change detection
- Observers that unconditionally propagate — downstream re-renders on every tick

### 3e. Overly Broad Operations

| Pattern | Issue | Fix |
|---------|-------|-----|
| `.runCollect` on large/unbounded stream | OOM risk | `.take(n)`, `.runFold`, `.runDrain` |
| Reading entire file when only header/section needed | Wasted I/O | Read with offset/limit |
| Loading all records then filtering in memory | Wasted DB/network | Filter in query |
| `Glob("**/*.scala")` when target directory known | Slow scan | Narrow glob path |

### 3f. Memory

| Pattern | Issue | Fix |
|---------|-------|-----|
| Unbounded collection growth (`ListBuffer` appended in loop without bound) | OOM | Use bounded buffer or stream |
| Missing cleanup in `ZIO.scoped` / `acquireRelease` | Resource leak | Add release handler |
| Holding references to large objects longer than needed | GC pressure | Null out or scope tightly |
| `var` accumulator in concurrent context | Race condition + leak | Use `Ref` with bounded update |

---

## Diff-Bound Rule

Only flag issues on lines **added or modified in the diff**. Don't critique pre-existing code
author didn't touch. If pre-existing code has genuine issue, mention as `[NOTE]` only, not
as blocker or suggestion. If can't identify exact line number from diff, don't
report.

**Exception for code reuse (Section 1):** You MAY search broader codebase for existing utilities
to compare against newly added code. But **finding** must still be about new code in
diff — "this new function duplicates existing `X`", not "existing `X` should be refactored".

## Output Format

For each issue found, report:
- **File**: path
- **Line**: number (if identifiable)
- **Severity**: `[BLOCKER]` (duplicates existing utility with better error handling, N+1 query, OOM risk), `[SUGGESTION]` (reuse opportunity, quality/efficiency improvement), `[NITPICK]` (minor cleanup, unnecessary comment)
- **Confidence**: 0-100 (90+ certain, 70-89 strong signal, 50-69 suspicious, <50 don't report)
- **Rule**: section reference (e.g., "1. Code Reuse", "2c. Copy-Paste", "3b. Missed Concurrency")
- **Issue**: what's wrong and why it matters
- **Current code**: fenced code block showing actual code from file (3-5 lines context)
- **Suggested fix**: fenced code block with concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, AND nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings without code blocks rejected by aggregator.

Only report actual violations. No praise, no summaries, no filler.