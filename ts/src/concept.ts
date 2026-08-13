import type { Fill } from "./fill";
import { type Gap, gap } from "./gap";

export const kind: unique symbol = Symbol("kind");
export const type: unique symbol = Symbol("type");

export type Kind = "def" | "ref" | "of" | "many" | "maybe" | "oneOf";

export interface Concept<
	G extends string = Gap,
	F extends Fill = {},
	T = unknown,
> {
	readonly [kind]: Kind;
	readonly description?: string;
	readonly fill?: F;
	readonly to?: Concept<any, any>;
	readonly from?: Concept<any, any>;
	readonly inner?: Concept<any, any>;
	readonly cases?: readonly Concept<any, any>[];
	readonly [gap]?: G;
	readonly [type]?: T;
}

export type TypeOf<C> = C extends Concept<any, any, infer T> ? T : unknown;
