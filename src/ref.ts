import { type Concept, kind } from "./concept";
import type { Gap } from "./gap";

export const refMark: unique symbol = Symbol("ref");

export interface Ref<C extends Concept<any, any> = Concept<any, any>> {
	readonly [refMark]: true;
	readonly prompt?: string;
	readonly to: C;
}

export const isRef = (v: unknown): v is Ref =>
	typeof v === "object" && v !== null && refMark in v;

export function ref(to: Concept<any, any>): Concept<Gap>;
export function ref(prompt: string, to: Concept<any, any>): Concept<Gap>;
export function ref(
	a: string | Concept<any, any>,
	b?: Concept<any, any>,
): Concept<Gap> {
	const prompt = typeof a === "string" ? a : undefined;
	const to = typeof a === "string" ? b! : a;
	return { [kind]: "ref", prompt, to };
}
