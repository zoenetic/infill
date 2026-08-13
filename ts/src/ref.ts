import { type Concept, kind } from "./concept";
import type { Gap } from "./gap";
import type { Emit, Node } from "./ir";

export function ref(to: Concept<any, any>): Concept<Gap>;
export function ref(description: string, to: Concept<any, any>): Concept<Gap>;
export function ref(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<Gap> {
	const description = typeof a === "string" ? a : undefined;
	const to = typeof a === "string" ? b! : a;
	return { [kind]: "ref", description, to };
}

export const emitRef = (c: Concept<any, any>, e: Emit): Node => ({
	kind: "reference",
	description: c.description,
	to: e.nameOf(c.to),
});
