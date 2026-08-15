import { type Concept, former } from "./concept";
import type { Fill } from "./fill";
import type { Gap, Gaps } from "./gap";

/** Creates a totally unspecified `def` concept: a bare name with no description and no parts. */
export function def(): Concept<Gap>;
/** Creates a `def` concept specified only by its description, with no named parts. */
export function def(description: string): Concept<Gap>;
/** Creates a `def` concept specified by its named parts `fill`, with no description. */
export function def<F extends Fill>(fill: F): Concept<Gaps<F>, F>;
/** Creates a `def` concept specified by both a description and named parts `fill`. */
export function def<F extends Fill>(
	description: string,
	fill: F,
): Concept<Gaps<F>, F>;
export function def(a?: string | Fill, b?: Fill): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const fill = typeof a === "string" ? b : a;
	return { [former]: "def", description, fill };
}
