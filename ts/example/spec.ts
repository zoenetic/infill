import { def } from "../src/def";
import { is } from "../src/is";
import { ref } from "../src/ref";

export const user = def("someone who signs in", {
	email: def("their contact address and username"),
	name: def(),
});

export const project = def("a body of work", {
	owner: ref("the project lead", user),
	title: def(),
});

export const session = def({
	holder: ref(user),
	expiry: def("when the session will expire"),
});

export const admin = is("a user with elevated powers", user, {
	grants: def("what they're allowed to do"),
});
