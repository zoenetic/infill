import type { Concept } from "./concept";
import type { Fill } from "./fill";

export type Node =
	| { kind: "concept"; description?: string; fill?: Field[] }
	| { kind: "reference"; description?: string; to: string | null }
	| { kind: "shape"; description?: string; from: string | null; fill?: Field[] }
	| { kind: "collection"; description?: string; inner: Node }
	| { kind: "optional"; description?: string; inner: Node }
	| { kind: "choice"; description?: string; cases: Node[] };

export type Field = { key: string; node: Node };
export type Root = { name: string; node: Node };
export type Ir = { roots: Root[] };

export interface Emit {
	node(c: Concept<any, any>): Node;
	nameOf(c: Concept<any, any> | undefined): string | null;
	fields(fill: Fill | undefined): Field[] | undefined;
}
