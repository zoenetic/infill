// Type-level tests: checked by `tsc --noEmit` (part of `pnpm test`), not run at
// runtime. `@ts-expect-error` asserts a decision is correctly *rejected*; if the
// check ever stops rejecting it, the unused directive fails the build.

import { type Conforms, def, given, of, oneOf, pick } from "./index";

const status = oneOf({ active: def("active"), inactive: def("inactive") });

const spec = def("someone who signs in", {
	email: def("their contact address"),
	name: def(),
	status: of(status),
});

// A decision that carves further, narrows a choice, and covers every part conforms.
const good = def("someone who signs in", {
	email: def("their contact address", { format: def("RFC 5322") }),
	name: def("full display name"),
	status: pick(status, "active"),
});
export const _good: Conforms<typeof good, typeof spec> = true;

// Dropping a required part does not conform.
const missingPart = def("someone who signs in", {
	email: def("their contact address"),
	status: pick(status, "active"),
});
// @ts-expect-error `name` is missing
export const _missingPart: Conforms<typeof missingPart, typeof spec> = true;

// Picking a case the choice does not offer is rejected at the pick call.
// @ts-expect-error "banned" is not a case of `status`
export const _badPick = pick(status, "banned");

const spdG = def("a signer", {
	email: def("their contact address"),
	pinned: given("no reserved keys, ever"),
});
// The decision omits the given fact entirely — it's the spec's to assert, not the model's.
const decG = def("a signer", { email: def("their contact address") });
export const _givenSkipped: Conforms<typeof decG, typeof spdG> = true;
