import { type Concept, former, type TypeOf } from "./concept";
import type { Gap } from "./gap";

/** Creates a `maybe` concept: `inner`, possibly absent, with no description. */
export function maybe<Inner extends Concept<any, any>>(
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner> | undefined> & { readonly [former]: "maybe" };
/** Creates a `maybe` concept wrapping `inner` as possibly absent, documented by `description`. */
export function maybe<Inner extends Concept<any, any>>(
	description: string,
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner> | undefined> & { readonly [former]: "maybe" };
export function maybe(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const inner = (typeof a === "string" ? b : a) as Concept<any, any>;
	return { [former]: "maybe", description, inner };
}
