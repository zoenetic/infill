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
