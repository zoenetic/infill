# Spec language — decisions so far

## Naming

| Model noun | Surface former |
|---|---|
| concept | `def` |
| Choice | `oneOf` |
| gap | — |

- **concept** — the primitive. Rejected "site" (compiler vocabulary).
- **def** — marks a thing as *defined*, not yet specific. Model noun and former stay separate words.
- **gap** — the unfilled space at a position. Replaced "residue" (pejorative, and it's the default state). Beat leeway, latitude, freedom, space, play, license. Chosen because gap-analysis already nests: a gap made of smaller gaps is normal usage.

## Core model

- One node type. Formers are `kind` tags, not separate types.
- `Concept<G extends string = Gap, F extends Fill = {}, T = unknown>`, `Gap = "."`, `Fill = Record<string, Concept<any, any>>`.
- **Prompt states the need; narrowing args supply the means.** The prompt may never change as narrowing proceeds.
- Prompt is optional. `const user = def()` is legal — a bare binding name can be the whole spec, which makes names *content*, not just identity.
- **Prompt hygiene**: strip prompts that restate the binding name or the fill. A prompt earns its place only where it says what the name and structure can't.
- Names come from the binding `const`. Roots must be bound; children get positional paths.
- **There's always a gap.** Carving never closes a node, `"."` is permanent, completeness is never claimable.
- Every former: `former(prompt?, ...narrowing args)`.
- Formers sit on the narrowing dial themselves — `def` broadest, `ref`/`of`/`many`/`oneOf` progressively narrower. No core vs std-lib tiering, one continuum.
- No framework-reserved keys, ever. A narrower former may require particular args; that's narrowing, not reservation.

## Formers

- `def(prompt?, fill?)` — broadest.
- `ref(prompt?, to)` — points at a concept. Leaf: inherits no gaps. Carries its own prompt, because a relationship's role is a real gap (`owner` vs `holder` both → `user`).
- `of(prompt?, to, fill?)` / `of<T>(prompt?)` — a position *shaped like* X, where X is a concept or a TS type. Inherits the target's gaps ("err toward completeness even if it means repetition"). Renamed from `is` for legibility against `ref`.
- `many(prompt?, inner)` / `maybe(prompt?, inner)` — cardinality. Type param is the **container**: `many(of<T>())` = `T[]`, `many<T[]>(of())` = `T[]`, `many<T[]>(of<U>())` errors. Container structure is otherwise gap.
- `oneOf(prompt?, ...cases)` — cases positional and concept-valued. **Closed by default**: enumerating alternatives asserts the alternatives. An open/extensible choice is the narrowing that needs saying. (A syntactic signifier of closedness is a later decision.)

## Verbs

No verb former, no reserved keys. A verb is a concept whose prompt describes an action; its parts are carved with developer-chosen keys.

## Rules

- A rule is a concept. Probably everything is.
- Prose already *expresses* rules. What plain `def` can't do is **classify**: two prose rules asserting opposite orderings over the same pair are both invisible. Rule formers are therefore classifiers — `def` narrowed by a category tag — so contradictions become decidable.
- A rule lowers twice: to prose at that position (generation), and to an obligation checkable against the artifact (verification).

**Rules attach fluently to the position they constrain**, with the classifier as the method name. No invented sibling key, and the host supplies one operand.

```ts
const booking = def("a reserved stay", {
	checkIn,
	checkOut: checkOut.after("a stay can't end before it starts", checkIn),
	guests: many(of(person)).atMost(room.capacity),
});
```

- `.rule(prose, ...operands)` is the broadest classifier — the `def` of the rule layer. It marks content as **normative rather than descriptive** (prose can't carry that), and with operands it yields tsc-checked edges and blame targets even when the relation itself stays opaque. This replaces a separate `must`.
- Four rungs: prompt prose → `.rule(prose)` → `.rule(prose, ...operands)` → `.after(...)`. Each narrowing buys exactly one thing.
- Operands are always **references** — a rule never contains its operands — so they need no `ref`/`of` ceremony.
- Because the host supplies an operand, directional names beat a neutral one: `checkOut.after(checkIn)` reads, `checkOut.order(checkIn)` doesn't. As a *free function* the reverse held, and a single `order()` with arity as the dial was better. Method form also kills the shadowing hazard of `const order = def(...)`.
- Put the methods on a prototype, not as own properties, or the crawler's `Object.entries(fill)` picks them up as children.

Candidate classifiers by category: `before`/`after` · `same`/`distinct` · `within`/`among` · `atLeast`/`atMost`/`exactly` · `requires`/`excludes` · `only` · `not`.

## Checker split

tsc cannot see which `const` a value is bound to. That's bitten three times — name recovery, reference detection, and the bare-mention rule — so it's settled as the CLI's job.

- Bare mention of a bound concept is an **error only in fill slots**, where both readings are genuinely plausible. Use `ref(x)` or `of(x)` there. `oneOf` cases and rule operands take bare concepts — a case's own gaps are the choice's problem, and operands are always references. Inline `def(...)` needs no ceremony anywhere.
- Types should be as *true* as possible.
- Language server is for what the type system can't **express** (gap distribution, provenance), never to correct what it gets **wrong** — that would mean two truths.
- Derivation is fine when it derives **structure**, wrong when it derives **closure**. `many(of<T>())` → `T[]` is fine; inferring a case union from `oneOf`'s cases is not, because it silently claims exhaustiveness.
- Spec-level types are constraints on meaning, not codegen instructions. The target may not be statically typed.

## Tooling

Runtime crawler over the exported module namespace — object identity distinguishes reference from containment, exported names give the naming. ts-morph later, for source locations and unexported bindings.

## Parked

- Reservation marker — "I'll fill this myself later". Typed holes (Agda, Idris, `todo!()`) are the precedent.
- The IR. Nothing built so far has met a model yet.
- Prompt vs fill contradiction — flagged early, never resolved. Likely a model-pass lint, not a deterministic check. Working doctrine: prose should carry intent, not structure, since structural prose drifts as carving proceeds.
- The `kind` brand — `Ref` is still structurally assignable to `Concept`, so `GapsIn` works only because it tests for refs first.
- Scoping: inside a fill, does `ref(X)` bind to the sibling that is `of(X)`, or to X itself?
- Host-less rules. `distinct(a, b)` has no primary operand, so either one is picked arbitrarily as the receiver, or a few classifiers stay free-standing and the language has two spellings.
- Loosening the bare-mention error: a concept bound once and used in exactly one slot is unambiguously containment, so the error could fire only on multiple usages.
