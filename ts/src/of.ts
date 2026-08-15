import { type Concept, former, type TypeOf } from "./concept";
import type { Fill } from "./fill";
import type { Gap, GapOf, Gaps } from "./gap";

type FillOf<C> = C extends Concept<any, infer F, any> ? F : {};

/**
 * Guards an `of` override fill `F` against the target's fill `P`. For a key
 * shared with `P`, the override may only carve *further* — its gap set must be
 * a superset of the target's at that key (`GapOf<P[K]> extends GapOf<F[K]>`), so
 * it can add sub-gaps but never drop one the target declared ("err toward
 * completeness"). Keys not in `P` are new positions and unconstrained.
 */
type Narrows<F extends Fill, P extends Fill> = {
	[K in keyof F]: K extends keyof P
		? GapOf<P[K]> extends GapOf<F[K]>
			? F[K]
			: never
		: F[K];
};

export function of<T>(): Concept<Gap, {}, T>;
export function of<T>(description: string): Concept<Gap, {}, T>;
export function of<C extends Concept<any, any>>(
	from: C,
): Concept<GapOf<C>, {}, TypeOf<C>>;
export function of<C extends Concept<any, any>, F extends Fill>(
	from: C,
	fill: F & Narrows<F, FillOf<C>>,
): Concept<GapOf<C> | Gaps<F>, F, TypeOf<C>>;
export function of<C extends Concept<any, any>>(
	description: string,
	from: C,
): Concept<GapOf<C>, {}, TypeOf<C>>;
export function of<C extends Concept<any, any>, F extends Fill>(
	description: string,
	from: C,
	fill: F & Narrows<F, FillOf<C>>,
): Concept<GapOf<C> | Gaps<F>, F, TypeOf<C>>;
export function of(
	a?: string | Concept<any, any>,
	b?: Concept<any, any> | Fill,
	c?: Fill,
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const from = (typeof a === "string" ? b : a) as Concept<any, any> | undefined;
	const fill = typeof a === "string" ? c : (b as Fill | undefined);
	return { [former]: "of", description, from, fill };
}
