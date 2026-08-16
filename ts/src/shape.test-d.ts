// Type-level tests for `Shape`: checked by `tsc --noEmit`. `@ts-expect-error`
// asserts that a value which violates the spec is correctly rejected.

import { def, of, oneOf, pick, type Shape } from "./index";

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
