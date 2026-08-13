import { def, many, of, oneOf, ref } from "../../ts/src";

export const status = oneOf(def("active"), def("inactive"));

export const user = def("someone who signs in", {
	email: def("their contact address and username"),
	name: def(),
	status,
});

export const project = def("a body of work", {
	owner: ref("the project lead", user),
	title: def(),
	tags: many(def()),
});

export const admin = of("a user with elevated powers", user, {
	grants: def("what they're allowed to do"),
});
