import { def, many, of, oneOf } from "infill";

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
