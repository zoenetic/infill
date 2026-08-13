import { type Concept, kind, type TypeOf } from "./concept";
import type { Gap } from "./gap";
import type { Emit, Node } from "./ir";

export function maybe<Inner extends Concept<any, any>>(
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner> | undefined>;
export function maybe<Inner extends Concept<any, any>>(
	description: string,
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner> | undefined>;
export function maybe(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const inner = (typeof a === "string" ? b : a) as Concept<any, any>;
	return { [kind]: "maybe", description, inner };
}

export const emitMaybe = (c: Concept<any, any>, e: Emit): Node => ({
	kind: "optional",
	description: c.description,
	inner: e.node(c.inner!),
});
