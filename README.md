# codeform

Codeform is a spec-driven development framework for people who still want to write code.

Each spec you write is a tree of concepts, each describing something to build, with deliberate gaps left for your preferred AI model to fill. Codeform renders the spec into a model-facing document, scaffolds a *decisions* file and type-checks the model's interpretation against your spec — then projects the spec into the concrete type your real code must satisfy. Both the model's interpretation and its code become something `tsc` verifies, not something you take on faith.

## Install

Codeform is two packages: the library you build specs with, and the CLI that scaffolds and checks them.

```bash
npm install codeform          # the library — formers, Shape, Conforms
npm install -D codeform-cli   # the CLI — codeform gen / check / emit
```

`codeform` ships compiled JavaScript with type declarations, so it drops into any project and runs under plain Node. `codeform-cli` is a dev tool: it has to load your spec *source* as TypeScript, so it carries its own loader — you don't need to configure one. Its `check` command shells out to `tsc`, so keep `typescript` installed; it's an optional peer.

The walkthrough below is one `account` spec, start to finish — runnable in [`examples/account/`](examples/account).

## 1. The spec you write — `spec.ts`

```ts
import { def, many, of, oneOf } from "codeform";

export const plan = oneOf("their subscription tier", {
	free: def("no cost, limited usage"),
	pro: def("paid, full features"),
	enterprise: def("a custom contract"),
});

export const account = def("a signed-up team account", {
	displayName: of(String),
	plan: of(plan),
	seats: of("how many people the account covers", Number),
	admins: many("the admins who can manage billing, by email", of(String)),
	features: many("the add-on features enabled for this account", of(String)),
});
```

Every unfilled node is a **gap** — a decision left to the model on purpose. `plan` is a `oneOf`: a closed choice. Leaves you *type* (`of(String)`, `of(Number)`) get their values checked in code; a bare `def("...")` stays a free-form gap. Note there are no comments: anything worth saying is a **description**, so it travels with the concept into the model-facing document instead of being lost in the source.

## 2. `codeform gen` scaffolds a decisions file

```bash
codeform gen spec.ts
```

It writes `decisions.gen.ts` — a mirror of the spec that already conforms, as the starting point to narrow. The `_account` line is the conformance check: it asserts, at the type level, that the decision narrows the spec.

```ts
export const account = def("a signed-up team account", {
	displayName: of(String),
	plan: of(spec.plan),
	seats: of("how many people the account covers", Number),
	admins: many("the admins who can manage billing, by email", of(String)),
	features: many("the add-on features enabled for this account", of(String)),
});
export const _account: Conforms<typeof account, typeof spec.account> = true;
```

## 3. The model narrows the interpretation

The one open interpretation here is the **choice** — the typed leaves are already settled. The model picks the plan, and `codeform check` verifies it conforms:

```ts
	plan: pick(spec.plan, "pro"),
```

```bash
codeform check spec.ts
# ✅ decisions conform
```

Pick a case that doesn't exist — `pick(spec.plan, "vip")` — and it fails before it ships:

```
error TS2345: Argument of type '"vip"' is not assignable to parameter of type
'CasesOf<Concept<".", {}, "enterprise" | "free" | "pro">>'.
```

## 4. Build the code

Now leave spec space. `Shape` projects the decisions into the concrete type your implementation must satisfy:

```ts
Shape<typeof decisions.account>
// {
//   displayName: string;
//   plan: "pro";
//   seats: number;
//   admins: string[];
//   features: string[];
// }
```

The two compact `many(...)` lines in the spec become the actual lists in your code — and the model writes ordinary code of that type:

```ts
import type { Shape } from "codeform";
import * as decisions from "./decisions.gen";

export const acme: Shape<typeof decisions.account> = {
	displayName: "Acme Corp",
	plan: "pro",
	seats: 24,
	admins: [
		"founders@acme.dev",
		"ops@acme.dev",
		"security@acme.dev",
		"billing@acme.dev",
	],
	features: [
		"sso",
		"audit-log",
		"custom-domains",
		"priority-support",
		"data-residency",
	],
};
```

`codeform check` passes — and every value is enforced, down to each element. A wrong plan, a non-number seat count, or a non-string admin won't compile:

```
error TS2322: Type '"startup"' is not assignable to type '"pro"'.
error TS2322: Type 'string' is not assignable to type 'number'.
error TS2322: Type 'number' is not assignable to type 'string'.
```

You wrote a 13-line spec and got 20 lines of typed, checked code — plus a verified decisions file. Structure and closed choices are always enforced; leaf *values* are enforced wherever you typed them. You police as much of the implementation as you chose to type — no more, no less.
