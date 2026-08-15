import { type Concept, former } from "./concept";

const isConcept = (v: unknown): v is Concept<any, any> =>
	typeof v === "object" && v !== null && former in v;

const str = (s: string) => JSON.stringify(s);

/**
 * Generate a 'decisions.gen.ts' mirror of the spec module;
 * a conformant starting point for the model to refine.
 * lib and spec are import specifiers from the decision file's location.
 */
export function codegen(
	mod: Record<string, unknown>,
	opts: { lib: string; spec: string },
): string {
	const named = new Map<object, string>();
	for (const [name, v] of Object.entries(mod))
		if (isConcept(v)) named.set(v, name);

	const call = (fn: string, args: (string | undefined)[]) =>
		`${fn}(${args.filter((a) => a !== undefined).join(", ")})`;

	const fillExpr = (
		fill: Record<string, Concept<any, any>>,
		ind: string,
	): string => {
		const inner = `${ind}\t`;
		const rows = Object.entries(fill).map(
			([k, v]) => `${inner}${k}: ${expr(v, inner)},`,
		);
		return `{\n${rows.join("\n")}\n${ind}}`;
	};

	const ref = (c: Concept<any, any> | undefined) =>
		c && named.has(c) ? `spec.${named.get(c)}` : "spec./*inline*/";

	const expr = (c: Concept<any, any>, ind: string): string => {
		const d = c.description !== undefined ? str(c.description) : undefined;
		switch (c[former]) {
			case "def":
				return call("def", [d, c.fill ? fillExpr(c.fill, ind) : undefined]);
			case "ref":
				return call("ref", [d, ref(c.to)]);
			case "of":
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
				if (Array.isArray(cs))
					return call("oneOf", [d, ...cs.map((k) => expr(k, ind))]);
				if (cs)
					return call("oneOf", [
						d,
						fillExpr(cs as Record<string, Concept<any, any>>, ind),
					]);
				return call("oneOf", [d]);
			}
		}
	};

	const body: string[] = [];
	for (const [c, name] of named) {
		body.push(`export const ${name} = ${expr(c as Concept<any, any>, "")};`);
		body.push(
			`export const _${name}: Conforms<typeof ${name}, typeof spec.${name}> = true;`,
		);
		body.push("");
	}

	return (
		`import { type Conforms, def, many, maybe, of, oneOf, pick, ref } from "${opts.lib}";\n` +
		`import * as spec from "${opts.spec}";\n\n` +
		body.join("\n")
	);
}
