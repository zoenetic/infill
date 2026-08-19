import { type Concept, former, type TypeOf } from "./concept.js";
import type { Fill } from "./fill.js";
import type { TokenType } from "./of.js";

/** Extracts the {@link Fill} of concept `C`, defaulting to `{}` if it has none. */
type FillOf<C> = C extends Concept<any, infer F, any> ? F : {};

/** True when `C` is a `maybe` part, so its key projects to an optional property. */
type IsMaybe<C> = [
	C extends { readonly [former]: infer K } ? K : never,
] extends ["maybe"]
	? true
	: false;

/** Collapses an intersection of object types into one, preserving `?` modifiers. */
type Flatten<T> = { [K in keyof T]: T[K] };

/** Projects a concept's named parts into an object type; a `maybe` part becomes an optional key. */
type Parts<F extends Fill> = Flatten<
	{
		[K in keyof F as IsMaybe<F[K]> extends true ? never : K]: Shape<F[K]>;
	} & {
		[K in keyof F as IsMaybe<F[K]> extends true ? K : never]?: Shape<F[K]>;
	}
>;

/** Lays refinement `B` over target projection `A`; a refined key wins, and a target that isn't an object is replaced outright. */
type Merge<A, B> = [A] extends [object]
	? [B] extends [object]
		? Flatten<Omit<A, keyof B> & B>
		: B
	: B;

/** A choice projects to its case-key union when keyed, or to the union of its cases' own projections when positional. */
/**
 * A case contributes its *name* when the name is all there is to it, and its
 * payload keyed by that name when the case was carved further. No reserved tag
 * key: the case name is the discriminant, which is what `namesAreContent` says
 * it already was.
 */
type CaseShape<K, Case> = [unknown] extends [Shape<Case>]
	? K & string
	: { [P in K & string]: Shape<Case> };

type ChoiceShape<C> = C extends { readonly cases: infer Cs }
	? Cs extends readonly unknown[]
		? Shape<Cs[number]>
		: { [K in keyof Cs]: CaseShape<K, Cs[K]> }[keyof Cs]
	: unknown;

/**
 * An `of` projects through whatever gave it its type: a target concept's shape,
 * with this node's parts laid over it, or a runtime token's type. Those are the
 * only two ways to build one, so there is no third case — a node with neither is
 * malformed, and `never` says so where `unknown` would quietly wave it through.
 */
type OfShape<C> = C extends { readonly from: infer From }
	? [keyof FillOf<C>] extends [never]
		? Shape<From>
		: Merge<Shape<From>, Parts<FillOf<C>>>
	: C extends { readonly token: infer Tok }
		? TokenType<Tok>
		: never;

/**
 * Projects a concept `C` into the concrete TypeScript type its implementation
 * must satisfy — the phase-2 bridge from a spec (or a set of decisions) to real
 * code.
 *
 * The projection is **total**: every former has a rule, so a nested spec
 * projects as far down as it is specified rather than bottoming out at
 * `unknown` the moment it stops being a flat object of leaves.
 *
 * - a `def` with named parts becomes an object of projected parts, and one
 *   without becomes `unknown` — an untyped prose gap the checker leaves open;
 * - a `ref` projects through the concept it points at;
 * - an `of` projects through its target, with its own parts laid over that
 *   target's, or to its token's type (`of(String)` -> `string`);
 * - a `many` becomes an array of its element's projection, or — when it names a
 *   key concept — a record from that key's projection to its element's;
 * - a `maybe` becomes its value's projection or `undefined`, and as a named part
 *   an optional key (`key?:`) rather than a required `key: T | undefined`;
 * - a `oneOf` becomes its case-key union, which a `pick` narrows to one literal;
 * - a `given` becomes the literal value it asserts.
 *
 * So the checker polices exactly as much of the implementation as the spec chose
 * to type — and no less, at any depth.
 */
export type Shape<C> = C extends { readonly [former]: infer K }
	? K extends "given"
		? C extends { readonly value: infer V }
			? V
			: unknown
		: K extends "ref"
			? C extends { readonly to: infer To }
				? Shape<To>
				: unknown
			: K extends "many"
				? C extends { readonly key: infer Ky; readonly inner: infer I }
					? Record<Shape<Ky> & PropertyKey, Shape<I>>
					: C extends { readonly inner: infer I }
						? Shape<I>[]
						: unknown[]
				: K extends "maybe"
					? C extends { readonly inner: infer I }
						? Shape<I> | undefined
						: unknown
					: K extends "oneOf"
						? ChoiceShape<C>
						: K extends "of"
							? OfShape<C>
							: [keyof FillOf<C>] extends [never]
								? TypeOf<C>
								: Parts<FillOf<C>>
	: never;
