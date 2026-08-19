import assert from "node:assert/strict";
import { test } from "node:test";
import { codegen, conceptNames } from "./codegen.js";
import { def } from "./def.js";
import { given } from "./given.js";
import { of } from "./of.js";
import { oneOf } from "./oneOf.js";
import { pick } from "./pick.js";
import { ref } from "./ref.js";

function fixture() {
	const status = oneOf({ active: def("usable"), inactive: def("closed") });
	const user = def("someone", { name: def(), status: of(status) });
	const project = def({ owner: ref("the lead", user), tags: def() });
	return { status, user, project } as Record<string, unknown>;
}

const opts = { lib: "codeform", spec: "./spec" };

test("conceptNames lists concept exports in order", () => {
	assert.deepEqual(conceptNames(fixture()), ["status", "user", "project"]);
});

test("codegen mirrors each root with a _conforms line", () => {
	const out = codegen(fixture(), opts);
	// only the formers actually emitted are imported (no many/maybe/pick/given)
	assert.match(
		out,
		/^import \{ type Conforms, conforms, def, of, oneOf, ref \} from "codeform";$/m,
	);
	assert.match(out, /export const user = def\("someone", \{/);
	assert.match(out, /status: of\(spec\.status\)/);
	assert.match(
		out,
		/export const _user: Conforms<typeof user, typeof spec\.user, "user"> = conforms<typeof user, typeof spec\.user, "user">\(\);/,
	);
	assert.match(out, /export const status = oneOf\(\{/); // keyed choice
	assert.match(out, /owner: ref\("the lead", spec\.user\)/);
});

test("a pick round-trips as pick(origin, key), not a single-case oneOf", () => {
	const plan = oneOf("their tier", { free: def("no cost"), pro: def("paid") });
	const account = def({ plan: pick(plan, "pro") });
	const out = codegen({ plan, account } as Record<string, unknown>, opts);
	// reconstructs the pick against the origin choice — no inlined case copy
	assert.match(out, /plan: pick\(spec\.plan, "pro"\)/);
	assert.doesNotMatch(out, /plan: oneOf\(/);
	// and `pick` is imported, since it was emitted
	assert.match(out, /^import \{[^}]*\bpick\b[^}]*\} from "codeform";$/m);
});

test("only-mode emits just the named roots, no header", () => {
	const out = codegen(fixture(), opts, ["user"]);
	assert.doesNotMatch(out, /^import /m);
	assert.match(out, /export const user = /);
	assert.doesNotMatch(out, /export const project = /);
});

test("a spec concept named `spec` doesn't collide with the namespace import", () => {
	// codeform's own spec exports a concept called `spec`, which used to generate
	// a file whose `import * as spec` clashed with `export const spec`, and whose
	// `_spec` assertion clashed with the fallback alias.
	const concept = def("a node");
	const spec = def("what the author writes", { concepts: of(concept) });
	const out = codegen({ concept, spec } as Record<string, unknown>, opts);
	assert.match(out, /^import \* as (__spec|_spec) from "\.\/spec";$/m);
	assert.doesNotMatch(out, /^import \* as spec from/m);
	assert.match(out, /typeof __spec\.spec/);
});

test("an `of` with nothing to take on is refused at the call, not at codegen", () => {
	// A from-less, token-less `of` used to reach codegen as a leaf it could not
	// address, and emitted `of(desc, spec./*inline*/)` — not valid source. There
	// is no such node any more: `of` needs a concept or a token.
	assert.throws(
		() => (of as (d: string) => unknown)("anything you like"),
		/takes on a concept's shape or a token's type/,
	);
});

test("an unbound target is reproduced inline, not addressed through the spec", () => {
	const holder = def("a holder", { at: ref(def("nowhere in particular")) });
	const out = codegen({ holder } as Record<string, unknown>, opts);
	assert.match(out, /at: ref\(def\("nowhere in particular"\)\)/);
	assert.doesNotMatch(out, /inline/);
});

test("facts are carried into the decisions file, so the projection keeps them", () => {
	// A decision needn't assert a fact, but dropping it from the generated mirror
	// dropped it from `Shape<typeof decisions.…>` too — and then the
	// implementation was never held to it.
	const node = def("a node", { form: given("concept"), name: of(String) });
	const out = codegen({ node } as Record<string, unknown>, opts);
	assert.match(out, /form: given\("concept"\)/);
});

test("an empty fill emits as `{}` rather than a blank block", () => {
	const bare = def("a concept with an empty fill", {});
	const out = codegen({ bare } as Record<string, unknown>, opts);
	assert.match(out, /def\("a concept with an empty fill", \{\}\)/);
});
