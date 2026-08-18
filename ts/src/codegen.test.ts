import assert from "node:assert/strict";
import { test } from "node:test";
import { codegen, conceptNames } from "./codegen";
import { def } from "./def";
import { of } from "./of";
import { oneOf } from "./oneOf";
import { ref } from "./ref";

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
	assert.match(out, /import \{ type Conforms, .* \} from "codeform";/);
	assert.match(out, /export const user = def\("someone", \{/);
	assert.match(out, /status: of\(spec\.status\)/);
	assert.match(
		out,
		/export const _user: Conforms<typeof user, typeof spec\.user, "user"> = conforms<typeof user, typeof spec\.user, "user">\(\);/,
	);
	assert.match(out, /export const status = oneOf\(\{/); // keyed choice
	assert.match(out, /owner: ref\("the lead", spec\.user\)/);
});

test("only-mode emits just the named roots, no header", () => {
	const out = codegen(fixture(), opts, ["user"]);
	assert.doesNotMatch(out, /^import /m);
	assert.match(out, /export const user = /);
	assert.doesNotMatch(out, /export const project = /);
});
