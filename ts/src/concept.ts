import type { Fill } from "./fill.js";
import { type Gap, gap } from "./gap.js";

/** Global-registry so the tag survives module duplication (codegen/CLI
 *  dynamically import the spec; a plain Symbol() would differ per instance). */

/** Property key holding a {@link Concept}'s {@link Former}. Kept as a symbol so it never collides with a fill part named `former`. */
export const former: unique symbol = Symbol.for("codeform.former");

/** The discriminant naming which shape a {@link Concept} takes: a definition, a reference, a re-shaping, a collection, an optional, or a choice. */
export type Former =
	| "def"
	| "ref"
	| "of"
	| "many"
	| "maybe"
	| "oneOf"
	| "given"
	| "never";

/** Phantom property key used to carry a {@link Concept}'s inferred value type ({@link TypeOf}) at the type level only; never set at runtime. */
export const type: unique symbol = Symbol.for("codeform.type");

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
	/** Present on `ref` concepts (the concept pointed at) and on `pick` results (the origin choice being narrowed, so it can round-trip). */
	readonly to?: Concept<any, any>;
	/** Present on `of` concepts: the concept whose shape is taken on. */
	readonly from?: Concept<any, any>;
	/** Present on token-typed `of` leaves (`of(String)`, `of(schema)`): the runtime type token, so a leaf's type survives erasure. */
	readonly token?: unknown;
	/** Present on `many`/`maybe` concepts: the element or wrapped concept. */
	readonly inner?: Concept<any, any>;
	/** Present on a keyed `many`: the concept its keys take, deciding the container the bare form leaves open. */
	readonly key?: Concept<any, any>;
	/** Present on `oneOf` concepts: the exhaustive list of alternatives, as an array of cases or a keyed record for {@link pick}. */
	readonly cases?:
		| readonly Concept<any, any>[]
		| Readonly<Record<string, Concept<any, any>>>;
	/** Present on `given` concepts: Facts. */
	readonly value?: unknown;
	/** Present on `never` concepts: marks the region declined rather than unanswered. */
	readonly declined?: true;
	readonly [gap]?: G;
	readonly [type]?: T;
}

/** Extracts the inferred value type `T` that a concept `C` describes, or `unknown` if it cannot be determined. */
export type TypeOf<C> = C extends Concept<any, any, infer T> ? T : unknown;

/**
 * A {@link Concept} refined with its {@link Former} tag and, in `X`, the precise
 * child concepts it holds — the target of a `ref`, the shape a `of` takes on, a
 * collection's element, a choice's cases, a fact's value.
 *
 * `Concept` declares those slots loosely (`Concept<any, any>`) so the interface
 * stays readable; the formers return `Node`, which replaces each slot it names
 * with the precise child. That precision is what lets `Shape` and `Conforms` walk
 * a spec structurally, rather than bottoming out at `unknown` the moment a node
 * stops being a plain object of parts.
 */
export type Node<
	K extends Former,
	G extends string = Gap,
	F extends Fill = {},
	T = unknown,
	X = unknown,
> = Omit<Concept<G, F, T>, keyof X> & { readonly [former]: K } & X;
