import { stringify } from "yaml";
import { type Concept, type Former, former } from "./concept";

/** The human readable name for the 'form' produced by a given {@link Former} in emitted output. */
const FORM: Record<Former, string> = {
	def: "concept",
	ref: "reference",
	of: "shape",
	many: "collection",
	maybe: "optional",
	oneOf: "choice",
	given: "fact",
};

/** Static preamble embedded in every emitted document, explaining the output's conventions to its reader. */
const howToRead = {
	what: "A specification. Each concept describes something to produce. Where a concept is underspecified, the unspecified part is a gap and filling it is your job - use the concept's name, description, position, and neighbours as evidence.",
	gapsAreDeliberate:
		"A gap is a decision left to you on purpose, not an omission to report back.",
	namesAreContent:
		"A concept with no description is specified by its name alone. Read the name literally.",
	everyConceptHasAPath: `This is its address from the root, denoted by '.' for a named part, '#name' for a keyed choice case (or '#n' for a positional one), '[]' for a collection's element, or '?' for an optional's value. Cite a path to refer to any part exactly.`,
	forms: {
		concept: "Described in its own right.",
		reference:
			"Points to another named concept. Read that concept; it is not restated here.",
		shape:
			"Takes on another concept's structure and gaps. Parts here add new positions or narrow the target's — never dropping one, so a shape only ever refines.",
		collection: "Some number of the inner concept.",
		optional: "The inner concept, possibly absent.",
		choice:
			"Exactly one of the listed cases. The list is complete; do not invent new cases.",
		fact: "A decided value, stated as fixed. Not a gap — rely on it; do not treat it as yours.",
	},
};

/** Extracts the last path segment of a dotted `path`, stripping any trailing collection/optional/choice marker. */
const label = (path: string) => {
	const seg = path.split(".").pop() ?? path;
	const hash = seg.indexOf("#");
	if (hash !== -1) {
		const key = seg.slice(hash + 1);
		// keyed case -> the key; positional case (#n) -> the container name
		return /^\d+$/.test(key) ? seg.slice(0, hash) : key;
	}
	return seg.replace(/(\[\]|\?)$/, "");
};

/** Spells out small non-negative integers (`0`-`12`) in words for use in prose; falls back to the numeral otherwise. */
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

/** Joins a list of strings into a natural-language conjunction, e.g. `["a", "b", "c"]` becomes `"a, b and c"`. */
const conjoin = (xs: string[]) =>
	xs.length <= 1
		? (xs[0] ?? "")
		: `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** Type guard: reports whether `v` is a {@link Concept}, i.e. an object carrying the {@link former} property. */
const isConcept = (v: unknown): v is Concept<any, any> =>
	typeof v === "object" && v !== null && former in v;

/** A generic, YAML-serializable document node built up while emitting a concept. */
type Doc = Record<string, unknown>;

/** A problem found while emitting a concept, reported alongside the emitted YAML rather than thrown. */
type Warning = { path: string; message: string };

/**
 * Renders every named {@link Concept} exported by module `mod` into a single, self-describing
 * YAML document intended for an AI or human reader to fill in the gaps of, plus any warnings
 * about ambiguous specifications (e.g. a fill part that bare-references a bound concept).
 */
export function emit(mod: Record<string, unknown>): {
	yaml: string;
	warnings: Warning[];
} {
	const named = new Map<object, string>();
	for (const [name, v] of Object.entries(mod))
		if (name !== "default" && isConcept(v)) named.set(v, name);
	// A `default` export designates the spec's root; other named exports are its vocabulary.
	const root = isConcept(mod.default)
		? (named.get(mod.default as object) ?? null)
		: null;

	const warnings: Warning[] = [];

	/** Looks up the exported name a concept is bound to, or `null` if it isn't a named export. */
	const nameOf = (c: Concept<any, any> | undefined) =>
		c ? (named.get(c) ?? null) : null;

	// A from-less `of` reads as a leaf. A phantom `of<T>()` erases its type, so
	// the artifact can't show it; a token-typed `of(String)` keeps the type at
	// runtime (see `tokenName`), so the leaf renders with an explicit `type`.
	const kindOf = (c: Concept<any, any>) =>
		c[former] === "of" && !c.from ? ("def" as const) : c[former];

	/** The type name a token-typed `of` leaf carries (`of(String)` -> "string"), or null. */
	const tokenName = (c: Concept<any, any>): string | null => {
		if (c[former] !== "of" || c.from || c.token === undefined) return null;
		if (c.token === String) return "string";
		if (c.token === Number) return "number";
		if (c.token === Boolean) return "boolean";
		return null;
	};

	/** Describes, in prose, what remains unspecified (the gap) for concept `c` at `path`. */
	const gapOf = (c: Concept<any, any>, path: string): string => {
		const parts = c.fill ? Object.keys(c.fill).length : 0;
		const name = label(path);
		const tn = tokenName(c);
		if (tn) return `A ${tn} — the type is fixed; the value is yours to provide.`;
		switch (kindOf(c)) {
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
			case "given":
				return "None — a fact is decided, not a gap; rely on it as fixed.";
		}
	};

	/** Composes the human-facing "reading" of concept `c` at `path`: how to interpret it given its kind, name, description and parts. */
	const readingOf = (c: Concept<any, any>, path: string): string => {
		const p = `\`${path}\``;
		const name = label(path);
		const desc = c.description;
		const keys = c.fill ? Object.keys(c.fill) : [];
		const tn = tokenName(c);
		if (tn) return desc ? `${p} — ${desc}. A ${tn}.` : `${p} — a ${tn}.`;
		switch (kindOf(c)) {
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
			case "given":
				return `${p} — a fact: ${c.value}. Fixed, not a gap; read it as given.`;
		}
	};

	/**
	 * Recursively renders `c`'s fill (if any) into a {@link Doc} of named parts, warning when a part
	 * bare-references a bound concept instead of wrapping it in `of(...)` or `ref(...)`.
	 */
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

	/** Renders concept `c` at `path` into its full {@link Doc} node, recursing into its parts, element, or cases as needed. */
	const node = (c: Concept<any, any>, path: string): Doc => {
		const d: Doc = { path, form: FORM[kindOf(c)] };
		const tn = tokenName(c);
		if (tn) d.type = tn;
		if (c[former] === "given") d.is = c.value;
		if (c[former] === "ref") d.pointsAt = nameOf(c.to);
		if (c[former] === "of" && c.from) d.shapedLike = nameOf(c.from);
		if (c[former] !== "given") {
			if (c.description !== undefined) d.description = c.description;
			else d.describedBy = "name only";
		}
		d.reading = readingOf(c, path);
		d.gap = gapOf(c, path);
		switch (kindOf(c)) {
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

	const doc = root
		? { codeform: 1, root, howToRead, concepts }
		: { codeform: 1, howToRead, concepts };
	const yaml = stringify(doc, { lineWidth: 0 });
	return { yaml, warnings };
}
