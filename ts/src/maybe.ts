import { type Concept, former, type Node, type TypeOf } from "./concept.js";
import type { Gap } from "./gap.js";

/** A `maybe` node, carrying the concept it makes optional so a projection can reach it. */
export type Maybe<Inner> = Node<
	"maybe",
	Gap,
	{},
	TypeOf<Inner> | undefined,
	{ readonly inner: Inner }
>;

/** Creates a `maybe` concept: `inner`, possibly absent, with no description. */
export function maybe<Inner extends Concept<any, any>>(
	inner: Inner,
): Maybe<Inner>;
/** Creates a `maybe` concept wrapping `inner` as possibly absent, documented by `description`. */
export function maybe<Inner extends Concept<any, any>>(
	description: string,
	inner: Inner,
): Maybe<Inner>;
export function maybe(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Maybe<any> {
	const description = typeof a === "string" ? a : undefined;
	const inner = (typeof a === "string" ? b : a) as Concept<any, any>;
	return { [former]: "maybe", description, inner } as Maybe<any>;
}
