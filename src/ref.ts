import { type Concept, kind } from "./concept";
import type { Gap } from "./gap";

export function ref(to: Concept<any, any>): Concept<Gap>;
export function ref(prompt: string, to: Concept<any, any>): Concept<Gap>;
export function ref(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<Gap> {
	const prompt = typeof a === "string" ? a : undefined;
	const to = typeof a === "string" ? b! : a;
	return { [kind]: "ref", prompt, to };
}
