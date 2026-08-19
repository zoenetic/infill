import { type Conforms, conforms, def, many, of, oneOf, ref } from "codeform";
import * as spec from "./spec";

export const admin = of("a user with elevated powers", spec.user, {
	grants: def("what they're allowed to do"),
});
export const _admin: Conforms<typeof admin, typeof spec.admin, "admin"> = conforms<typeof admin, typeof spec.admin, "admin">();

export const project = def("a body of work", {
	owner: ref("the project lead", spec.user),
	title: def(),
	tags: many(def()),
});
export const _project: Conforms<typeof project, typeof spec.project, "project"> = conforms<typeof project, typeof spec.project, "project">();

export const status = oneOf({
	active: def("the account is usable"),
	inactive: def("suspended or closed"),
});
export const _status: Conforms<typeof status, typeof spec.status, "status"> = conforms<typeof status, typeof spec.status, "status">();

export const user = def("someone who signs in", {
	email: def("their contact address and username"),
	name: def(),
	status: of(spec.status),
});
export const _user: Conforms<typeof user, typeof spec.user, "user"> = conforms<typeof user, typeof spec.user, "user">();
