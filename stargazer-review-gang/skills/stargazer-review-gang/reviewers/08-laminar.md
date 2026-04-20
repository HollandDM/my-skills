# Reviewer: Laminar & Airstream Patterns

**Scope:** Frontend only (js/) — Laminar/Airstream reactive code
**Model:** standard

Laminar/Airstream reactive patterns reviewer for Stargazer codebase.

**Output style:** Caveman mode — drop articles/filler/pleasantries. Fragments OK. Technical terms + code exact. Review subscription lifecycle, signal reactivity, split operators, stream flattening, component structure, performance in reactive chains. No Laminar/Airstream code present → report "Clean — no Laminar code to review."

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`, `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. No Bash tool for compilation/linting. Analyze code **by reading files only**. Unsure → report `[NITPICK]`, not `[BLOCKER]`.

---

## 1. Framework Choice

Laminar + Airstream = standard for new frontend modules. scalajs-react = legacy — maintain existing React, new features use Laminar.

Flag:
- New modules/components using scalajs-react instead of Laminar
- Mixed React + Laminar in same component without established bridge pattern (`WrapperR` to embed Laminar in React, `SignalReactor` / `OneTimeOwner` for React-to-Airstream)

## 2. Subscription Lifecycle & Memory Leaks

Most common, hardest-to-debug frontend bug class. `-->` operator binds subscription to **DOM element's lifecycle** — activates on mount, cleans up on unmount. Only works when `-->` binding is direct modifier of stable element.

### Subscriptions inside reactive transformations — THE CRITICAL BUG

`-->` bindings inside `.map()`, `child <--`, or any reactive transformation get **re-created every parent signal emit**. Previous subscriptions leak — old element discarded without proper unmount, new subscription binds to stale scope.

```scala
// DANGEROUS: subscriptions inside .map() — leaked on every signal change
child <-- formModelSignal.map { formModel =>
  renderForm(formModel)
    .amend(
      saveStream --> Observer.empty,           // Re-subscribed every emission!
      eventBus.events --> someObserver          // Previous subscription leaks!
    )
}

// SAFE: move subscriptions to the render() level (stable element)
def render(): HtmlElement = div(
  child <-- formModelSignal.map(renderForm),   // Only DOM changes inside .map()
  saveStream --> Observer.empty,                // Bound to root div's lifecycle
  eventBus.events --> someObserver              // Activates once on mount, cleans up on unmount
)
```

Rule: **`-->` bindings go on stable elements (render level), never inside reactive transformations**. Subscription needs signal value → make subscription reactive via `.withCurrentValueOf()` or `.sample()` instead of nesting inside `.map()`.

Flag:
- `-->` bindings inside `.map()`, `child <--`, `children <--`, or `splitOption` render functions creating side-effectful subscriptions (not just DOM structure)
- `.foreach` on Signal/EventStream not scoped to component lifecycle — use `-->` operator
- `addEventListener` without removal — use Laminar event handlers
- Subscriptions in `onMountCallback` without cleanup in unmount
- Missing `OneTimeOwner` / `.kill()` cleanup when bridging Airstream into React components
- Static values captured in closures inside reactive transformations when they should be reactive signals (value never updates after initial capture)

## 3. Component Structure

Components should extend `LaminarComponent` (from `anduin.frontend.base`) — provides lifecycle management, `.element` lazy val, implicit `RenderableNode`, `.testId()` for E2E testing.

Flag:
- Reusable components not extending `LaminarComponent` or `LaminarComponentWithChildren`
- Public `Var` without public `Signal` getter — expose read-only `Signal`, keep `Var` private
- Passing `Var` directly to child components — pass `Signal` + `Observer` separately for clear read/write boundaries

## 4. Signal Reactivity & `.now()` / `.distinct`

`.now()` reads imperatively — safe in event handlers but **breaks reactivity** in signal definitions.

