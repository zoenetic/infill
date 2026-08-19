# codeform

Codeform is a spec-driven development framework for people who still want to write code.

Each spec you write is a tree of concepts, each describing something to build, with deliberate gaps left for your preferred AI model to fill. Codeform renders the spec into a model-facing document, scaffolds a *decisions* file and type-checks the model's interpretation against your spec — then projects the spec into the concrete type your real code must satisfy. Both the model's interpretation and its code become something `tsc` verifies, not something you take on faith.

## Install

```bash
npm install -D codeform
```

Codeform is a development tool — you author and check specs with it and ship plain typed code — so it's a dev dependency. One package provides both the library (the formers, `Shape`, `Conforms`) and the `codeform` CLI (`gen` / `check` / `emit`).

## What it does today

A spec is built from seven formers — `def`, `ref`, `of`, `many`, `maybe`, `oneOf`, `given` — where every unfilled node is a gap left on purpose:

```ts
import { def, of, oneOf } from "codeform";

export const status = oneOf("where a task stands", {
	todo: def("not started"),
	doing: def("in progress"),
	done: def("finished"),
});

export const task = def("a unit of work", {
	title: of(String),
	status: of(status),
});
```

From there:

- **`codeform gen spec.ts`** scaffolds `decisions.gen.ts` — a conforming mirror of the spec with a type-level `Conforms<…>` assertion per concept. A model narrows the gaps.
- **`codeform check spec.ts`** proves through `tsc` that the decisions still conform: the model can't invent a case, drop a part, or contradict a decided fact without it failing before anything ships.
- **`codeform emit spec.ts`** renders the spec as the self-describing document the model reads — every concept with its path, its form, and the prose that says how to fill it.
- **`Shape<typeof decisions.task>`** projects the decisions into the concrete type your implementation must satisfy, so your real code is checked too: assign `status: "blocked"` and it won't compile — `Type '"blocked"' is not assignable to type '"doing" | "done" | "todo"'`.

Both halves are **total** — every former has a rule, at every depth. A `ref` projects through the concept it points at; a `many` to an array of its element's projection; an `of` lays its own parts over its target's rather than replacing them; a `maybe` to an optional key; a `given` to the literal it asserts. Conformance walks the same way, so a decision that swaps out a collection's element, drops the optionality off a `maybe`, guts a choice's case from the inside, or contradicts a fact fails at the exact path it happened — addressed the way `emit` addresses it, `route.stops[].note` and `shape#circle.radius` included.

What `tsc` holds is **structure**: the shape of your data at any depth, the closed set of a `oneOf` (the model can't invent a case), exhaustiveness when you handle one, and exact values pinned by `pick` and `given`. Behavioural rules travel as prose in the emitted contract; the model implements them and you review.

Nothing the checker sees is invisible to the rest of it. An `of` always takes something on — a concept's shape, or a token's type (`of(String)`) — so there is no way to name a type in the spec's source that `emit`, `gen` and `check` can't read back. For what a token doesn't cover, describe the structure with the other formers; that is what they are for.

Full runnable specs live in [`examples/account`](examples/account) and [`examples/hangman`](examples/hangman) — a whole game from a small spec.

## Where it's going

Codeform's throughline is closing the gap between *structure*, which types hold today, and *behaviour*, which they mostly can't. The roadmap is that, in order of reach:

- **Behavioural specification** — worked examples attached to an operation as facts, projected to literal types the implementation must reproduce: an example becomes a compile-time assertion instead of a comment.
- **More formers** — the dial from open to decided has room at its ends, e.g. a `never()` to forbid a case or assert an absence, alongside today's `def … given`.
- **Assertion helpers** — a small library of functions you call in your own code to assert properties against the spec and decisions (exhaustiveness, a value satisfying a spec path), surfacing as `tsc` errors the way `conforms()` already does.
- **Model tooling** — skills and commands that let a model interact with the spec and decisions files directly: read a concept by path, scaffold and narrow decisions, run `check` and act on the result — instead of a human relaying `emit` output by hand.
- **AI conformance** *(further out)* — a check that goes past types: cheap, non-deterministic model calls that verify generated code actually honours the prose contract — the behaviour types can't reach — with codeform skills and, eventually, IDE surfacing.

The real proof, and the eventual hero example, is codeform specified in codeform — built *from* its spec rather than having one inferred after the fact. [`spec/`](spec) holds that spec, and it now round-trips: `gen` scaffolds a decisions file that compiles and `check` proves it conforms, both in CI. That is the spec describing codeform accurately, not codeform built from it. When the second is true, this README will be about that.
