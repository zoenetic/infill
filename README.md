# infill

Infill is a spec-driven development framework for people who still want to write code.

Each spec you write is a tree of concepts, each describing something to build, with deliberate gaps left for your preferred AI model to fill. Infill renders the spec into a model-facing document, scaffolds a decisions file, and type-checks the model's decisions against your spec. The AI's interpretation of the spec becomes something `tsc` verifies, not something you take on faith.

## Example: an account

*(The full, runnable version of this example lives in [`examples/account/`](examples/account).)*

### 1. The spec you write — `spec.ts`

```ts
import { def, of, oneOf } from "infill";

export const plan = oneOf("their subscription tier", {
	free: def("no cost, limited usage"),
	pro: def("paid, full features"),
	enterprise: def("a custom contract"),
});

export const account = def("a signed-up user", {
	email: def("how we reach them"),
	displayName: def("what other users see"),
	plan: of(plan),
	seats: def("how many people the account covers"),
});
```

Every unfilled node is a gap; a decision left to the model on purpose. `plan` is a `oneOf`: a closed choice the model must pick from, not invent around.

### 2. `infill gen` scaffolds a decisions file

```bash
infill gen spec.ts
```

It writes `decisions.gen.ts` — a mirror of the spec that already conforms, as the starting point to narrow:

```ts
import { type Conforms, def, many, maybe, of, oneOf, pick, ref } from "infill";
import * as spec from "./spec";

export const account = def("a signed-up user", {
	email: def("how we reach them"),
	displayName: def("what other users see"),
	plan: of(spec.plan),
	seats: def("how many people the account covers"),
});
export const _account: Conforms<typeof account, typeof spec.account> = true;

export const plan = oneOf("their subscription tier", {
	free: def("no cost, limited usage"),
	pro: def("paid, full features"),
	enterprise: def("a custom contract"),
});
export const _plan: Conforms<typeof plan, typeof spec.plan> = true;
```

The `_account` / `_plan` lines are the conformance checks: each asserts, at the type level, that the decision narrows the spec.

### 3. A model fills in the decisions

Handed the rendered spec, a model narrowed the gaps into concrete decisions for a small team's paid account — this is real, unedited output:

```ts
import { type Conforms, def, oneOf, pick } from "infill";
import * as spec from "./spec";

export const account = def("a signed-up user", {
	email: def("the workspace owner's contact address", {
		format: def("a valid RFC 5322 address"),
		verified: def("confirmed via a click-through link before the account is active"),
	}),
	displayName: def("the team's public workspace name, 2-40 characters", {
		unique: def("distinct across the tenant so teammates aren't confused"),
	}),
	plan: pick(spec.plan, "pro"),
	seats: def("a fixed count of 5 paid member seats, one per teammate, billed monthly"),
});
export const _account: Conforms<typeof account, typeof spec.account> = true;

export const plan = oneOf("their subscription tier", {
	free: def("no cost, limited usage"),
	pro: def("paid, full features"),
	enterprise: def("a custom contract"),
});
export const _plan: Conforms<typeof plan, typeof spec.plan> = true;
```

It decided the choice with `pick(spec.plan, "pro")`, fixed `seats`, and sharpened each prose gap — adding a sub-part only where it genuinely tightened the decision.

### 4. `infill check` verifies — and rejects what doesn't

```bash
infill check spec.ts
# ✅ decisions conform
```

`Conforms<Decision, Spec>` makes `tsc` **reject** any decision that contradicts the spec. Pick a case that doesn't exist —

```ts
	plan: pick(spec.plan, "vip"),
```

— and the check fails before a line of it ships:

```
error TS2345: Argument of type '"vip"' is not assignable to parameter of type
'CasesOf<Concept<".", {}, "enterprise" | "free" | "pro">>'.
```

The model's freedom is bounded by your spec, and the boundary is checked, not hoped for.
