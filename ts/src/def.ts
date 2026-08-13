import { type Concept, kind } from "./concept";
import type { Fill } from "./fill";
import type { Gap, Gaps } from "./gap";
import type { Emit, Node } from "./ir";

export function def(): Concept<Gap>;
export function def(description: string): Concept<Gap>;
export function def<F extends Fill>(fill: F): Concept<Gaps<F>, F>;
export function def<F extends Fill>(
	description: string,
	fill: F,
): Concept<Gaps<F>, F>;
export function def(a?: string | Fill, b?: Fill): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const fill = typeof a === "string" ? b : a;
	return { [kind]: "def", description, fill };
}

export const emitDef = (c: Concept<any, any>, e: Emit): Node => ({
	kind: "concept",
	description: c.description,
	fill: e.fields(c.fill),
});
