import { stringify } from "yaml";
import { type Concept, type Former, former } from "./concept";

/** a map of formers to their forms */
const FORM: Record<Former, string> = {
	def: "concept",
	ref: "reference",
	of: "shape",
	many: "collection",
	maybe: "optional",
	oneOf: "choice",
};

const howToRead = {
	what: "A specification. Each concept describes something to produce. Where a concept is underspecified, the unspecified part is a gap and filling it is your job - use the concept's name, description, position, and neighbours as evidence.",
	gapsAreDeliberate:
		"A gap is a decision left to you on purpose, not an omission to report back.",
	namesAreContent:
		"A concept with no description is specified by its name alone. Read the name literally.",
	everyConceptHasAPath: `This is its address from the root, denoted by '.' for a named part, '#n' for a choice's nth case, '[]' for a collections element, or '?' for an optional's value. Cite a path to refer to any part exactly.`,
	forms: {
		concept: "Described in its own right.",
		reference:
			"Points to another named concept. Read that concept; it is not restated here.",
		shape:
			"Takes on another concept's structure. Parts here add to or replace those of the target.",
		collection: "Some number of the inner concept.",
		optional: "The inner concept, possibly absent.",
		choice:
			"Exactly one of the listed cases. The list is complete; do not invent new cases.",
	},
};

const label = (path: string) =>
	(path.split(".").pop() ?? path).replace(/(\[\]|\?|#\d+)$/, "");

const num = (n: number) =>
	[
		"zero",
		"one",
		"two",
		"three",
		"four",
		"five",
		"six",
		"seven",
		"eight",
		"nine",
		"ten",
		"eleven",
		"twelve",
	][n] ?? String(n);

const conjoin = (xs: string[]) =>
	xs.length <= 1
		? (xs[0] ?? "")
		: `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

const isConcept = (v: unknown): v is Concept<any, any> =>
	typeof v === "object" && v !== null && former in v;

type Doc = Record<string, unknown>;

type Warning = { path: string; message: string };

export function emit(mod: Record<string, unknown>): {
	yaml: string;
	warnings: Warning[];
} {
	const named = new Map<object, string>();
	for (const [name, v] of Object.entries(mod))
		if (isConcept(v)) named.set(v, name);

	const warnings: Warning[] = [];

	const nameOf = (c: Concept<any, any> | undefined) =>
		c ? (named.get(c) ?? null) : null;

	const gapOf = (c: Concept<any, any>, path: string): string => {
		const parts = c.fill ? Object.keys(c.fill).length : 0;
		const name = label(path);
		switch (c[former]) {
			case "def":
				return parts === 0
					? "Total."
					: `Partial — the named parts are specified below; everything else about ${name} is open.`;
			case "of":
				return parts === 0
					? `Partial — takes ${nameOf(c.from) ?? "?"}'s shape; any refinement is open.`
					: `Partial — takes ${nameOf(c.from) ?? "?"}'s shape; the parts here refine it, everything else is open.`;
			case "ref":
				return `The role here, beyond what ${nameOf(c.to) ?? "?"} already specifies.`;
			case "many":
				return "How many, and the container, are open; each element is below.";
			case "maybe":
				return "Whether it is present is open; the value is below.";
			case "oneOf":
				return "Which case applies; the cases are below.";
		}
	};

	const readingOf = (c: Concept<any, any>, path: string): string => {
		const p = `\`${path}\``;
		const name = label(path);
		const desc = c.description;
		const keys = c.fill ? Object.keys(c.fill) : [];
		switch (c[former]) {
			case "def":
				if (keys.length)
					return desc
						? `${p} — ${desc}. It names ${conjoin(keys)}; everything else about ${name} is yours.`
						: `${p} names ${conjoin(keys)}; everything else about ${name} is yours.`;
				return desc
					? `${p} — ${desc}.`
					: `${p} — no description, so the name is the whole specification; read \`${name}\` literally.`;
			case "of": {
				const from = nameOf(c.from) ?? "?";
				const head = desc
					? `${p} takes \`${from}\`'s shape — ${desc}.`
					: `${p} takes \`${from}\`'s shape.`;
				return keys.length
					? `${head} It adds or replaces ${conjoin(keys)}; read \`${from}\` for the rest.`
					: `${head} Read \`${from}\` for its parts.`;
			}
			case "ref": {
				const to = nameOf(c.to) ?? "?";
				const role = desc ? ` Its role here: ${desc}.` : "";
				return `${p} points at \`${to}\`.${role} Read \`${to}\`; nothing about it is restated here.`;
			}
			case "many": {
				const of = c.inner?.description ?? "an unspecified element";
				return `${p} — some number of ${of} (see \`${path}[]\`). Count and container are unspecified.`;
			}
			case "maybe": {
				const of = c.inner?.description ?? `the value at \`${path}?\``;
				return `${p} — ${of}, possibly absent.`;
			}
			case "oneOf": {
				const cs = c.cases;
				const n = Array.isArray(cs)
					? cs.length
					: cs
						? Object.keys(cs).length
						: 0;
				return `${p} is exactly one of ${num(n)} case${n === 1 ? "" : "s"}, listed below. The list is complete — do not invent cases.`;
			}
		}
	};

	const partsOf = (c: Concept<any, any>, path: string): Doc | undefined => {
		const fill = c.fill ?? {};
		const keys = Object.keys(fill);
		if (keys.length === 0) return undefined;
		const parts: Doc = {};
		for (const k of keys) {
			const child = fill[k];
			const bound = named.get(child);
			if (bound)
				warnings.push({
					path: `${path}.${k}`,
					message: `bare mention of bound concept \`${bound}\` — a fill slot can't tell "contains" from "references"; write of(${bound}) or ref(${bound}) to say which`,
				});
			parts[k] = node(child, `${path}.${k}`);
		}
		return parts;
	};

	const node = (c: Concept<any, any>, path: string): Doc => {
		const d: Doc = { path, form: FORM[c[former]] };
		if (c[former] === "ref") d.pointsAt = nameOf(c.to);
		if (c[former] === "of") d.shapedLike = nameOf(c.from);
		if (c.description !== undefined) d.description = c.description;
		else d.describedBy = "name only";
		d.reading = readingOf(c, path);
		d.gap = gapOf(c, path);
		switch (c[former]) {
			case "def":
			case "of": {
				const parts = partsOf(c, path);
				if (parts) d.parts = parts;
				break;
			}
			case "many":
				d.each = node(c.inner!, `${path}[]`);
				break;
			case "maybe":
				d.inner = node(c.inner!, `${path}?`);
				break;
			case "oneOf": {
				const cs = c.cases;
				if (Array.isArray(cs))
					d.cases = cs.map((k, i) => node(k, `${path}#${i}`));
				else if (cs)
					d.cases = Object.fromEntries(
						Object.entries(cs).map(([k, v]) => [k, node(v, `${path}#${k}`)]),
					);
				break;
			}
		}
		return d;
	};

	const concepts: Doc = {};
	for (const [c, name] of named)
		concepts[name] = node(c as Concept<any, any>, name);

	const yaml = stringify({ infill: 1, howToRead, concepts }, { lineWidth: 0 });
	return { yaml, warnings };
}
