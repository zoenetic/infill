// Type-level tests: checked by `tsc --noEmit` (part of `pnpm test`), not run at
// runtime. `@ts-expect-error` asserts a decision is correctly *rejected*; if the
// check ever stops rejecting it, the unused directive fails the build.

import {
	type Conforms,
	conforms,
	def,
	given,
	many,
	maybe,
	of,
	oneOf,
	pick,
	ref,
} from "./index.js";

const status = oneOf({ active: def("active"), inactive: def("inactive") });

const spec = def("someone who signs in", {
	email: def("their contact address"),
	name: def(),
	status: of(status),
});

// Covers every part, narrows the choice, carves further → conforms.
const good = def("someone who signs in", {
	email: def("their contact address", { format: def("RFC 5322") }),
	name: def("full display name"),
	status: pick(status, "active"),
});
export const _good: Conforms<typeof good, typeof spec, "signer"> = conforms<
	typeof good,
	typeof spec,
	"signer"
>();

// Missing a required part, nothing spurious → `"none"` vs the failing path.
const missing = def("someone who signs in", {
	email: def("their contact address"),
	status: pick(status, "active"),
});
// @ts-expect-error `name` is missing
export const _missing: Conforms<typeof missing, typeof spec, "signer"> =
	conforms<typeof missing, typeof spec, "signer">();
export const _missingExpected: Conforms<typeof missing, typeof spec, "signer"> =
	"signer.name";
export const _missingBlame: "none" = conforms<
	typeof missing,
	typeof spec,
	"signer"
>();

// A spurious part is blamed against the missing one: the error reads
// `Type '"signer.banana"' is not assignable to type '"signer.name"'`.
const spurious = def("someone who signs in", {
	email: def("their contact address"),
	status: pick(status, "active"),
	banana: def("not part of the spec"),
});
// @ts-expect-error `name` is missing; `banana` is spurious
export const _spurious: Conforms<typeof spurious, typeof spec, "signer"> =
	conforms<typeof spurious, typeof spec, "signer">();
export const _spuriousBlame: "signer.banana" = conforms<
	typeof spurious,
	typeof spec,
	"signer"
>();

// Picking a case the choice does not offer is rejected at the pick call.
// @ts-expect-error "banned" is not a case of `status`
export const _badPick = pick(status, "banned");

// A typed leaf whose type doesn't narrow reports the leaf's path.
const portSpec = def("a service", { port: of(Number) });
const portWrong = def("a service", { port: of(String) });
// @ts-expect-error a string leaf doesn't narrow a number leaf
export const _wrongType: Conforms<typeof portWrong, typeof portSpec, "service"> =
	conforms<typeof portWrong, typeof portSpec, "service">();
export const _wrongTypeExpected: Conforms<
	typeof portWrong,
	typeof portSpec,
	"service"
> = "service.port";

// A `given` fact is the spec's to assert; the decision may omit it and conform.
const spdG = def("a signer", {
	email: def("their contact address"),
	pinned: given("no reserved keys, ever"),
});
const decG = def("a signer", { email: def("their contact address") });
export const _givenSkipped: Conforms<typeof decG, typeof spdG, "signer"> =
	conforms<typeof decG, typeof spdG, "signer">();

// ── Conformance reaches past named parts ──────────────────────────────────────
// Each of these was a silent pass before: the check walked a concept's `fill`
// and stopped, so a decision could replace a collection's element, drop the
// optionality off a `maybe`, or gut a choice case from the inside, and `check`
// would still report that the decisions conformed.

const point = def("a point", { x: of(Number), y: of(Number) });

// A collection's element, swapped for something else.
const routeSpec = def("a route", { stops: many(of(point)), home: ref(point) });
const routeSwapped = def("a route", { stops: many(of(String)), home: of(String) });
// @ts-expect-error neither `stops[]` nor `home` narrows what the spec asked for
export const _swapped: Conforms<typeof routeSwapped, typeof routeSpec, "route"> =
	conforms<typeof routeSwapped, typeof routeSpec, "route">();
export const _swappedPaths: "route.stops" | "route.home" = conforms<
	typeof routeSwapped,
	typeof routeSpec,
	"route"
>() as never;

// Refining *inside* a collection's element is narrowing, and conforms.
const routeRefined = def("a route", {
	stops: many(of(point, { label: of(String) })),
	home: ref(point),
});
export const _refined: Conforms<typeof routeRefined, typeof routeSpec, "route"> =
	conforms<typeof routeRefined, typeof routeSpec, "route">();

// An optional made required, carrying a different value.
const locSpec = def("a location", { at: maybe(of(point)) });
const locRequired = def("a location", { at: of(String) });
// @ts-expect-error `at` is optional and a point; this is neither
export const _required: Conforms<typeof locRequired, typeof locSpec, "loc"> =
	conforms<typeof locRequired, typeof locSpec, "loc">();
