import { type Concept, kind } from "./concept";
import type { Fill } from "./fill";
import type { Gap, GapOf, Gaps } from "./gap";

export function is<T extends Concept<any, any>>(to: T): Concept<GapOf<T>>;
export function is<T extends Concept<any, any>, F extends Fill>(
	to: T,
	fill: F,
): Concept<GapOf<T> | Gaps<F>, F>;
export function is<T extends Concept<any, any>>(
	prompt: string,
	to: T,
): Concept<GapOf<T>>;
export function is<T extends Concept<any, any>, F extends Fill>(
	prompt: string,
	to: T,
	fill: F,
): Concept<GapOf<T> | Gaps<F>, F>;
export function is(
	a: string | Concept<any, any>,
	b?: Concept<any, any> | Fill,
	c?: Fill,
): Concept<any, any> {
	const prompt = typeof a === "string" ? a : undefined;
	const to = (typeof a === "string" ? b : a) as Concept<any, any>;
	const fill = typeof a === "string" ? c : (b as Fill | undefined);
	return { [kind]: "is", prompt, to, fill };
}
