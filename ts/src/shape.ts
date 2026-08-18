import { type Concept, former } from "./concept.js";

/** True when `C` is a `maybe` part, so its key projects to an optional property. */
type IsMaybe<C> = [
	C extends { readonly [former]: infer K } ? K : never,
] extends ["maybe"]
	? true
	: false;

/** Collapses an intersection of object types into one, preserving `?` modifiers. */
type Flatten<T> = { [K in keyof T]: T[K] };

/**
 * Projects a concept `C` into the concrete TypeScript type its implementation
 * must satisfy — the phase-2 bridge from a spec (or a set of decisions) to real
 * code. A concept with named parts becomes an object of projected parts; a leaf
 * becomes its value type: a typed leaf (`of<T>()`) is `T`, a choice is its
 * case-key union (a `pick` narrows it to the one key), and an untyped prose gap
 * is `unknown`. A `maybe` part becomes an optional property (`key?:`), not a
 * required `key: T | undefined`. So the checker polices exactly as much of the
 * implementation as the spec chose to type.
 */
export type Shape<C> = C extends Concept<any, infer F, infer T>
	? [keyof F] extends [never]
		? T
		: Flatten<
				{
					[K in keyof F as IsMaybe<F[K]> extends true ? never : K]: Shape<
						F[K]
					>;
				} & {
					[K in keyof F as IsMaybe<F[K]> extends true ? K : never]?: Shape<
						F[K]
					>;
				}
			>
	: never;
