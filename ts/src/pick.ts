import { type Concept, former, type TypeOf } from "./concept";
import type { Gap } from "./gap";

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
		cases: { [key]: cases[key] },
	} as unknown as Concept<Gap, {}, K>;
}
