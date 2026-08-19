import { def, given, many, maybe, of, oneOf, ref } from "codeform";

export const concept = def(
	"codeform's one node type; a spec is a tree of these",
	{
		name: of(
			"the key a concept is bound under — its module export name, or its fill key",
			String,
		),
		description: maybe(
			of(
				"states the need here; absent when the name says enough on its own",
				String,
			),
		),
	},
);

export const former = oneOf(
	"each former produces a kind of node from its own operands",
	{
		def: def(
			"the broadest former; a concept, optionally carved into named parts",
			{ form: given("concept") },
		),
		ref: def("points at another concept without inheriting its gaps", {
			target: ref(concept),
			form: given("reference"),
		}),
		of: def(
			"always takes something on, and only ever narrows it: either another concept's shape and gaps — adding new parts or carving existing ones, never dropping a gap, so a refinement only ever conforms to its target — or a leaf's type, from a runtime token (String, Number, or Boolean). A token is a runtime value on purpose: a type named in the spec's source alone would reach the typechecker but not the artifact, the scaffold or the check, and a leaf the framework silently stops holding is worse than one it never typed",
			{ target: ref(concept), form: given("shape") },
		),
		many: def("some number of an inner concept", {
			inner: of(concept),
			form: given("collection"),
		}),
		maybe: def("zero or one of an inner concept", {
			inner: of(concept),
			form: given("optional"),
		}),
		oneOf: def("exactly one of a set of named cases; closed as written", {
			cases: many(of(concept)),
			form: given("choice"),
		}),
		given: def(
			"asserts a decided value; the one former that closes a node into a fact",
			{
				value: def("the content being asserted, taken as fixed"),
				form: given("fact"),
			},
		),
	},
);

export const primitives = def("the primitives codeform is built from", {
	concept: ref(concept),
	former: ref(former),
});

export const spec = def(
	"what the human author writes; bound concepts that may be narrowed",
	{ concepts: many(of(concept)) },
);

export const conformance = def(
	"the check that a decision only narrows the spec: a typed leaf keeps a type the spec allows, a choice resolves to one of the offered cases, a collection keeps its element and an optional its value, and every part is covered. The walk is total — it recurses through a collection's element, an optional's value and a choice's cases, not only through named parts — and reports the address of whatever failed. Equivalently, and this is how the typechecker resolves it, the decision's projection is assignable to the spec's projection, so a decision that contradicts the spec fails to compile",
);

export const projection = def(
	"the concrete type a spec projects into for real code, by form: named parts become an object of projected parts; a typed leaf becomes its type; a choice becomes its case-key union; a collection becomes an array of its element's projection; an optional becomes its value's projection or absent; a reference or shape projects through its target; a fact becomes its asserted value; an untyped gap stays open as `unknown` — so the typechecker enforces exactly as much of the code as the spec chose to type",
);

export const pipeline = def(
	"how a spec becomes verified software, across two phases",
	{
		spec: ref(spec),
		artifact: def(
			"the model-facing rendering the model reads; its keys are its own namespace, separate from these concept names — version surfaces as the top-level `codeform:` key and legend as `howToRead`",
			{
				version: given(1),
				root: ref(
					"the spec's entry-point concept; present when the spec sets a default export",
					concept,
				),
				legend: given(
					"model-facing instructions on how to read gaps, names, and forms",
				),
				concepts: given(
					"every named concept in the spec, keyed by name; each a node — its path, form, a type for a typed leaf, description or name-only marker, generated reading and gap lines, and the parts, element, or cases its form carries",
				),
			},
		),
		refine: def(
			"phase one, still in spec space: the model narrows the spec's gaps into decisions, and conformance verifies each narrowing",
			{
				decisions: of("the model's narrowings of the spec's gaps", spec),
				check: ref(conformance),
			},
		),
		build: def(
			"phase two, in code: the spec projects into a concrete type and the model writes real implementation code the typechecker holds to it",
			{
				shape: ref(projection),
				code: def(
					"the implementation, ordinary code written to the projected type",
				),
			},
		),
		cli: def("the codeform command line", {
			commands: def({
				gen: def(
					"scaffold or additively update the decisions file from a spec",
				),
				check: def("run the conformance check and report any issues"),
				emit: def("render a spec's model-facing artifact"),
			}),
		}),
	},
);

export const codeform = def(
	"a typescript framework and cli for spec-driven development that makes typescript software",
	{
		principles: def({
			gapByDefault: given(
				"a node is open by default and carving only narrows it; the sole way to close one is to assert it with given, making it a fact",
			),
			noReservedKeys: given(
				"the authoring layer reserves no fill keys; structure comes from the formers, not magic keys, and the rendered artifact has its own separate namespace",
			),
			namesAreContent: given(
				"a concept's name is part of its content, not just an identifier",
			),
			typeChecked: given(
				"both halves are held by the typechecker: decisions must conform to the spec, and code must satisfy the spec's projection",
			),
		}),
		primitives: ref(primitives),
		pipeline: ref(pipeline),
	},
);

export default codeform;
