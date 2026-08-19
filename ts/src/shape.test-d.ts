// Type-level tests for `Shape`: checked by `tsc --noEmit`. `@ts-expect-error`
// asserts that a value which violates the spec is correctly rejected.

import {
	def,
	given,
	many,
	maybe,
	of,
	oneOf,
	pick,
	ref,
	type Shape,
} from "./index.js";

const plan = oneOf({
	free: def("no cost"),
	pro: def("paid"),
	enterprise: def("custom"),
});

const account = def("a signed-up user", {
	email: of("how we reach them", String),
	displayName: of("what others see", String),
	plan: of(plan),
	seats: of("how many people", Number),
	notes: def("free-form, untyped"), // prose leaf -> unknown
});

// Real implementation code, typed by the spec's projection.
export const acme: Shape<typeof account> = {
	email: "founders@acme.dev",
	displayName: "Acme",
	plan: "pro",
	seats: 5,
	notes: { anything: true }, // unknown accepts any value
};

export const badPlan: Shape<typeof account> = {
	email: "",
	displayName: "",
	// @ts-expect-error "vip" is not a plan case
	plan: "vip",
	seats: 5,
	notes: null,
};

export const badSeats: Shape<typeof account> = {
	email: "",
	displayName: "",
	plan: "pro",
	// @ts-expect-error seats must be a number
	seats: "five",
	notes: null,
};

// @ts-expect-error email is required (structure is enforced even when leaves are typed)
export const missing: Shape<typeof account> = {
	displayName: "",
	plan: "pro",
	seats: 1,
	notes: null,
};

// A `pick` narrows the choice: the decision's projection is the single literal.
const decidedPlan = pick(plan, "pro");
export const onlyPro: Shape<typeof decidedPlan> = "pro";
// @ts-expect-error the decision fixed the plan to "pro"
export const notPro: Shape<typeof decidedPlan> = "free";

// Token-typed leaves: the type is carried by a runtime value, so every stage —
// the projection, `emit`, `gen` and `check` — can see it.
const config = def("a service config", {
	host: of(String),
	port: of("the listening port", Number),
	tls: of(Boolean),
});
export const cfg: Shape<typeof config> = {
	host: "localhost",
	port: 8080,
	tls: true,
};
export const badCfg: Shape<typeof config> = {
	// @ts-expect-error host is a string (of(String))
	host: 42,
	port: 8080,
	tls: true,
};

// An `of` always takes something on, so there is no way to name a type the
// checker can see but the rest of the pipeline cannot.
// @ts-expect-error `of` needs a concept or a token
export const nothingTakenOn = of("just a description");

// A `maybe` part projects to an optional property: the key may be omitted...
const contact = def("a way to reach someone", {
	email: of(String),
	phone: maybe(of(String)),
});
export const onlyEmail: Shape<typeof contact> = { email: "a@b.dev" };
export const withPhone: Shape<typeof contact> = {
	email: "a@b.dev",
	phone: "+1",
};
export const badPhone: Shape<typeof contact> = {
	email: "a@b.dev",
	// @ts-expect-error phone, when present, is a string
	phone: 42,
};

// ── Projection is total: it reaches through every former, not only named parts ─
// Before these, a `ref`, a `many` of a structured concept, or an `of` that
// refined one all bottomed out at `unknown`, and the checker silently held the
// implementation to nothing.

const point = def("a point on the plane", { x: of(Number), y: of(Number) });

// A `ref` projects through the concept it points at.
const placed = def("something with an origin", { origin: ref(point) });
export const atOrigin: Shape<typeof placed> = { origin: { x: 0, y: 0 } };
export const badOrigin: Shape<typeof placed> = {
	// @ts-expect-error origin projects through `point`, so it is not a string
	origin: "0,0",
};

// A `many` projects to an array of its element's projection.
const route = many("the stops along the way", of(point));
export const trip: Shape<typeof route> = [
	{ x: 0, y: 0 },
	{ x: 1, y: 2 },
];
// @ts-expect-error the elements are points, not strings
export const badTrip: Shape<typeof route> = ["origin"];

