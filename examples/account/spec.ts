import { def, of, oneOf } from "infill";

// A subscription tier — exactly one of these applies.
export const plan = oneOf("their subscription tier", {
	free: def("no cost, limited usage"),
	pro: def("paid, full features"),
	enterprise: def("a custom contract"),
});

// The main concept: a signed-up user.
export const account = def("a signed-up user", {
	email: def("how we reach them"),
	displayName: def("what other users see"),
	plan: of(plan),
	seats: def("how many people the account covers"),
});
