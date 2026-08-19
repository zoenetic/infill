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
		ref: def(
			"points at another concept: it takes on that concept's projection, so code here is held to the same type, but not its gaps — those stay the target's to fill and are not restated at the reference",
			{ target: ref(concept), form: given("reference") },
		),
		of: def(
			"always takes something on, and only ever narrows what it took; the one former that never conjures a node from nothing",
			{
				takesOn: oneOf("what it takes on — exactly one of these", {
					shape: ref(
						"another concept's parts and gaps, adding new positions or carving existing ones but never dropping a gap, so a refinement only ever conforms to its target",
						concept,
					),
					type: def(
						"a leaf's type, named by a runtime token: String, Number or Boolean. A token is a runtime value on purpose — a type named in the spec's source alone would reach the typechecker but not the artifact, the scaffold or the check, and a leaf the framework silently stops holding is worse than one it never typed",
					),
				}),
				form: given("shape"),
			},
		),
		many: def("some number of an inner concept", {
			inner: of(concept),
			form: given("collection"),
		}),
		maybe: def("zero or one of an inner concept", {
			inner: of(concept),
			form: given("optional"),
		}),
		oneOf: def(
			"exactly one of a set of cases, keyed by name and closed as written: a decision may narrow to fewer cases, which is what pick does, but never add one",
			{
				cases: many(of("the case's name", String), of(concept)),
				form: given("choice"),
			},
		),
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
	{
		concepts: many(
			of("the name the concept is bound under, which is part of it", String),
			of(concept),
		),
	},
);

export const conformance = def(
	"the check that a decision only narrows the spec, and never contradicts or abandons it",
	{
		leaf: given("a typed leaf keeps a type the spec allows"),
		choice: given(
			"a choice resolves to cases the spec offered: narrowing to fewer is allowed, inventing one is not",
		),
		coverage: given(
			"every part the spec names is covered — except a fact, which is the spec's to assert, though a decision that does restate one restates it faithfully",
		),
		depth: given(
			"the walk is total: it recurses through a collection's element, an optional's value and a choice's cases, not only through named parts, so a decision cannot escape the check by nesting",
		),
		blame: given(
			"a failure names the address of the concept that failed, the way the artifact addresses it, rather than blaming the root",
		),
		mechanism: given(
			"equivalently, and this is how the typechecker resolves it: the decision's projection is assignable to the spec's projection, so a decision that contradicts the spec fails to compile",
		),
	},
);

export const projection = def(
	"the concrete type a spec projects into for real code. Every form has a rule, so a spec projects as far down as it is specified instead of stopping at the first form that is not a plain object of parts — one rule per form, below",
	{
		parts: given("named parts become an object of the projected parts"),
		leaf: given("a typed leaf becomes its token's type"),
		choice: given(
			"a choice becomes the union of its case keys, which a pick narrows to the one key it named",
		),
		collection: given("a collection becomes an array of its element's projection"),
		optional: given(
			"an optional becomes an optional key, not a required one holding `undefined`",
		),
		reference: given("a reference projects through the concept it points at"),
		shape: given(
			"a shape projects through its target, with its own parts laid over that target's rather than replacing them",
		),
		fact: given(
			"a fact becomes the literal value it asserts, so the code has to reproduce it",
		),
		gap: given(
			"an untyped gap stays open as `unknown`, so the typechecker holds the code to exactly as much as the spec chose to type — and to no less, at any depth",
		),
	},
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
				narrow: def(
					"how a gap closes: by restating a concept with more carved out, or — for a choice, which closes by selection rather than by carving — by naming one of its cases with pick",
				),
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
			total: given(
				"both halves reach every form at every depth, and nothing the typechecker sees is hidden from the artifact, the scaffold or the check — a guarantee that holds only part of the way down is one you cannot rely on anywhere, because a green check does not tell you which part you got",
			),
		}),
		primitives: ref(primitives),
		pipeline: ref(pipeline),
	},
);

export default codeform;
