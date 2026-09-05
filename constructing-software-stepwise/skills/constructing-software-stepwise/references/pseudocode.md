# Pseudocode as a research-paper algorithm

Use a consistent algorithm presentation: a caption, the operation's interface and contract, a named procedure, numbered steps, and an explanation of correctness below the algorithm. This is Stepwise's house style, drawing on common CS paper conventions; there is no single syntax shared by every research community.

## Structure

- **Caption:** `Algorithm D-NNN: <purpose>`. Keep the node ID stable across revisions. It is the reference identity; line numbers are local reading aids.
- **Interface and contract:** identify parameters and their domains in the signature and `pre`; state the result and guarantees in `post`. Views label these `Require` and `Ensure`. Optional `input` and `output` clauses display as `Input` and `Output`; use them only for distinct obligations, without duplicating pre/post. Keep failure, cancellation, invariants, and budgets explicit when relevant.
- **Procedure:** one operation per node, with indented blocks and explicit closing keywords. A helper call remains a call to another named algorithm. Do not paste the helper's body beneath the call: its locals, returns, and state belong to a separate scope.
- **Explanation:** use `walkthrough` for an overview and `composition` for the argument that the steps establish the contract. Place detailed derivations, alternatives, and proof cases outside the numbered steps.

For example, a generated node view can read:

```pseudo
Algorithm D-000: Transform a finite sequence without reordering it
Require: X is a finite sequence; Transform is defined for every element.
Ensure: Y contains Transform(x) for each x in X, in the same order.
1: procedure TransformAll(X)
2:   Y ← []
3:   for each x in X do
4:     y ← Transform(x)  ▷ D-001: Transform one element.
5:     Y ← Y ⧺ [y]
6:   end for
7:   return Y
8: end procedure
```

Here `⧺` means sequence concatenation. Define unfamiliar symbols in the walkthrough or shared context. Explain the loop invariant in `composition`: after each iteration, Y is the transformed prefix of X. Finiteness establishes termination. If Transform can fail, this example needs a corresponding failure contract and explicit handling or propagation.

## Writing the body

Store the caption in `gloss`, the signature in `statement`, and requirements in `contract`. Pass just the body, optionally wrapped in a matching `procedure` or `function`, to the CLI. Captions, contract headings, outer procedure numbering, and line numbers are generated; do not paste them into `body`.

```text
new <dir> D-000 "Y ← TransformAll(X)"
set <dir> D-000 '{"gloss":"Transform a finite sequence without reordering it","effect":"Construct a transformed sequence.","contract":{"pre":"X is finite; Transform is defined for every element.","post":"Y contains the transformed elements in their original order."}}'
```

A body file for that node:

```pseudo
procedure TransformAll(X)
  Y ← []
  for each x in X do
    y ← Transform(x)  ▷ D-001: Transform one element.
    Y ← Y ⧺ [y]
  end for
  return Y
end procedure
```

Set it with `body <dir> D-000 --file algorithm.pseudo`, then supply the walkthrough and composition argument before approval. Normal batching and decision attribution still apply.

## Notation

| Construct | Preferred form |
|---|---|
| Assignment | `x ← expression`; reserve `=` for equality. |
| Return | `return result`; use explicit return values. |
| Choice | `if condition then` / `else if condition then` / `else` / `end if`. |
| Iteration | `for each x in X do` / `end for`, or `while condition do` / `end while`. |
| Repeat | `repeat` / `until condition`. |
| Calls | `Normalize(x)` or the repository's existing `normalize(x)` name. Keep names consistent; no forced renaming. |
| Assertions | `assert predicate`; record invariant/progress reasoning outside the steps. An assertion in pseudocode is an obligation, not evidence that it holds. |
| Sets and sequences | Use `∈`, `∅`, indexing, and sequence operations when clearer; define domains, order, and indexing bounds where they matter. |
| Comments | `▷ explanation`; explain intent, a mathematical step, or a refinement reference. |

Use meaningful names instead of translating every variable into a Greek symbol. Mathematical notation should remove ambiguity or shorten a real derivation. Keep scheduling, retries, failures, persistence, and ownership concrete when they affect correctness. Avoid implementation syntax such as imports, framework types, and method chains unless the algorithm specifically depends on them. Terminal adaptations still name the actual APIs or constructs.

Stepwise's reference annotations extend ordinary paper comments: `▷ D-NNN: explanation` introduces a refinement; `▷ ↗ D-NNN -- explanation` reuses an approved node; `▷ ⇒ target: identifier -- explanation` maps a concrete operation. These are graph links, not executable statements. Nontrivial predicates or helpers should be defined and referenced; do not hide difficult work behind an unexplained call inside a condition.

## Stateful and event-driven systems

A protocol need not be forced into a single batch loop. Describe persistent state, initial values, ownership, and the relevant consistency/atomicity assumptions in the node's contract and shared context. Use separate handler nodes for independent events. Within a handler, `upon <event> do` / `end upon` can make a trigger explicit; `atomic do` / `end atomic` can identify a required atomic section. Those words do not establish a runtime guarantee: the refinement or terminal adaptation must explain the mechanism.

Likewise, mark parallel work explicitly and state ordering, joining, shared-state, cancellation, and failure behavior. Indentation does not imply concurrency, atomicity, or fairness. Keep state/sequence diagrams in `behavior` consistent with the algorithm. For observed code, report the inspected behavior and unknowns without upgrading it to an intended guarantee.

## Detail and compatibility

Keep one logical action per numbered line, with indentation matching its control block. Include enough information to check the algorithm's obligations. There is no fixed line limit and no requirement to attach a formal theorem or asymptotic analysis to every node. Discuss complexity when it explains a design choice or required bound, including the costs of nontrivial helpers.

Existing `name(args):`, `<-`, `->`, `{ assertion }`, colon-based blocks, and `--` annotations remain accepted. New drafts should use the preferred notation. Rendering can improve typography without changing ledger content, approvals, evidence, or source versions. Rewriting an approved algorithm still requires `reopen`. Regenerate Markdown with `sync` and HTML with `html` to see the new presentation. Historical and observed bodies stay identified as such.

The CLI recognizes the notation and preserves indentation and references; it is not a compiler or proof checker. Check block pairing, variable scope, mathematical definitions, and the argument for correctness when reviewing the design.

## Sources and what Stepwise adopts

- [János Szász, algorithmicx documentation, §§2–3](https://ctan.math.illinois.edu/macros/latex/contrib/algorithmicx/algorithmicx.pdf): named procedures, control blocks, contract headings, comments, and local line references. Stepwise adopts the presentation without requiring LaTeX or its macros.
- [Kingma and Ba, Adam, Algorithm 1](https://arxiv.org/pdf/1412.6980): a compact algorithm with parameter assumptions, initialized state, mathematical updates, a loop, and a returned result. Its surrounding text carries definitions and analysis.
- [Ongaro and Ousterhout, Raft, Figure 2](https://raft.github.io/raft.pdf): state, message interfaces, and event-triggered rules are separated. This motivates the handler-oriented option for protocols.
- [Naomi Nishimura, pseudocode guidelines](https://www.cs.cornell.edu/courses/cs482/2004su/handouts/pseudocode.pdf): choose the level of detail for the reader and underlying computational model. This supports retaining Stepwise's responsibility-based refinement instead of prescribing mechanical line limits.
