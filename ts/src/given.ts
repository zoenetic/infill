import { type Concept, former } from "./concept.js";
import type { Gap } from "./gap.js";

/**
 * Asserts decided content — the "this is so" to `def`'s "this is yours". `given`
 * is the far end of the dial: a `def` is entirely open, a `given` is entirely
 * decided, so it carries no gap for the reader to fill. The value is captured as
 * a literal type, so `given("concept")` has type `"concept"`. Its model-facing
 * form is a **fact**.
 */
export function given<const V>(
	value: V,
): Concept<Gap, {}, V> & { readonly [former]: "given" } {
	return { [former]: "given", value } as unknown as Concept<Gap, {}, V> & {
		readonly [former]: "given";
	};
}
