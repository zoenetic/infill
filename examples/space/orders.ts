/** An order service, answering the web-api space. */
import { def, many, never, of } from "codeform";

export const orders = def("an order service", {
	why: def("let a small shop take orders online without staffing a phone line", {
		success: def("an order placed without a human touching it"),
	}),
	what: def("orders and their line items", {
		resources: many(of("the resource's name", String), def("one resource")),
	}),
	how: def("place, cancel and list orders", {
		endpoints: many(of("method and path", String), def("one endpoint")),
	}),
	who: def("customers place orders; staff cancel them", {
		authentication: def("a session cookie issued at sign-in"),
	}),
	// considered and ruled out — not an oversight
	where: never("single region, single box; distribution is out of scope for v1"),
	// `when` deliberately left untouched: nobody has thought about it yet
	when: def("the timing: lifecycles, states, ordering, and what triggers change"),
});
