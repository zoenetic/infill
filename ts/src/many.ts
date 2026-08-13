import { type Concept, kind, type TypeOf } from "./concept";
import type { Gap } from "./gap";
import type { Emit, Node } from "./ir";

export function many<Inner extends Concept<any, any>>(
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner>[]>;
export function many<Inner extends Concept<any, any>>(
	description: string,
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner>[]>;
export function many(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const inner = (typeof a === "string" ? b : a) as Concept<any, any>;
	return { [kind]: "many", description, inner };
}

export const emitMany = (c: Concept<any, any>, e: Emit): Node => ({
	kind: "collection",
	description: c.description,
	inner: e.node(c.inner!),
});
