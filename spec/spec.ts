import { def, given, many, maybe, of, oneOf, ref } from "infill";

export const concept = def(
	"infill's one node type; a spec is a tree of these",
	{
		name: of<string>(
			"the key a concept is bound under — its module export name, or its fill key",
		),
		description: maybe(
			of<string>(
				"states the need here; absent when the name says enough on its own",
			),
		),
	},
);

export const former = oneOf(
	"each former produces a kind of node from its own operands",
	{
		def: def(
			"the broadest former; a concept, optionally carved into named parts",
			{
				form: given("concept"),
			},
		),
		ref: def("points at another concept without inheriting its gaps", {
			target: ref(concept),
			form: given("reference"),
		}),
		of: def(
			"takes another concept's shape and gaps, and may refine it with parts",
			{
				target: ref(concept),
				form: given("shape"),
			},
		),
		many: def("some number of an inner concept", {
			inner: ref(concept),
			form: given("collection"),
		}),
		maybe: def("zero or one of an inner concept", {
			inner: ref(concept),
			form: given("optional"),
		}),
		oneOf: def("exactly one of a set of named cases; closed as written", {
			cases: many(ref(concept)),
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

export const primitives = def("the primitives infill is built from", {
	concept: ref(concept),
	former: ref(former),
});

export const spec = def(
	"what the human author writes; bound concepts that may be narrowed",
	{
		concepts: many(ref(concept)),
	},
);

export const pipeline = def(
	"from spec to a generated output the model can read and write",
	{
		spec: ref(spec),
		artifact: def("the model-facing rendering the model reads", {
			version: given(1),
			root: ref("the spec's entry-point concept", concept),
			legend: def(
				"model-facing instructions on how to read gaps, names, and forms",
			),
		}),
		decisions: of(
			"decisions made by the model, which the typechecker can verify against the spec",
			spec,
		),
		cli: def("the infill command line", {
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

export const infill = def(
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
			typeChecked: given("decisions must conform to the spec, verified by tsc"),
		}),
		primitives: ref(primitives),
		pipeline: ref(pipeline),
	},
);

export default infill;