Flag:
- `.now()` inside `Signal.fromValue`, `signal.map`, or `combineWithFn` — use signal composition
- `.now()` + `.set()` instead of `.update()` for atomic Var modifications
- Missing `.distinct` on derived `Signal[Primitive]` (String, Boolean, Int, Double) — causes redundant re-renders when parent changes but derived value same
- Missing `.distinct` before `.map` when conditional-rendering from `Signal[Boolean]`
- `signal.updates` called multiple times (it's `def`, not `lazy val` — each call creates new stream)

## 5. Split Operators for Efficient Rendering

Split operators = **primary rendering pattern** for dynamic data. Project callback runs **once per key** — subsequent updates emit on provided signal, reusing DOM element. Always prefer split over `.map` for rendering.

### splitSeq — List rendering (most common, 70+ usages)

Renders list efficiently by keying each item. Callback fires once per unique key; `keyedSignal` updates when that item changes.

```scala
children <-- itemsSignal.splitSeq(_.id) { keyedSignal =>
  renderItem(keyedSignal.key, keyedSignal)
}

// Var.splitSeq: writable — updates propagate to parent Var
todosVar.splitSeq(_.id) { case todoVar varWithKey id =>
  checkbox(
    checked <-- todoVar.signal.map(_.done),
    onClick --> Observer { _ => todoVar.update(_.copy(done = !_.done)) }
  )
}
```

### splitOption — Optional value rendering

Renders `Signal[Option[A]]` efficiently. Callback runs only on `None -> Some` transition; subsequent `Some(a) -> Some(b)` reuse element, update inner signal.

```scala
child.maybe <-- userOptSignal.splitOption(userSignal => renderUser(userSignal))

// With fallback via someOrElse
child <-- errorOptSignal
  .splitOption(errSignal => div(tw.textRed6, text <-- errSignal))
  .someOrElse(emptyNode)
```

### splitMatchOne/splitMatchSeq — Pattern matching on signal values (20+ usages)

Pattern-matches on signal values with three chain methods, each memoized independently — switching between cases reuses elements. Always terminated with `.toSignal`.

**handleType** — match on sealed trait subtypes (most common). Callback receives `KeyedStrictSignal` of matched subtype:

```scala
child <-- fieldChangeEventSignal.splitMatchOne
  .handleType[FieldChangeEvent.EditFieldValue] { keyedSignal =>
    renderEditFieldValue(keyedSignal.toSignal)
  }
  .handleType[FieldChangeEvent.RemoveRepeatableSet] { keyedSignal =>
    renderRemoveRepeatableSet(keyedSignal.toSignal)
  }
  .toSignal
```

**handleValue** — match specific values (enums, singletons). Callback receives unit signal since value already known. **handleCase** — custom pattern matching with extraction, takes extractor partial function and renderer. Both mix with `handleType` in same chain. Use catch-all `handleCase` at end for exhaustiveness when not all cases covered.

### Other split operators

- **splitBoolean** — Two-way branching (`whenTrue`/`whenFalse`), each branch memoized
- **splitSeqByIndex** — Position-sensitive lists (no natural key), e.g. repeatable form fields
- **splitNonEmpty** — Empty vs non-empty collection (custom, AirStreamUtils)
- **splitBySize** — 0/1/many branching on collection size (custom, AirStreamUtils)
- **splitEithers / splitNonEmptyEithers** — Splits `Signal[CC[Either[A, B]]]` into left/right renderings
- **splitTaskResult** — Splits `Status[Input, Try[Output]]` from `mapTask` into loading/success/failure branches

### Flag

- `.map(_.map(render))` on `Signal[List[_]]` — use `splitSeq`. Recreates ALL DOM elements on every list change instead of only updating changed item
- `.map(_.map(render))` on `Signal[Option[_]]` — use `splitOption`. Element recreated on every `Some(a) -> Some(b)` instead of reused
- `if/else` or `match` on `Signal[Boolean]` inside `.map` — use `splitBoolean`
- Manual `match` on sealed traits inside `.map` — use `splitMatchOne` with `handleType`/`handleValue`/`handleCase`
- `splitMatchOne` chain missing catch-all `handleCase` when not all cases covered — risks runtime error
- `handleCase` used for simple subtype matching when `handleType` is cleaner
- `handleCase` used for simple value matching when `handleValue` is cleaner
- Split keys not stable (generated on each render, like `Random.nextInt` or `.hashCode`)
- `.now()` inside split render callback — use provided signal parameter instead
- `splitSeqByIndex` when items have natural IDs — use `splitSeq(_.id)` for stable identity
- Missing `Var.splitSeq` (writable, updates propagate to parent) vs `Signal.splitSeq` (read-only) — use `Var.splitSeq` when child needs to write back
- Nested `.splitSeq` creating subscriptions (see Section 2) — inner split on `.map()` derived signal fine, but `-->` bindings inside split callbacks need careful lifecycle scoping
- `child <-- signal.map { ... => Component(isChecked = Val(derived), ...)() }` when component accepts `Signal[A]` props — pass derived signal directly into prop instead:
  ```scala
  // BAD: recreates Component DOM element on every signal emission
  child <-- selectedSignal.map { selected =>
    CheckboxL(isChecked = Val(selected.contains(item)), onChange = observer)()
  }
  // GOOD: pass derived signal directly — component handles reactivity internally
  CheckboxL(isChecked = selectedSignal.map(_.contains(item)), onChange = observer)()
  ```
  Avoids unnecessary DOM element recreation, lets component manage own reactivity.
- `child <-- signal.map { value => div(staticStructure, span(value.name), ...) }` when DOM structure static and only text/attribute values change — keep structure stable, use `text <--` or signal-as-prop for dynamic parts:
  ```scala
  // BAD: recreates entire subtree on every emission
  child <-- itemSignal.map { item =>
    div(
      span(tw.fontBold, item.title),
      p(item.description),
      span(tw.textGray6, item.status)
    )
  }
  // GOOD: stable structure, only values are reactive
  div(
    span(tw.fontBold, text <-- itemSignal.map(_.title)),
    p(text <-- itemSignal.map(_.description)),
    span(tw.textGray6, text <-- itemSignal.map(_.status))
  )
  ```
  `child <-- signal.map { div(...) }` destroys and recreates entire DOM subtree on every signal emission. Structure fixed + only values change → keep elements stable, bind only dynamic parts with `text <--` or signal-as-prop.

## 6. Stream Flattening Strategy

Airstream disables generic `flatMap` — always use explicit strategy:

- **`flatMapSwitch`** — cancels previous stream. Use for: search input, navigation, any "latest only" scenario
- **`flatMapMerge`** — all streams run concurrently. Use for: independent actions (approvals, batch operations)

Flag:
- `flatMapMerge` where only latest result matters (should be `flatMapSwitch`)
- `flatMapSwitch` for independent operations that should all complete (should be `flatMapMerge`)
- Branching outside `taskToStream` (creating `EventStream.fromValue`/`EventStream.empty`) — keep all logic inside single `taskToStream` call
- Pattern match with no-op fallback inside `flatMapSwitch` — use `.collect` to filter first

## 7. Task-to-Laminar Integration

Two conversion utilities in `AirStreamUtils`:

- **`taskToStream`** — lazy, cancellable on unsubscribe (preferred for long-running operations)
- **`taskToStreamEager`** — fires immediately via `ZIOUtils.runAsync`, subscription doesn't manage lifecycle

For task status tracking, use `mapTask` wrapping results in `Status[Input, Try[Output]]` (Pending/Resolved), render with `splitTaskResult`.

Flag:
- `Unsafe.unsafely` or `runtime.unsafe.run` in component code — use `taskToStream` / `ZIOUtils.runAsync`
- `taskToStreamEager` for cancellable operations (use `taskToStream`)
- Missing loading state tracking — use `mapTask` + `splitTaskResult` for Pending/Resolved handling
- API calls without `Toast.error()` or equivalent on failure

## 8. Signal Combination

Flag:
- `combineWith(...)` returning tuple when `combineWithFn(...)` with direct function is clearer
- Nested `.map` creating `Signal[Signal[T]]` — use `combineWithFn`
- `signal.combineWith(otherSignal)` inside `.sample()` / `.withCurrentValueOf()` — these accept multiple signals directly
- `varName.signal` appearing 2+ times without extraction to named val
- Missing `Var.set(a -> x, b -> y)` for atomic multi-Var updates (sequential `.set()` causes intermediate states)

## 9. Observer Conventions

Flag:
- Missing explicit `Observer[Type]` annotation on right side of `-->` when using data (e.g., `filterSignal --> Observer { filter => ... }` should be `Observer[Filter] { ... }`)
- Bare function on right side of `-->` instead of `Observer { ... }`

## 10. Lambda Allocation in Reactive Chains

Lambdas and closures inside `.map`, `.combineWith(...).map`, `.flatMapSwitch`, or any reactive callback **re-allocate every signal emission**. When lambda captures only stable values (not signal-derived), hoist out of reactive chain.

```scala
// BAD: allocates a new Function1 on every emission
signal.map { item =>
  val fn: ItemId => WrappedId = WrappedId(_)  // new closure each time
  fn(item.id)
}

// GOOD: def at enclosing scope — compiler hoists to static method
def wrapId(id: ItemId): WrappedId = WrappedId(id)
signal.map(item => wrapId(item.id))

// BAD: lambda as val inside reactive callback
child <-- dataSignal.map { data =>
  val transform: Data => View = renderView(_)  // re-allocated per emission
  transform(data)
}

// GOOD: def at method scope
def renderData(data: Data): View = renderView(data)
child <-- dataSignal.map(renderData)
```

Flag:
- `val fn: A => B = ...` or `val fn = (a: A) => ...` inside `.map` / `.combineWith` / reactive callbacks — should be `def` at enclosing scope
- Lambda capturing only stable values (not signal-derived) inside reactive chains — hoist to `def` or `val` at enclosing method/class scope
- Does NOT apply when lambda captures signal-derived values that change per emission — those must stay inside callback

## 11. Direct DOM Manipulation

Flag:
- DOM manipulation for visibility/styling — use signal-based conditional rendering
- DOM manipulation for input values — use `Var` binding / `controlled()`
- `document.getElementById` without `Option()` null check
- DOM access without `setTimeout(0)` when element might not exist yet
- Imperative event assignment (`element.onclick = ...`) — use Laminar event handlers

---

## Diff-Bound Rule

Only flag issues on lines **added or modified in diff**. Don't critique pre-existing code author didn't touch. Pre-existing code with genuine memory leak or broken reactivity → mention as `[NOTE]` only.

## Output Format

For each issue found, report:
- **File**: path
- **Line**: number (if identifiable)
- **Severity**: `[BLOCKER]` (memory leak, broken reactivity), `[SUGGESTION]` (wrong split/flatten strategy, missing error handling), `[NITPICK]` (style, convention, efficiency)
- **Confidence**: 0–100 (90+ certain, 70–89 strong signal, 50–69 suspicious, <50 don't report)
- **Issue**: what pattern is violated
- **Current code**: fenced code block showing actual code from file (3-5 lines context)
- **Suggested fix**: fenced code block with concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, AND nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings without code blocks rejected by aggregator.

Focus on memory leaks, broken reactivity, incorrect split/flatten strategy, and lambda allocation — these cause hard-to-debug production issues.