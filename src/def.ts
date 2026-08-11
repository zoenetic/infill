import { type Concept, kind } from "./concept";
import type { Fill } from "./fill";
import type { Gap, Gaps } from "./gap";

export function def(): Concept<Gap>;
export function def(prompt: string): Concept<Gap>;
export function def<F extends Fill>(fill: F): Concept<Gaps<F>, F>;
export function def<F extends Fill>(
	prompt: string,
	fill: F,
): Concept<Gaps<F>, F>;
export function def(a?: string | Fill, b?: Fill): Concept<any, any> {
	const prompt = typeof a === "string" ? a : undefined;
	const fill = typeof a === "string" ? b : a;
	return { [kind]: "def", prompt, fill };
}
