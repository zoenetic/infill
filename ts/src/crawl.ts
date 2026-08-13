import { type Concept, kind } from "./concept";

export type Crawled = {
	path: string;
	prompt?: string;
	rel?: "ref" | "is";
	to?: string;
	children: Crawled[];
};

const isConcept = (v: unknown): v is Concept<any, any> =>
	typeof v === "object" && v !== null && kind in v;

export function crawl(mod: Record<string, unknown>): Crawled[] {
	const named = new Map<object, string>();
	for (const [name, v] of Object.entries(mod))
		if (isConcept(v)) named.set(v, name);

	const visit = (
		n: Concept<any, any>,
		path: string,
		seen: Set<object> = new Set(),
	): Crawled => {
		const follow =
			n[kind] === "is" && n.to && !seen.has(n.to) ? n.to : undefined;
		const next = follow ? new Set([...seen, follow]) : seen;

		const entries = new Map<string, [Concept<any, any>, boolean]>();
		for (const [k, v] of Object.entries(follow?.fill ?? {}))
			entries.set(k, [v as Concept<any, any>, true]);
		for (const [k, v] of Object.entries(n.fill ?? {}))
			entries.set(k, [v as Concept<any, any>, false]);

		const node: Crawled = {
			path,
			children: [...entries].map(([k, [v, inherited]]) =>
				visit(v, `${path}.${k}`, inherited ? next : seen),
			),
		};
		if (n.prompt !== undefined) node.prompt = n.prompt;
		if (n[kind] !== "def") node.rel = n[kind] as "ref" | "is";
		if (n.to) node.to = named.get(n.to) ?? "<unbound>";
		return node;
	};

	return [...named].map(([c, name]) => visit(c as Concept<any, any>, name));
}

export const gapsOf = (n: Crawled): string[] => [
	".",
	...n.children.flatMap((c) => {
		const key = c.path.split(".").pop()!;
		return gapsOf(c).map((g) => (g === "." ? key : `${key}.${g}`));
	}),
];
