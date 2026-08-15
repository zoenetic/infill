import type { Concept, TypeOf } from "./concept";

type FillOf<C> = C extends Concept<any, infer F, any> ? F : {};
type AllTrue<U> = [U] extends [true] ? true : false;

/**
 * A decision `D` conforms to spec `S` when its TS-type narrows the spec's
 * (typed leaves can't be contradicted; prose leaves are `unknown`, so free),
 * it covers every spec part (can't drop one), and each part conforms in turn.
 * Resolves to `true` when it holds, `false` otherwise — assign `= true` in the
 * generated file so a non-conforming decision fails tsc.
 */
export type Conforms<D, S> = [TypeOf<D>] extends [TypeOf<S>]
	? [keyof FillOf<S>] extends [keyof FillOf<D>]
		? AllTrue<
				{
					[K in keyof FillOf<S>]: K extends keyof FillOf<D>
						? Conforms<FillOf<D>[K], FillOf<S>[K]>
						: false;
				}[keyof FillOf<S>]
			>
		: false
	: false;
