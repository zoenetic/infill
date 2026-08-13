import type { Fill } from "./fill";
import { type Gap, gap } from "./gap";

export const kind: unique symbol = Symbol("kind");
export const shape: unique symbol = Symbol("shape");

export type Kind = "def" | "ref" | "of" | "many" | "maybe" | "oneOf";

export interface Concept<
	G extends string = Gap,
	F extends Fill = {},
	T = unknown,
> {
	readonly [kind]: Kind;
	readonly prompt?: string;
	readonly fill?: F;
	readonly to?: Concept<any, any>;
	readonly [gap]?: G;
	readonly [shape]?: T;
}
