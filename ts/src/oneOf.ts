import { type Concept, former } from "./concept";
import type { Gap } from "./gap";

type Cases = Record<string, Concept<any, any>>;

export function oneOf(...cases: Concept<any, any>[]): Concept<Gap>;
export function oneOf(
	prompt: string,
	...cases: Concept<any, any>[]
): Concept<Gap>;
export function oneOf<C extends Cases>(
	cases: C,
): Concept<Gap, {}, keyof C & string>;
export function oneOf<C extends Cases>(
	prompt: string,
	cases: C,
): Concept<Gap, {}, keyof C & string>;
export function oneOf(
	a?: string | Concept<any, any> | Cases,
	...rest: Concept<any, any>[]
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const head = typeof a === "string" ? rest[0] : a;
	if (head && !(former in head))
		return { [former]: "oneOf", description, cases: head as Cases };
	const cases =
		typeof a === "string" ? rest : a ? [a as Concept<any, any>, ...rest] : rest;
	return { [former]: "oneOf", description, cases };
}
