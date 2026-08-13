import { type Concept, kind } from "./concept";
import type { Fill } from "./fill";
import type { Gap, GapOf, Gaps } from "./gap";

type FillOf<C> = C extends Concept<any, infer F, any> ? F : {};
type ShapeOf<C> = C extends Concept<any, any, infer T> ? T : unknown;

type Narrows<F extends Fill, P extends Fill> = {
	[K in keyof F]: K extends keyof P
		? GapOf<P[K]> extends GapOf<F[K]>
			? F[K]
			: never
		: F[K];
};

export function of<T>(): Concept<Gap, {}, T>;
export function of<T>(prompt: string): Concept<Gap, {}, T>;
export function of<C extends Concept<any, any>>(
	to: C,
): Concept<GapOf<C>, {}, ShapeOf<C>>;
export function of<C extends Concept<any, any>, F extends Fill>(
	to: C,
	fill: F & Narrows<F, FillOf<C>>,
): Concept<GapOf<C> | Gaps<F>, F, ShapeOf<C>>;
export function of<C extends Concept<any, any>>(
	prompt: string,
	to: C,
): Concept<GapOf<C>, {}, ShapeOf<C>>;
export function of<C extends Concept<any, any>, F extends Fill>(
	prompt: string,
	to: C,
	fill: F & Narrows<F, FillOf<C>>,
): Concept<GapOf<C> | Gaps<F>, F, ShapeOf<C>>;
export function of(
	a?: string | Concept<any, any>,
	b?: Concept<any, any> | Fill,
	c?: Fill,
): Concept<any, any> {
	const prompt = typeof a === "string" ? a : undefined;
	const to = (typeof a === "string" ? b : a) as Concept<any, any> | undefined;
	const fill = typeof a === "string" ? c : (b as Fill | undefined);
	return { [kind]: "of", prompt, to, fill };
}
