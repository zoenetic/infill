import { type Concept, former } from "./concept.js";
import type { Gap } from "./gap.js";

/** Creates a `ref` concept that points at another concept `to`, without restating its structure. */
export function ref(to: Concept<any, any>): Concept<Gap>;
/** Creates a `ref` concept that points at `to`, with `description` documenting this reference's role. */
export function ref(description: string, to: Concept<any, any>): Concept<Gap>;
export function ref(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<Gap> {
	const description = typeof a === "string" ? a : undefined;
	const to = typeof a === "string" ? b! : a;
	return { [former]: "ref", description, to };
}
