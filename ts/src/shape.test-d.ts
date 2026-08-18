// Type-level tests for `Shape`: checked by `tsc --noEmit`. `@ts-expect-error`
// asserts that a value which violates the spec is correctly rejected.

import { def, maybe, of, oneOf, pick, type Shape } from "./index.js";

const plan = oneOf({
	free: def("no cost"),
	pro: def("paid"),
	enterprise: def("custom"),
});

const account = def("a signed-up user", {
	email: of<string>("how we reach them"),
	displayName: of<string>("what others see"),
	plan: of(plan),
	seats: of<number>("how many people"),
	notes: def("free-form, untyped"), // prose leaf -> unknown
});

// Real implementation code, typed by the spec's projection.
export const acme: Shape<typeof account> = {
	email: "founders@acme.dev",
	displayName: "Acme",
	plan: "pro",
	seats: 5,
	notes: { anything: true }, // unknown accepts any value
};

export const badPlan: Shape<typeof account> = {
	email: "",
	displayName: "",
	// @ts-expect-error "vip" is not a plan case
	plan: "vip",
	seats: 5,
	notes: null,
};

export const badSeats: Shape<typeof account> = {
	email: "",
	displayName: "",
	plan: "pro",
	// @ts-expect-error seats must be a number
	seats: "five",
	notes: null,
};

// @ts-expect-error email is required (structure is enforced even when leaves are typed)
export const missing: Shape<typeof account> = {
	displayName: "",
	plan: "pro",
	seats: 1,
	notes: null,
};

// A `pick` narrows the choice: the decision's projection is the single literal.
const decidedPlan = pick(plan, "pro");
export const onlyPro: Shape<typeof decidedPlan> = "pro";
// @ts-expect-error the decision fixed the plan to "pro"
export const notPro: Shape<typeof decidedPlan> = "free";

// Token-typed leaves — the type is a runtime value, but still projects like of<T>().
const config = def("a service config", {
	host: of(String),
	port: of("the listening port", Number),
	tls: of(Boolean),
	legacy: of<string>(), // phantom still available as a type-only escape hatch
});
export const cfg: Shape<typeof config> = {
	host: "localhost",
	port: 8080,
	tls: true,
	legacy: "v1",
};
export const badCfg: Shape<typeof config> = {
	// @ts-expect-error host is a string (of(String))
	host: 42,
	port: 8080,
	tls: true,
	legacy: "v1",
};

// A `maybe` part projects to an optional property: the key may be omitted...
const contact = def("a way to reach someone", {
	email: of(String),
	phone: maybe(of(String)),
});
export const onlyEmail: Shape<typeof contact> = { email: "a@b.dev" };
export const withPhone: Shape<typeof contact> = {
	email: "a@b.dev",
	phone: "+1",
};
export const badPhone: Shape<typeof contact> = {
	email: "a@b.dev",
	// @ts-expect-error phone, when present, is a string
	phone: 42,
};
