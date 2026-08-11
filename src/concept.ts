import type { Fill } from "./fill";
import { type Gap, gap } from "./gap";

export const kind: unique symbol = Symbol("kind");

export type Kind = "def" | "ref" | "is";

export interface Concept<G extends string = Gap, F extends Fill = {}> {
	readonly [kind]: Kind;
	readonly prompt?: string;
	readonly fill?: F;
	readonly to?: Concept<any, any>;
	readonly [gap]?: G;
}
