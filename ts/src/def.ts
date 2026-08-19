import { former, type Node } from "./concept.js";
import type { Fill } from "./fill.js";
import type { Gap, Gaps } from "./gap.js";

/** A `def` node: the broadest former, optionally carved into named parts `F`. */
export type Def<F extends Fill = {}> = Node<"def", Gaps<F>, F>;

/** Creates a totally unspecified `def` concept: a bare name with no description and no parts. */
export function def(): Def;
/** Creates a `def` concept specified only by its description, with no named parts. */
export function def(description: string): Def;
/** Creates a `def` concept specified by its named parts `fill`, with no description. */
export function def<F extends Fill>(fill: F): Def<F>;
/** Creates a `def` concept specified by both a description and named parts `fill`. */
export function def<F extends Fill>(description: string, fill: F): Def<F>;
export function def(a?: string | Fill, b?: Fill): Def<any> {
	const description = typeof a === "string" ? a : undefined;
	const fill = typeof a === "string" ? b : a;
	return { [former]: "def", description, fill } as Def<any>;
}
