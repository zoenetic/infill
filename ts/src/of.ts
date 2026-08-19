import { type Concept, former, type Node, type TypeOf } from "./concept.js";
import type { Fill } from "./fill.js";
import type { Gap, GapOf, Gaps } from "./gap.js";

/** Extracts the {@link Fill} of concept `C`, defaulting to `{}` if it has none. */
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

/** A runtime token carrying a leaf's type — a scalar constructor, so the type survives erasure and reaches emit/codegen, not just the type checker. */
export type TypeToken =
	| StringConstructor
	| NumberConstructor
	| BooleanConstructor;

/** The value type a {@link TypeToken} stands for. */
export type TokenType<Tok> = Tok extends StringConstructor
	? string
	: Tok extends NumberConstructor
		? number
		: Tok extends BooleanConstructor
			? boolean
			: never;

/**
 * An `of` node that takes on `From`'s shape, refined by fill `F`. It keeps
 * `from` so a projection can merge the target's parts with the refinement's
 * rather than seeing only what was overridden here.
 */
export type Of<From, F extends Fill = {}> = Node<
	"of",
	GapOf<From> | Gaps<F>,
	F,
	TypeOf<From>,
	{ readonly from: From }
>;

/** An `of` leaf typed by a runtime token, which survives erasure into emit, codegen and the projection. */
export type OfToken<Tok> = Node<
	"of",
	Gap,
	{},
	TokenType<Tok>,
	{ readonly token: Tok }
>;

const isToken = (x: unknown): x is TypeToken =>
	x === String || x === Number || x === Boolean;

/**
 * Creates an `of` leaf whose type is a runtime token (`of(String)`).
 *
 * Every `of` takes something on — a concept's shape, or a token's type. There is
 * deliberately no way to type a leaf from the spec's source alone: a type the
 * checker can see but `emit`, `gen` and `check` cannot is a leaf the framework
 * would silently stop holding. For anything a token doesn't cover, describe the
 * structure with the other formers — a `def` with parts, a `oneOf` of cases —
 * which every stage can read.
 */
export function of<Tok extends TypeToken>(token: Tok): OfToken<Tok>;
/** Creates a token-typed `of` leaf, documented by `description`. */
export function of<Tok extends TypeToken>(
	description: string,
	token: Tok,
): OfToken<Tok>;
/** Creates an `of` concept that takes on the shape of `from`, without refining or adding any parts. */
export function of<C extends Concept<any, any>>(from: C): Of<C>;
/** Creates an `of` concept that takes on the shape of `from`, refining or adding parts via `fill`. */
export function of<C extends Concept<any, any>, F extends Fill>(
	from: C,
	fill: F & Narrows<F, FillOf<C>>,
): Of<C, F>;
/** Creates an `of` concept that takes on the shape of `from`, documented by `description`. */
export function of<C extends Concept<any, any>>(
	description: string,
	from: C,
): Of<C>;
/** Creates an `of` concept that takes on the shape of `from`, documented by `description` and refined by `fill`. */
export function of<C extends Concept<any, any>, F extends Fill>(
	description: string,
	from: C,
	fill: F & Narrows<F, FillOf<C>>,
): Of<C, F>;
export function of(
	a?: string | Concept<any, any> | TypeToken,
	b?: Concept<any, any> | Fill | TypeToken,
	c?: Fill,
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const second = typeof a === "string" ? b : a;
	const fill = (typeof a === "string" ? c : b) as Fill | undefined;
	if (isToken(second)) return { [former]: "of", description, token: second };
	// The overloads above already rule this out; the guard is for a spec written
	// in plain JavaScript, where a from-less `of` would otherwise reach `emit` and
	// `codegen` as a leaf neither can read.
	if (typeof second !== "object" || second === null || !(former in second))
		throw new TypeError(
			"of() takes on a concept's shape or a token's type — pass a concept, or String, Number or Boolean. For an untyped gap, use def().",
		);
	return {
		[former]: "of",
		description,
		from: second as Concept<any, any>,
		fill,
	};
}
