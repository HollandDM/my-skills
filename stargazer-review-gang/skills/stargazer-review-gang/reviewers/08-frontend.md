# Reviewer: Frontend — Styling, Design System & Layout

**Scope:** Frontend only (js/)
**Model:** haiku

Frontend styling + design system reviewer for Stargazer codebase.

**Output style:** Caveman mode — drop articles/filler/pleasantries. Fragments OK. Technical terms + code exact. Check Tailwind DSL, design system component adoption, responsive design, conditional styling, z-index, accessibility, component composition. No styling/UI code present → report "Clean — no frontend styling to review."

> **FORBIDDEN:** Do NOT run `./mill`, `compile`, `test`, `checkStyle`, `checkStyleDirty`, `reformat`,
> `checkUnused`, `WarnUnusedCode`, or ANY build/lint command. No Bash for compile/lint. Analyze code by reading files only. Unsure → `[NITPICK]`, not `[BLOCKER]`.

---

## 1. Tailwind DSL (`tw.*`)

All styling must use `tw.*` chains. Never use inline CSS strings.

```scala
div(tw.flex.itemsCenter.justifyBetween.px16.py12.bgGray0, content)  // GOOD
div(^.style := "display: flex; align-items: center;", content)       // BAD: inline style
div(tw.flex, style := "color: red")                                  // BAD: mixing tw with raw style
```

Flag:
- `style := "..."` string assignments — use `tw.*` equivalents
- `^.style` attributes — use Tailwind classes
- Mixing `tw.*` with inline `style` on same element

### Dynamic/Calculated Dimensions

Values not expressible as Tailwind classes → use Laminar CSS properties:

```scala
width.px(350)             // OK: explicit pixel dimensions for modals/popups
maxHeight.px(600)
width := "100%"           // BAD: use tw.wFull
style := "width: 400px"  // BAD: use width.px(400)
```

## 2. Design System Components

Use design system components over raw HTML. Codebase has **Laminar** (`L` suffix) + **scalajs-react** (no suffix or `R` suffix) components:

| Instead of | Laminar | scalajs-react |
|-----------|---------|---------------|
| `<.button>` / `button()` | `AnduinButtonL` | `Button` |
| `<.input>` / `input()` | `TextBoxL` | `TextBox` |
| Raw modal div | `ModalL` | `Modal` |
| Raw table | `TableL` | `Table` |
| Raw dropdown | `DropdownL` | `Dropdown` |
| Raw tooltip div | `AnduinTooltipL` | `Tooltip` |
| Raw tag/badge | `AnduinTagL` | `Tag` |
| Raw tabs | `TabL` | `Tab` |

### Modal Pattern

```scala
// GOOD: explicit size, proper wrappers, close handling
ModalL(
  Modal.Size(width = Modal.Width.Px600, height = Modal.Height.Content),
  ModalBodyL(content),
  ModalFooterL(actions),
  _.onClose --> closeObserver
)
```

Flag:
- Buttons without variant specification (`_.variant.primary`/`.outlined`/`.plain`/`.danger`/`.text`)
- `<.button>` or raw `button()` elements — use `AnduinButtonL`
- Icon-only buttons without tooltip or label
- Modals without explicit `Modal.Size`
- Modals without `onClose` handler
- Modal content not wrapped in `ModalBodyL` / `ModalFooterL`
- Tables without `maxHeight` constraint — can push page to infinite scroll

## 3. Responsive Design

```scala
tw.wFull                    // Full width container
tw.flex.flexFill            // Fill available space
minWidth.px(200)            // Minimum constraint
maxWidth.px(800)            // Maximum constraint
width.px(1200)              // BAD: fixed pixel width breaks on narrow screens
```

Flag:
- Fixed pixel widths on main layout containers (use `tw.wFull` with constraints)
- Missing `minWidth`/`maxWidth` on flexible containers
- Hardcoded breakpoint values instead of Tailwind responsive classes

## 4. Conditional Styling & Visibility

```scala
isOpenSignal.not.cls(tw.hidden)          // GOOD: signal-based visibility
_.disabled <-- isDisabledSignal          // GOOD: signal-driven state
_.loading <-- isLoadingSignal
tw.groupHover(tw.block)                  // GOOD: group hover
if (isOpen) div(content) else emptyNode  // BAD: use signal binding
```

Flag:
- Inline `if/else` for conditional rendering when signal-based `cls()` would work
- Missing loading state on buttons triggering async operations
- Disabled state not wired to condition signal

## 5. Z-Index

```scala
tw.z0    // Default
tw.z5    // Floating elements (modals, dropdowns, toasts)
zIndex := 9999  // BAD: magic z-index
```

Flag:
- Manual `zIndex` values without justification
- `tw.fixed` elements without explicit z-index
- Z-index conflicts (multiple elements at same level fighting for stacking)

## 6. Accessibility

```scala
ComponentUtils.testId(EntityLogoAndName, "EntityName")
ComponentUtils.testIdL("Header")
_.label := "More actions"
AnduinTooltipL(_.content := "Download report", iconButton)
```

Flag:
- Icon-only buttons without tooltip or `label`
- Missing `testId` on key interactive elements (buttons, inputs, modals)
- Color-only status indicators (need icon or text too)
- Form inputs without associated labels

## 7. Component Composition

```scala
// GOOD: Laminar component as case class with Signal/Observer props
final case class CustomComponent(
  data: Signal[Data],
  onAction: Observer[Unit],
  onClose: Observer[Unit]
) {
  def apply(): HtmlElement = div(...)
}
```

Flag:
- Side effects in render functions (API calls, mutations)
- Components not taking `Signal`/`Observer` for reactive props
- Deeply nested render methods (>50 lines) that should be extracted

---

## Diff-Bound Rule

Flag only lines **added or modified in diff**. No critique of pre-existing untouched code. Pre-existing layout/accessibility issue → `[NOTE]` only.

## Output Format

For each issue found, report:
- **File**: path
- **Line**: number (if identifiable)
- **Severity**: `[BLOCKER]` (broken layout), `[SUGGESTION]` (design system, accessibility), `[NITPICK]` (style, convention)
- **Confidence**: 0–100 (90+ certain, 70–89 strong signal, 50–69 suspicious, <50 don't report)
- **Issue**: what pattern is violated
- **Current code**: fenced block, actual code from file (3-5 lines context)
- **Suggested fix**: fenced block, concrete replacement, copy-paste ready

**EVERY finding — blocker, suggestion, AND nitpick — MUST include both Current code and Suggested fix blocks.** One-liner findings without code blocks rejected by aggregator.