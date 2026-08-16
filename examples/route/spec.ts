import { def, of, oneOf } from "infill";

// The HTTP method — a closed choice.
export const method = oneOf("the HTTP method", {
	get: def("read a resource"),
	post: def("create a resource"),
	delete: def("remove a resource"),
});

// An HTTP route. The leaves are typed, so the compiler will check the
// implementation's values, not just its shape.
export const route = def("an HTTP route", {
	path: of<string>("the URL pattern, e.g. /users/:id"),
	method: of(method),
	authenticated: of<boolean>("whether a valid session is required"),
});
