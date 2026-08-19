import type { Concept, former } from "./concept.js";
import type { Shape } from "./shape.js";

type FillOf<C> = C extends Concept<any, infer F, any> ? F : {};

type IsGiven<C> = [
	C extends { readonly [former]: infer K } ? K : never,
] extends ["given"]
	? true
	: false;

/** Spec keys the decision must cover: every part except the `given` facts, which are the spec's to assert. */
type RequiredKeys<S> = {
	[K in keyof FillOf<S>]: IsGiven<FillOf<S>[K]> extends true ? never : K;
}[keyof FillOf<S>];

/**
 * The concept a node points through — an `of`'s target or a `ref`'s — projected.
 * `unknown` when the node points nowhere, which is what makes the target gate
 * below vacuous for a spec node that has no target and failing for a decision
 * that dropped one the spec had.
 */
type Target<C> = C extends { readonly from: infer X }
	? Shape<X>
	: C extends { readonly to: infer X }
		? Shape<X>
		: unknown;

/** The path marker a wrapper appends, matching the addresses `emit` prints: `[]` for a collection's element, `?` for an optional's value. */
type Mark<S> = [
	S extends { readonly [former]: infer K } ? K : never,
] extends ["many"]
	? "[]"
	: "?";

/**
 * The gate on a node's own content, as opposed to its children's.
 *
 * A node that points through a target (`of`, `ref`) must still point somewhere
 * whose projection the decision's target narrows — that is what stops a decision
 * swapping out the concept a spec node was shaped from. A node with no named
 * parts is a leaf, and its whole meaning is its projection, so the decision's
 * must narrow the spec's.
 *
 * A node *with* named parts is left to the per-part recursion below, which
 * reports a precise path instead of blaming the whole subtree — and which lets a
 * decision omit a `given` fact, as {@link RequiredKeys} allows.
 */
type Holds<D, S> = [Target<D>] extends [Target<S>]
	? [keyof FillOf<S>] extends [never]
		? [Shape<D>] extends [Shape<S>]
			? true
			: false
		: true
	: false;

/**
 * The dotted paths (prefixed by `P`) of the concepts under `S` that decision `D`
 * fails to conform to — a missing part, a leaf whose projection doesn't narrow,
 * a collection or optional whose value was replaced, or a case the choice never
 * offered; `never` when everything conforms. A conforming part yields `never`
 * and drops out of the union automatically.
 */
type Fails<D, S, P extends string> = Holds<D, S> extends true
	?
			| MissingFails<D, S, P>
			| PartFails<FillOf<D>, FillOf<S>, P>
			| InnerFails<D, S, P>
			| CaseFails<D, S, P>
	: P;

/** The spec parts the decision never covered. */
type MissingFails<D, S, P extends string> = [RequiredKeys<S>] extends [
	keyof FillOf<D>,
]
	? never
	: `${P}.${Exclude<RequiredKeys<S>, keyof FillOf<D>> & string}`;

/**
 * Each part the decision does carry, checked against the spec's. A `given` is
 * exempt from *coverage* ({@link RequiredKeys}) — asserting a fact is the spec's
 * job, not the decision's — but a decision that restates one has to restate it
 * faithfully, so a part present here is checked whatever its former.
 */
type PartFails<FD, FS, P extends string> = {
	[K in keyof FS]: K extends keyof FD
		? Fails<FD[K], FS[K], `${P}.${K & string}`>
		: never;
}[keyof FS];

/** A collection's element or an optional's value: the decision must keep one, and it must conform. */
type InnerFails<D, S, P extends string> = S extends {
	readonly inner: infer SI;
}
	? D extends { readonly inner: infer DI }
		? Fails<DI, SI, `${P}${Mark<S>}`>
		: P
	: never;

/**
 * A choice's cases. The decision may drop cases — that is narrowing, and what
 * `pick` does — but every case it keeps must conform, and it may not introduce
 * one the spec never offered. Positional cases carry no keys to address, so they
 * are left to the projection gate.
 */
type CaseFails<D, S, P extends string> = S extends { readonly cases: infer SC }
	? SC extends readonly unknown[]
		? never
		: D extends { readonly cases: infer DC }
			? DC extends readonly unknown[]
				? P
				:
						| `${P}#${Exclude<keyof DC, keyof SC> & string}`
						| {
								[K in keyof SC & keyof DC & string]: Fails<
									DC[K],
									SC[K],
									`${P}#${K}`
								>;
							}[keyof SC & keyof DC & string]
			: P
	: never;

/**
 * A decision `D` conforms to spec `S`, rooted at the concept named `Root`, when
 * every concept the spec names survives in it: covered, narrowed rather than
 * contradicted, and recursively conforming — through a collection's element, an
 * optional's value and a choice's cases, not only through named parts.
 * Resolves to `"conforms"` when it holds, otherwise to the path(s) of the
 * failing spec concept(s) — the *expected* side of the tsc error — addressed the
 * way `emit` addresses them: `.part`, `[]`, `?`, `#case`.
 */
export type Conforms<D, S, Root extends string = "spec"> = [
	Fails<D, S, Root>,
] extends [never]
	? "conforms"
	: Fails<D, S, Root>;

/**
 * The dotted paths of parts the decision added that the spec has no place for —
 * this level's extra keys and extra cases, plus any nested under a shared key.
 * `never` when the decision invents nothing. These are what a developer *tried*
 * to assert.
 */
type Extras<D, S, P extends string> =
	| `${P}.${Exclude<keyof FillOf<D>, keyof FillOf<S>> & string}`
	| ExtraCases<D, S, P>
	| {
			[K in keyof FillOf<S> & keyof FillOf<D>]: Extras<
				FillOf<D>[K],
				FillOf<S>[K],
				`${P}.${K & string}`
			>;
	  }[keyof FillOf<S> & keyof FillOf<D>];

type ExtraCases<D, S, P extends string> = S extends {
	readonly cases: infer SC;
}
	? SC extends readonly unknown[]
		? never
		: D extends { readonly cases: infer DC }
			? DC extends readonly unknown[]
				? never
				: `${P}#${Exclude<keyof DC, keyof SC> & string}`
			: never
	: never;

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
