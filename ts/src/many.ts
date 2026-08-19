import { type Concept, former, type Node, type TypeOf } from "./concept.js";
import type { Gap } from "./gap.js";

/**
 * A `many` node, carrying its element concept so a projection can reach it, and
 * — when the collection is keyed — the concept its keys take.
 *
 * `many` is multiplicity, not a list: its own reading says the count *and the
 * container* are open. Naming a key concept decides the container as keyed by
 * that key, which is the same `def … given` dial applied to the container rather
 * than a separate former.
 */
export type Many<Inner, Key = never> = Node<
	"many",
	Gap,
	{},
	TypeOf<Inner>[],
	{ readonly inner: Inner } & ([Key] extends [never]
		? unknown
		: { readonly key: Key })
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
/** Creates a keyed `many`: some number of `inner`, each addressed by a `key` — a name that is part of the content, not just an index. */
export function many<Key extends Concept<any, any>, Inner extends Concept<any, any>>(
	key: Key,
	inner: Inner,
): Many<Inner, Key>;
/** Creates a keyed `many`, documented by `description`. */
export function many<Key extends Concept<any, any>, Inner extends Concept<any, any>>(
	description: string,
	key: Key,
	inner: Inner,
): Many<Inner, Key>;
export function many(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
	c?: Concept<any, any>,
): Many<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const rest = (typeof a === "string" ? [b, c] : [a, b]).filter(
		(x): x is Concept<any, any> => x !== undefined,
	);
	// One operand is the element; two are the key and then the element.
	const [key, inner] = rest.length === 2 ? rest : [undefined, rest[0]];
	return { [former]: "many", description, key, inner } as Many<any, any>;
}
