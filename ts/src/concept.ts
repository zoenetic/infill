import type { Fill } from "./fill";
import { type Gap, gap } from "./gap";

/** Global-registry so the tag survives module duplication (codegen/CLI
 *  dynamically import the spec; a plain Symbol() would differ per instance). */

/** Property key holding a {@link Concept}'s {@link Former}. Kept as a symbol so it never collides with a fill part named `former`. */
export const former: unique symbol = Symbol.for("infill.former");

/** The discriminant naming which shape a {@link Concept} takes: a definition, a reference, a re-shaping, a collection, an optional, or a choice. */
export type Former =
	| "def"
	| "ref"
	| "of"
	| "many"
	| "maybe"
	| "oneOf"
	| "given";

/** Phantom property key used to carry a {@link Concept}'s inferred value type ({@link TypeOf}) at the type level only; never set at runtime. */
export const type: unique symbol = Symbol.for("infill.type");

/**
 * A specification node describing something to produce. Every concept constructor
 * (`def`, `ref`, `of`, `many`, `maybe`, `oneOf`) returns a `Concept`; unspecified parts
 * are gaps left for the reader (human or AI) to fill in.
 *
 * @typeParam G - The dotted paths (see {@link Gap}) at which this concept is underspecified.
 * @typeParam F - The named parts, if any, that fill in this concept's structure.
 * @typeParam T - The value type this concept ultimately describes, used only for inference.
 */
export interface Concept<
	G extends string = Gap,
	F extends Fill = {},
	T = unknown,
> {
	readonly [former]: Former;
	readonly description?: string;
	readonly fill?: F;
	/** Present on `ref` concepts: the concept being pointed at. */
	readonly to?: Concept<any, any>;
	/** Present on `of` concepts: the concept whose shape is taken on. */
	readonly from?: Concept<any, any>;
	/** Present on token-typed `of` leaves (`of(String)`, `of(schema)`): the runtime type token, so a leaf's type survives erasure. */
	readonly token?: unknown;
	/** Present on `many`/`maybe` concepts: the element or wrapped concept. */
	readonly inner?: Concept<any, any>;
	/** Present on `oneOf` concepts: the exhaustive list of alternatives, as an array of cases or a keyed record for {@link pick}. */
	readonly cases?:
		| readonly Concept<any, any>[]
		| Readonly<Record<string, Concept<any, any>>>;
	/** Present on `given` concepts: Facts. */
	readonly value?: unknown;
	readonly [gap]?: G;
	readonly [type]?: T;
}

/** Extracts the inferred value type `T` that a concept `C` describes, or `unknown` if it cannot be determined. */
export type TypeOf<C> = C extends Concept<any, any, infer T> ? T : unknown;
