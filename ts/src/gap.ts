import type { Concept } from "./concept.js";
import type { Fill } from "./fill.js";

/** Property key holding a {@link Concept}'s gap paths ({@link Gap}) at the type level only; never set at runtime. */
export const gap: unique symbol = Symbol("gap");

/** The dotted path denoting a concept's own, unfilled position - the root gap, before any part is appended. */
export type Gap = ".";

/** Extracts the gap paths of concept `C`, defaulting to the root {@link Gap} if `C` isn't a `Concept`. */
export type GapOf<C> = C extends Concept<infer G, any> ? G : Gap;

/** Joins a fill key `K` with a nested gap path `G`, producing `K` itself when `G` is the root gap, or `K.G` otherwise. */
type Prefix<K extends string, G> = G extends Gap
	? K
	: G extends string
		? `${K}.${G}`
		: K;

/** The union of nested gap paths reachable through each part of fill `F`, each prefixed with its part name. */
type GapsIn<F extends Fill> = {
	[K in keyof F & string]: Prefix<K, GapOf<F[K]>>;
}[keyof F & string];

/** All gap paths for a concept with fill `F`: its own root gap plus every gap reachable through its parts. */
export type Gaps<F extends Fill> = Gap | GapsIn<F>;
