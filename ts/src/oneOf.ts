import { type Concept, kind } from "./concept";
import type { Gap } from "./gap";
import type { Emit, Node } from "./ir";

export function oneOf(...cases: Concept<any, any>[]): Concept<Gap>;
export function oneOf(
	description: string,
	...cases: Concept<any, any>[]
): Concept<Gap>;
export function oneOf(
	a?: string | Concept<any, any>,
	...rest: Concept<any, any>[]
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const cases = typeof a === "string" ? rest : a ? [a, ...rest] : rest;
	return { [kind]: "oneOf", description, cases };
}

export const emitOneOf = (c: Concept<any, any>, e: Emit): Node => ({
	kind: "choice",
	description: c.description,
	cases: (c.cases ?? []).map(e.node),
});
