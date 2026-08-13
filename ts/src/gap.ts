import type { Concept } from "./concept";
import type { Fill } from "./fill";

export const gap: unique symbol = Symbol("gap");

export type Gap = ".";

export type GapOf<C> = C extends Concept<infer G, any> ? G : Gap;

type Prefix<K extends string, G> = G extends Gap
	? K
	: G extends string
		? `${K}.${G}`
		: K;

type GapsIn<F extends Fill> = {
	[K in keyof F & string]: Prefix<K, GapOf<F[K]>>;
}[keyof F & string];

export type Gaps<F extends Fill> = Gap | GapsIn<F>;
