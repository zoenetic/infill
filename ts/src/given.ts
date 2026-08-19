import { former, type Node } from "./concept.js";
import type { Gap } from "./gap.js";

/** A `given` node, carrying its asserted value as a literal type. */
export type Given<V> = Node<"given", Gap, {}, V, { readonly value: V }>;

/**
 * Asserts decided content — the "this is so" to `def`'s "this is yours". `given`
 * is the far end of the dial: a `def` is entirely open, a `given` is entirely
 * decided, so it carries no gap for the reader to fill. The value is captured as
 * a literal type, so `given("concept")` has type `"concept"`. Its model-facing
 * form is a **fact**, and it projects to that literal — code assigned the
 * projection has to reproduce the fact exactly.
 */
export function given<const V>(value: V): Given<V> {
	return { [former]: "given", value } as unknown as Given<V>;
}
