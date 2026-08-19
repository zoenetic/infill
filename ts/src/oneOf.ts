import { type Concept, former, type Node } from "./concept.js";
import type { Gap } from "./gap.js";

type Cases = Record<string, Concept<any, any>>;

/**
 * A `oneOf` node, carrying its cases so a projection can reach them. A keyed
 * choice projects to its case-key union; a positional one to the union of its
 * cases' own projections.
 */
export type Choice<C, T> = Node<
	"oneOf",
	Gap,
	{},
	T,
	{ readonly cases: C }
>;

/** Creates a `oneOf` concept: exactly one of the given `cases`, an exhaustive list, with no description. */
export function oneOf<const Cs extends readonly Concept<any, any>[]>(
	...cases: Cs
): Choice<Cs, unknown>;
/** Creates a `oneOf` concept documented by `description`, choosing exactly one of `cases`. */
export function oneOf<const Cs extends readonly Concept<any, any>[]>(
	prompt: string,
	...cases: Cs
): Choice<Cs, unknown>;
/** Creates a keyed `oneOf` concept: exactly one of the named `cases`. */
export function oneOf<C extends Cases>(cases: C): Choice<C, keyof C & string>;
/** Creates a keyed `oneOf` concept documented by `prompt`. */
export function oneOf<C extends Cases>(
	prompt: string,
	cases: C,
): Choice<C, keyof C & string>;
export function oneOf(
	a?: string | Concept<any, any> | Cases,
	...rest: Concept<any, any>[]
): Choice<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const head = typeof a === "string" ? rest[0] : a;
	if (head && !(former in head))
		return {
			[former]: "oneOf",
			description,
			cases: head as Cases,
		} as Choice<any, any>;
	const cases =
		typeof a === "string" ? rest : a ? [a as Concept<any, any>, ...rest] : rest;
	return { [former]: "oneOf", description, cases } as Choice<any, any>;
}
