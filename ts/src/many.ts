import { type Concept, former, type TypeOf } from "./concept";
import type { Gap } from "./gap";

export function many<Inner extends Concept<any, any>>(
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner>[]>;
export function many<Inner extends Concept<any, any>>(
	description: string,
	inner: Inner,
): Concept<Gap, {}, TypeOf<Inner>[]>;
export function many(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const inner = (typeof a === "string" ? b : a) as Concept<any, any>;
	return { [former]: "many", description, inner };
}
