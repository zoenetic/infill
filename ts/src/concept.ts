import type { Fill } from "./fill";
import { type Gap, gap } from "./gap";

export const former: unique symbol = Symbol("former");

export type Former = "def" | "ref" | "of" | "many" | "maybe" | "oneOf";

export const type: unique symbol = Symbol("type");

export interface Concept<
	G extends string = Gap,
	F extends Fill = {},
	T = unknown,
> {
	readonly [former]: Former;
	readonly description?: string;
	readonly fill?: F;
	readonly to?: Concept<any, any>;
	readonly from?: Concept<any, any>;
	readonly inner?: Concept<any, any>;
	readonly cases?:
		| readonly Concept<any, any>[]
		| Readonly<Record<string, Concept<any, any>>>;
	readonly [gap]?: G;
	readonly [type]?: T;
}

export type TypeOf<C> = C extends Concept<any, any, infer T> ? T : unknown;
