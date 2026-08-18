import { type Conforms, def, many, of, oneOf, pick } from "codeform";
import * as spec from "./spec";

export const account = def("a signed-up team account", {
	displayName: of(String),
	plan: pick(spec.plan, "pro"),
	seats: of("how many people the account covers", Number),
	admins: many("the admins who can manage billing, by email", of(String)),
	features: many("the add-on features enabled for this account", of(String)),
});
export const _account: Conforms<typeof account, typeof spec.account> = true;

export const plan = oneOf("their subscription tier", {
	free: def("no cost, limited usage"),
	pro: def("paid, full features"),
	enterprise: def("a custom contract"),
});
export const _plan: Conforms<typeof plan, typeof spec.plan> = true;
