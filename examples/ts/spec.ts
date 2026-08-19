import { def, many, of, oneOf, ref } from "codeform";

export const status = oneOf({
	active: def("the account is usable"),
	inactive: def("suspended or closed"),
});

export const user = def("someone who signs in", {
	email: def("their contact address and username"),
	name: def(),
	status: of(status),
});

export const project = def("a body of work", {
	owner: ref("the project lead", user),
	title: def(),
	tags: many(def()),
});

export const admin = of("a user with elevated powers", user, {
	grants: def("what they're allowed to do"),
});
