import { type Concept, former, type TypeOf } from "./concept.js";
import type { Gap } from "./gap.js";

/** The cases a keyed choice offers */
export type CasesOf<C> = TypeOf<C> & string;

/** Pick a keyed choice by naming one of its cases */
export function pick<C extends Concept<any, any>, K extends CasesOf<C>>(
	choice: C,
	key: K,
): Concept<Gap, {}, K> {
	const cases = (choice.cases ?? {}) as Record<string, Concept<any, any>>;
	return {
		[former]: "oneOf",
		// Inherit the choice's description (a pick of `plan` is still "the plan")
		// and remember the origin choice, so codegen can round-trip this as
		// pick(origin, key) rather than a hand-rolled single-case oneOf. The
		// description is derived, not authored, so it need not survive in the
		// regenerated call — re-running pick re-derives it from the origin.
		description: choice.description,
		to: choice,
		cases: { [key]: cases[key] },
	} as unknown as Concept<Gap, {}, K>;
}
