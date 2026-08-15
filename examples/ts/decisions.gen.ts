import { type Conforms, def, many, maybe, of, oneOf, pick, ref } from "../../ts/src";
import * as spec from "./spec";

export const admin = of("a user with elevated powers", spec.user, {
	grants: def("what they're allowed to do"),
});
export const _admin: Conforms<typeof admin, typeof spec.admin> = true;

export const project = def("a body of work", {
	owner: ref("the project lead", spec.user),
	title: def(),
	tags: many(def()),
});
export const _project: Conforms<typeof project, typeof spec.project> = true;

export const status = oneOf({
	active: def("the account is usable"),
	inactive: def("suspended or closed"),
});
export const _status: Conforms<typeof status, typeof spec.status> = true;

export const user = def("someone who signs in", {
	email: def("their contact address and username"),
	name: def(),
	status: of(spec.status),
});
export const _user: Conforms<typeof user, typeof spec.user> = true;
