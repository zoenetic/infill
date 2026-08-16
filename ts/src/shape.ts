import type { Concept } from "./concept";

/**
 * Projects a concept `C` into the concrete TypeScript type its implementation
 * must satisfy — the phase-2 bridge from a spec (or a set of decisions) to real
 * code. A concept with named parts becomes an object of projected parts; a leaf
 * becomes its value type: a typed leaf (`of<T>()`) is `T`, a choice is its
 * case-key union (a `pick` narrows it to the one key), and an untyped prose gap
 * is `unknown`. So the checker polices exactly as much of the implementation as
 * the spec chose to type.
 */
export type Shape<C> = C extends Concept<any, infer F, infer T>
	? [keyof F] extends [never]
		? T
		: { [K in keyof F]: Shape<F[K]> }
	: never;
