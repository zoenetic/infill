/**
 * An extension: the base space, narrowed for a web API.
 *
 * `of` refines — it may add positions and carve existing ones, but its own
 * guard (`Narrows`) will not let it drop a gap the base declared. So an
 * extension can make the space more concrete and more opinionated, and cannot
 * quietly make it easier by dropping a question.
 */
import { def, many, of, oneOf } from "codeform";
import { space } from "./space.js";

export const webApi = of("a system reached over HTTP", space, {
	what: def("the resources this API exposes, and the shape of each", {
		resources: many(of("the resource's name", String), def("one resource")),
	}),
	how: def("the operations, as endpoints", {
		endpoints: many(of("method and path, e.g. POST /orders", String), def("one endpoint", {
			request: def("what the caller sends"),
			response: def("what comes back, and the statuses it can carry"),
		})),
	}),
	who: def("callers and their permissions", {
		authentication: def("how a caller proves who they are"),
		roles: many(of("the role's name", String), def("what this role may do")),
	}),
	where: def("hosting and dependencies", {
		runsOn: def("where the service is deployed"),
		dependsOn: many(of("the dependency's name", String), def("what it is used for")),
	}),
});
