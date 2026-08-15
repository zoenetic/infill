import { type Concept, former } from "./concept";
import type { Fill } from "./fill";
import type { Gap, Gaps } from "./gap";

/** defines a concept */
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
	return { [former]: "def", description, fill };
}
