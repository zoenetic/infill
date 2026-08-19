import { type Concept, former, type Node, type TypeOf } from "./concept.js";
import type { Gap } from "./gap.js";

/** A `many` node, carrying its element concept so a projection can reach it. */
export type Many<Inner> = Node<
	"many",
	Gap,
	{},
	TypeOf<Inner>[],
	{ readonly inner: Inner }
>;

/** Creates a `many` concept: an unspecified number of `inner` elements, with no description. */
export function many<Inner extends Concept<any, any>>(
	inner: Inner,
): Many<Inner>;
/** Creates a `many` concept describing a collection of `inner` elements, documented by `description`. */
export function many<Inner extends Concept<any, any>>(
	description: string,
	inner: Inner,
): Many<Inner>;
export function many(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Many<any> {
	const description = typeof a === "string" ? a : undefined;
	const inner = (typeof a === "string" ? b : a) as Concept<any, any>;
	return { [former]: "many", description, inner } as Many<any>;
}