export const _requiredPath: Conforms<typeof locRequired, typeof locSpec, "loc"> =
	"loc.at";

// A choice case gutted from the inside — the keys still line up, so only a walk
// into the cases catches it. The path uses `emit`'s address for a case.
const shapeSpec = oneOf("a shape", {
	circle: def("round", { radius: of(Number) }),
	square: def("four equal sides", { side: of(Number) }),
});
const shapeGutted = oneOf("a shape", {
	circle: def("round"),
	square: def("four equal sides", { side: of(Number) }),
});
// @ts-expect-error case `circle` dropped its part `radius`
export const _gutted: Conforms<typeof shapeGutted, typeof shapeSpec, "shape"> =
	conforms<typeof shapeGutted, typeof shapeSpec, "shape">();
export const _guttedPath: Conforms<typeof shapeGutted, typeof shapeSpec, "shape"> =
	"shape#circle.radius";

// A case the choice never offered.
const shapeInvented = oneOf("a shape", {
	circle: def("round", { radius: of(Number) }),
	square: def("four equal sides", { side: of(Number) }),
	blob: def("whatever"),
});
// @ts-expect-error `blob` is not one of the cases the spec listed
export const _invented: Conforms<typeof shapeInvented, typeof shapeSpec, "shape"> =
	conforms<typeof shapeInvented, typeof shapeSpec, "shape">();

// Dropping a case is narrowing — the same move `pick` makes — and conforms.
const shapeNarrowed = oneOf("a shape", {
	circle: def("round", { radius: of(Number) }),
});
export const _narrowed: Conforms<typeof shapeNarrowed, typeof shapeSpec, "shape"> =
	conforms<typeof shapeNarrowed, typeof shapeSpec, "shape">();

// An `of` reshaped from a different concept entirely.
const badgeSpec = def("a badge", { at: of(point, { z: of(Number) }) });
const badgeElsewhere = def("a badge", {
	at: of(def("elsewhere", { q: of(String) }), { z: of(Number) }),
});
// @ts-expect-error `at` is shaped from a concept the spec never named
export const _reshaped: Conforms<typeof badgeElsewhere, typeof badgeSpec, "badge"> =
	conforms<typeof badgeElsewhere, typeof badgeSpec, "badge">();

// A decision may omit a `given` — but if it restates one, it restates it
// faithfully. Only the second is a failure.
const factSpec = def("a node", { form: given("concept"), name: of(String) });
const factKept = def("a node", { form: given("concept"), name: of(String) });
export const _factKept: Conforms<typeof factKept, typeof factSpec, "node"> =
	conforms<typeof factKept, typeof factSpec, "node">();
const factBent = def("a node", { form: given("choice"), name: of(String) });
// @ts-expect-error a fact is the spec's to assert; the decision contradicted it
export const _factBent: Conforms<typeof factBent, typeof factSpec, "node"> =
	conforms<typeof factBent, typeof factSpec, "node">();
export const _factBentPath: Conforms<typeof factBent, typeof factSpec, "node"> =
	"node.form";

// Paths address a collection's element and an optional's value the way `emit`
// does, so a failure deep inside one is reported where it happened. These reach
// the coverage walk rather than the projection gate: an optional part may be
// absent, so dropping it leaves the projection assignable and only the walk
// notices.
const routeStops = def("a route", {
	stops: many(def("a stop", { name: of(String), note: maybe(of(String)) })),
});
const routeThin = def("a route", {
	stops: many(def("a stop", { name: of(String) })),
});
// @ts-expect-error the element dropped `note`
export const _element: Conforms<typeof routeThin, typeof routeStops, "route"> =
	conforms<typeof routeThin, typeof routeStops, "route">();
export const _elementPath: Conforms<
	typeof routeThin,
	typeof routeStops,
	"route"
> = "route.stops[].note";

const holder = def("a holder", {
	at: maybe(def("a stop", { name: of(String), note: maybe(of(String)) })),
});
const holderThin = def("a holder", { at: maybe(def("a stop", { name: of(String) })) });
// @ts-expect-error the optional's value dropped `note`
export const _optional: Conforms<typeof holderThin, typeof holder, "holder"> =
	conforms<typeof holderThin, typeof holder, "holder">();
export const _optionalPath: Conforms<typeof holderThin, typeof holder, "holder"> =
	"holder.at?.note";

// Coverage stops at an `of`'s target: a decision that takes a concept's shape
// does not restate that concept's parts, which is exactly what codegen emits.
// The projection gate still holds it — it just isn't a coverage failure.
const stop = def("a stop", { name: of(String), note: maybe(of(String)) });
const viaTarget = def("a route", { stops: many(of(stop)) });
const viaCopy = def("a route", {
	stops: many(of(def("a stop", { name: of(String) }))),
});
export const _throughTarget: Conforms<typeof viaCopy, typeof viaTarget, "route"> =
	conforms<typeof viaCopy, typeof viaTarget, "route">();
