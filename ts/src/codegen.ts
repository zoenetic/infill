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
		const rows = Object.entries(fill)
			// skip `given` facts, and phantom `of<T>()` leaves whose type is erased
			// (token-typed `of(String)` leaves survive and are reproduced below)
			.filter(
				([, v]) =>
					v[former] !== "given" &&
					!(v[former] === "of" && !v.from && v.token === undefined),
			)
			.map(([k, v]) => `${inner}${k}: ${expr(v, inner)},`);
		return `{\n${rows.join("\n")}\n${ind}}`;
	};

	const ref = (c: Concept<any, any> | undefined) =>
		c && named.has(c) ? `spec.${named.get(c)}` : "spec./*inline*/";

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
				return call("ref", [d, ref(c.to)]);
			case "of":
				if (c.token) return call("of", [d, tokenSource(c.token)]);
				return call("of", [
					d,
					ref(c.from),
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
					return call("pick", [ref(c.to), str(key)]);
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
			`export const _${name}: Conforms<typeof ${name}, typeof spec.${name}, "${name}"> = conforms<typeof ${name}, typeof spec.${name}, "${name}">();`,
		);
		body.push("");
	}
	const decls = body.join("\n").trimEnd();

	if (only) return decls;
	const imports = ["type Conforms", "conforms", ...[...used].sort()].join(", ");
	return (
		`import { ${imports} } from "${opts.lib}";\n` +
		`import * as spec from "${opts.spec}";\n\n${decls}\n`
	);
}
