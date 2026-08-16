import type { Concept, former, TypeOf } from "./concept";

type FillOf<C> = C extends Concept<any, infer F, any> ? F : {};
type AllTrue<U> = [U] extends [true] ? true : false;

type IsGiven<C> = [
	C extends { readonly [former]: infer K } ? K : never,
] extends ["given"]
	? true
	: false;

/**Spec keys the decision must cover; every part except the given facts. */
type RequiredKeys<S> = {
	[K in keyof FillOf<S>]: IsGiven<FillOf<S>[K]> extends true ? never : K;
}[keyof FillOf<S>];

/**
 * A decision `D` conforms to spec `S` when its TS-type narrows the spec's
 * (typed leaves can't be contradicted; prose leaves are `unknown`, so free),
 * it covers every spec part (can't drop one), and each part conforms in turn.
 * Resolves to `true` when it holds, `false` otherwise — assign `= true` in the
 * generated file so a non-conforming decision fails tsc.
 */
export type Conforms<D, S> = [TypeOf<D>] extends [TypeOf<S>]
	? [RequiredKeys<S>] extends [keyof FillOf<D>]
		? AllTrue<
				{
					[K in keyof FillOf<S>]: IsGiven<FillOf<S>[K]> extends true
						? true
						: K extends keyof FillOf<D>
							? Conforms<FillOf<D>[K], FillOf<S>[K]>
							: false;
				}[keyof FillOf<S>]
			>
		: false
	: false;
