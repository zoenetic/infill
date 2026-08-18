import type { Concept, former, TypeOf } from "./concept";

type FillOf<C> = C extends Concept<any, infer F, any> ? F : {};

type IsGiven<C> = [
	C extends { readonly [former]: infer K } ? K : never,
] extends ["given"]
	? true
	: false;

/** Spec keys the decision must cover: every part except the `given` facts. */
type RequiredKeys<S> = {
	[K in keyof FillOf<S>]: IsGiven<FillOf<S>[K]> extends true ? never : K;
}[keyof FillOf<S>];

/**
 * The dotted paths (prefixed by `P`) of the concepts under `S` that decision `D`
 * fails to conform to — a missing part, or a leaf whose type doesn't narrow;
 * `never` when every part conforms. A conforming part yields `never` and drops
 * out of the union automatically.
 */
type Fails<D, S, P extends string> = [TypeOf<D>] extends [TypeOf<S>]
	? [RequiredKeys<S>] extends [keyof FillOf<D>]
		? PartFails<FillOf<D>, FillOf<S>, P>
		: `${P}.${Exclude<RequiredKeys<S>, keyof FillOf<D>> & string}`
	: P;

type PartFails<FD, FS, P extends string> = {
	[K in keyof FS]: IsGiven<FS[K]> extends true
		? never
		: K extends keyof FD
			? Fails<FD[K], FS[K], `${P}.${K & string}`>
			: never;
}[keyof FS];

/**
 * The dotted paths of parts the decision added that the spec has no place for —
 * this level's extra keys, plus any nested under a shared key. `never` when the
 * decision invents nothing. These are what a developer *tried* to assert.
 */
type Extras<D, S, P extends string> =
	| `${P}.${Exclude<keyof FillOf<D>, keyof FillOf<S>> & string}`
	| {
			[K in keyof FillOf<S> & keyof FillOf<D>]: Extras<
				FillOf<D>[K],
				FillOf<S>[K],
				`${P}.${K & string}`
			>;
	  }[keyof FillOf<S> & keyof FillOf<D>];

/**
 * A decision `D` conforms to spec `S`, rooted at the concept named `Root`, when
 * its type narrows the spec's (typed leaves can't be contradicted; prose leaves
 * are `unknown`, so free), it covers every part, and each part conforms in turn.
 * Resolves to `"conforms"` when it holds, otherwise to the dotted path(s) of the
 * failing spec concept(s) — the *expected* side of the tsc error.
 */
export type Conforms<D, S, Root extends string = "spec"> = [
	Fails<D, S, Root>,
] extends [never]
	? "conforms"
	: Fails<D, S, Root>;

/**
 * The blame counterpart asserted against {@link Conforms}: `"conforms"` when the
 * decision holds, else the extra path(s) the decision invented, or `"none"` when
 * there is nothing to blame. It lands on the *left* of the error, so a mis-named
 * part reads `Type '"account.banana"' is not assignable to type
 * '"account.seats"'`, and an honest omission reads `Type '"none"' is not
 * assignable to type '"account.seats"'`.
 */
type Blame<D, S, Root extends string> = [Fails<D, S, Root>] extends [never]
	? "conforms"
	: [Extras<D, S, Root>] extends [never]
		? "none"
		: Extras<D, S, Root>;

/**
 * The value a decisions file assigns to its conformance assertion: it types as
 * the decision's blame, so `_x: Conforms<D, S, "root"> = conforms<D, S, "root">()`
 * fails tsc with both sides named — what you wrote, and what the spec wanted.
 */
export function conforms<
	D,
	S,
	Root extends string = "spec",
>(): Blame<D, S, Root> {
	return "conforms" as unknown as Blame<D, S, Root>;
}
