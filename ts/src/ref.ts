import { type Concept, former, type Node } from "./concept.js";
import type { Gap } from "./gap.js";

/** A `ref` node, carrying the concept it points at so a projection can follow it. */
export type Ref<To> = Node<"ref", Gap, {}, unknown, { readonly to: To }>;

/** Creates a `ref` concept that points at another concept `to`, without restating its structure. */
export function ref<To extends Concept<any, any>>(to: To): Ref<To>;
/** Creates a `ref` concept that points at `to`, with `description` documenting this reference's role. */
export function ref<To extends Concept<any, any>>(
	description: string,
	to: To,
): Ref<To>;
export function ref(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Ref<any> {
	const description = typeof a === "string" ? a : undefined;
	const to = typeof a === "string" ? b! : a;
	return { [former]: "ref", description, to } as Ref<any>;
}
