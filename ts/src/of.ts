import { type Concept, former, type TypeOf } from "./concept";
import type { Fill } from "./fill";
import type { Gap, GapOf, Gaps } from "./gap";

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
export type TypeToken = StringConstructor | NumberConstructor | BooleanConstructor;

/** The value type a {@link TypeToken} stands for. */
export type TokenType<Tok> = Tok extends StringConstructor
	? string
	: Tok extends NumberConstructor
		? number
		: Tok extends BooleanConstructor
			? boolean
			: never;

const isToken = (x: unknown): x is TypeToken =>
	x === String || x === Number || x === Boolean;

/** Creates a totally unspecified `of` concept describing a value of type `T`, with no shape taken from another concept. */
export function of<T>(): Concept<Gap, {}, T>;
/** Creates an `of` concept describing a value of type `T`, specified only by its description. */
export function of<T>(description: string): Concept<Gap, {}, T>;
/** Creates an `of` leaf whose type is a runtime token (`of(String)`) — visible to emit and validation, not only the type checker. */
export function of<Tok extends TypeToken>(
	token: Tok,
): Concept<Gap, {}, TokenType<Tok>>;
/** Creates a token-typed `of` leaf, documented by `description`. */
export function of<Tok extends TypeToken>(
	description: string,
	token: Tok,
): Concept<Gap, {}, TokenType<Tok>>;
/** Creates an `of` concept that takes on the shape of `from`, without refining or adding any parts. */
export function of<C extends Concept<any, any>>(
	from: C,
): Concept<GapOf<C>, {}, TypeOf<C>>;
/** Creates an `of` concept that takes on the shape of `from`, refining or adding parts via `fill`. */
export function of<C extends Concept<any, any>, F extends Fill>(
	from: C,
	fill: F & Narrows<F, FillOf<C>>,
): Concept<GapOf<C> | Gaps<F>, F, TypeOf<C>>;
/** Creates an `of` concept that takes on the shape of `from`, documented by `description`. */
export function of<C extends Concept<any, any>>(
	description: string,
	from: C,
): Concept<GapOf<C>, {}, TypeOf<C>>;
/** Creates an `of` concept that takes on the shape of `from`, documented by `description` and refined by `fill`. */
export function of<C extends Concept<any, any>, F extends Fill>(
	description: string,
	from: C,
	fill: F & Narrows<F, FillOf<C>>,
): Concept<GapOf<C> | Gaps<F>, F, TypeOf<C>>;
export function of(
	a?: string | Concept<any, any> | TypeToken,
	b?: Concept<any, any> | Fill | TypeToken,
	c?: Fill,
): Concept<any, any> {
	const description = typeof a === "string" ? a : undefined;
	const second = typeof a === "string" ? b : a;
	const fill = (typeof a === "string" ? c : b) as Fill | undefined;
	if (isToken(second)) return { [former]: "of", description, token: second };
	return {
		[former]: "of",
		description,
		from: second as Concept<any, any> | undefined,
		fill,
	};
}
