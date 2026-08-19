import { type Concept, former } from "./concept.js";

const isConcept = (v: unknown): v is Concept<any, any> =>
	typeof v === "object" && v !== null && former in v;

export const conceptNames = (mod: Record<string, unknown>): string[] =>
	Object.entries(mod)
		.filter(([k, v]) => k !== "default" && isConcept(v))
		.map(([k]) => k);

const str = (s: string) => JSON.stringify(s);

/**
 * Generate a 'decisions.gen.ts' mirror of the spec module;
 * a conformant starting point for the model to refine.
 * lib and spec are import specifiers from the decision file's location.
 */
export function codegen(
	mod: Record<string, unknown>,
	opts: { lib: string; spec: string },
	only?: Iterable<string>,
): string {
	const named = new Map<object, string>();
	for (const [name, v] of Object.entries(mod))
		if (name !== "default" && isConcept(v)) named.set(v, name);
	const emit = only ? new Set(only) : null;

	// The decisions file declares each concept under its own name and its
	// conformance assertion under `_name`, so the namespace the spec is imported
	// under has to dodge both — a spec that names a concept `spec` (codeform's own
	// does) would otherwise generate a file whose import collides with its first
	// declaration.
	const taken = new Set<string>();
	for (const name of named.values()) taken.add(name).add(`_${name}`);
	let ns = "spec";
	while (taken.has(ns)) ns = `_${ns}`;

	// The formers `expr` actually emits, so the import lists only what's used.
	const used = new Set<string>();
	const call = (fn: string, args: (string | undefined)[]) => {
		used.add(fn);
		return `${fn}(${args.filter((a) => a !== undefined).join(", ")})`;
	};

	const fillExpr = (
		fill: Record<string, Concept<any, any>>,
		ind: string,
	): string => {
		const inner = `${ind}\t`;
		const entries = Object.entries(fill);
		if (entries.length === 0) return "{}";
		const rows = entries.map(([k, v]) => `${inner}${k}: ${expr(v, inner)},`);
		return `{\n${rows.join("\n")}\n${ind}}`;
	};

	// A concept bound to a spec export is addressed through it, so the decision
	// stays linked to the spec rather than copying it. One that isn't bound has
	// no address, so it is reproduced inline — it projects the same either way.
	const target = (c: Concept<any, any> | undefined, ind: string): string => {
		if (!c)
			throw new TypeError(
				"a ref, pick or of reached codegen without a target — the concept is malformed",
			);
		return named.has(c) ? `${ns}.${named.get(c)}` : expr(c, ind);
	};

	/** Source for a token-typed `of` leaf's token — `String`/`Number`/`Boolean`. */
	const tokenSource = (t: unknown): string =>
		t === String
			? "String"
			: t === Number
				? "Number"
				: t === Boolean
					? "Boolean"
					: "undefined";

	const expr = (c: Concept<any, any>, ind: string): string => {
		const d = c.description !== undefined ? str(c.description) : undefined;
		switch (c[former]) {
			case "def":
				return call("def", [d, c.fill ? fillExpr(c.fill, ind) : undefined]);
			case "ref":
				return call("ref", [d, target(c.to, ind)]);
			case "of":
				if (c.token) return call("of", [d, tokenSource(c.token)]);
				return call("of", [
					d,
					target(c.from, ind),
					c.fill ? fillExpr(c.fill, ind) : undefined,
				]);
			case "many":
				return call("many", [d, expr(c.inner!, ind)]);
			case "maybe":
				return call("maybe", [d, expr(c.inner!, ind)]);
			case "oneOf": {
				const cs = c.cases;
				// A `pick` is a oneOf carrying `to` (its origin choice) and a
				// single case: round-trip it as pick(origin, key). The generic
				// single-case oneOf below would inline a copy of the case and
				// lose the linkage to the choice it narrows.
				if (c.to && cs && !Array.isArray(cs)) {
					const [key] = Object.keys(cs);
					return call("pick", [target(c.to, ind), str(key)]);
				}
				if (Array.isArray(cs))
					return call("oneOf", [d, ...cs.map((k) => expr(k, ind))]);
				if (cs)
					return call("oneOf", [
						d,
						fillExpr(cs as Record<string, Concept<any, any>>, ind),
					]);
				return call("oneOf", [d]);
			}
			case "given":
				return call("given", [JSON.stringify(c.value)]);
		}
	};

	const body: string[] = [];
	for (const [c, name] of named) {
		if (emit && !emit.has(name)) continue;
		if ((c as Concept<any, any>)[former] === "given") continue;
		body.push(`export const ${name} = ${expr(c as Concept<any, any>, "")};`);
		body.push(
			`export const _${name}: Conforms<typeof ${name}, typeof ${ns}.${name}, "${name}"> = conforms<typeof ${name}, typeof ${ns}.${name}, "${name}">();`,
		);
		body.push("");
	}
	const decls = body.join("\n").trimEnd();

	if (only) return decls;
	const imports = ["type Conforms", "conforms", ...[...used].sort()].join(", ");
	return (
		`import { ${imports} } from "${opts.lib}";\n` +
		`import * as ${ns} from "${opts.spec}";\n\n${decls}\n`
	);
}
