// Type-level tests: checked by `tsc --noEmit` (part of `pnpm test`), not run at
// runtime. `@ts-expect-error` asserts a decision is correctly *rejected*; if the
// check ever stops rejecting it, the unused directive fails the build.

import { type Conforms, conforms, def, given, of, oneOf, pick } from "./index.js";

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
const portSpec = def("a service", { port: of<number>() });
const portWrong = def("a service", { port: of<string>() });
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