// A `maybe` of a structured concept keeps that structure.
const located = def("something that may know where it is", {
	at: maybe(of(point)),
});
export const nowhere: Shape<typeof located> = {};
export const somewhere: Shape<typeof located> = { at: { x: 3, y: 4 } };
export const badWhere: Shape<typeof located> = {
	// @ts-expect-error `at`, when present, is a point
	at: "3,4",
};

// An `of` that refines lays its own parts over the target's rather than
// replacing them, so the target's parts survive into the projection.
const point3 = of("a point in space", point, { z: of(Number) });
export const up: Shape<typeof point3> = { x: 1, y: 2, z: 3 };
export const badUp: Shape<typeof point3> = {
	x: 1,
	y: 2,
	// @ts-expect-error the refinement typed `z` as a number
	z: "3",
};
// @ts-expect-error the target's parts are still required
export const flat: Shape<typeof point3> = { z: 3 };

// A `given` projects to the literal it asserts, so code has to reproduce it.
const tagged = def("a node that knows its form", { form: given("concept") });
export const conceptNode: Shape<typeof tagged> = { form: "concept" };
export const badNode: Shape<typeof tagged> = {
	// @ts-expect-error the fact fixed `form` to "concept"
	form: "choice",
};

// Nesting composes: a collection of optionals of a refined shape.
const survey = def("a survey of the plane", {
	readings: many(maybe(of(point3))),
});
export const surveyed: Shape<typeof survey> = {
	readings: [{ x: 1, y: 2, z: 3 }, undefined],
};
export const badSurvey: Shape<typeof survey> = {
	// @ts-expect-error a reading, when present, is a 3-d point
	readings: [{ x: 1, y: 2 }],
};

// ── A choice keeps whatever its cases carry ───────────────────────────────────
// A case whose name is the whole of it contributes that name; a case carved
// further contributes its payload, keyed by the name. The case name is the
// discriminant, so a tagged union needs no reserved tag key.

const enumLike = oneOf("their tier", {
	free: def("no cost"),
	pro: def("paid"),
});
export const tier: Shape<typeof enumLike> = "pro";
// @ts-expect-error a bare-name case still contributes only its name
export const badTier: Shape<typeof enumLike> = { pro: {} };

const shapeChoice = oneOf("a shape", {
	circle: def("round", { radius: of(Number) }),
	square: def("four equal sides", { side: of(Number) }),
});
export const round: Shape<typeof shapeChoice> = { circle: { radius: 2 } };
export const boxy: Shape<typeof shapeChoice> = { square: { side: 2 } };
// @ts-expect-error a carved case carries its payload, not just its name
export const bareTag: Shape<typeof shapeChoice> = "circle";
export const wrongPayload: Shape<typeof shapeChoice> = {
	// @ts-expect-error radius is a number
	circle: { radius: "2" },
};
// @ts-expect-error the payload has to match the case it is keyed under
export const crossed: Shape<typeof shapeChoice> = { circle: { side: 2 } };

// Mixed is honest: each case contributes exactly as much as it was given.
const mixed = oneOf("what it takes on", {
	shape: of(def("a point", { x: of(Number) })),
	token: def("a runtime type token"),
});
export const asToken: Shape<typeof mixed> = "token";
export const asShape: Shape<typeof mixed> = { shape: { x: 1 } };

// ── A keyed `many` is a container decision, not a different former ────────────
const named = many("the concepts, by the name each is bound under", of(String), of(
	def("a node", { title: of(String) }),
));
export const byName: Shape<typeof named> = {
	first: { title: "a" },
	second: { title: "b" },
};
export const badByName: Shape<typeof named> = {
	// @ts-expect-error the element is a node, not a string
	first: "a",
};
// An unkeyed `many` is still a sequence.
const listed = many("some nodes", of(def("a node", { title: of(String) })));
export const inOrder: Shape<typeof listed> = [{ title: "a" }];
