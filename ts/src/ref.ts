import { type Concept, former } from "./concept";
import type { Gap } from "./gap";

export function ref(to: Concept<any, any>): Concept<Gap>;
export function ref(description: string, to: Concept<any, any>): Concept<Gap>;
export function ref(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<Gap> {
	const description = typeof a === "string" ? a : undefined;
	const to = typeof a === "string" ? b! : a;
	return { [former]: "ref", description, to };
}
