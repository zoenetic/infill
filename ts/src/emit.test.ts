import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "yaml";
import { emit } from "./emit.js";
import { def, given, many, of, oneOf, ref } from "./index.js";

function fixture() {
	const status = oneOf({ active: def("usable"), inactive: def("closed") });
	const user = def("someone who signs in", {
		email: def("their contact address"),
		name: def(),
		status: of(status),
	});
	const project = def("a body of work", {
		owner: ref("the project lead", user),
		tags: many(def()),
	});
	return { status, user, project };
}

test("emit renders header, legend, and per-node fields", () => {
	const { yaml } = emit(fixture() as Record<string, unknown>);
	const doc = parse(yaml);

	assert.equal(doc.codeform, 1);
	assert.deepEqual(Object.keys(doc.howToRead.forms).sort(), [
		"choice",
		"collection",
		"concept",
		"fact",
		"optional",
		"reference",
		"shape",
	]);

	const user = doc.concepts.user;
	assert.equal(user.form, "concept");
	assert.equal(user.path, "user");
	assert.match(user.reading, /`user`/);
	assert.match(user.gap, /^Partial/);
});

test("form mapping: concept / shape / reference / collection / name-only", () => {
	const doc = parse(emit(fixture() as Record<string, unknown>).yaml);
	const user = doc.concepts.user;
	const project = doc.concepts.project;

	// name-only leaf
	assert.equal(user.parts.name.describedBy, "name only");
	assert.equal(user.parts.name.gap, "Total.");
	// of -> shape + shapedLike
	assert.equal(user.parts.status.form, "shape");
	assert.equal(user.parts.status.shapedLike, "status");
	// ref -> reference + pointsAt
	assert.equal(project.parts.owner.form, "reference");
	assert.equal(project.parts.owner.pointsAt, "user");
	// many -> collection + each
	assert.equal(project.parts.tags.form, "collection");
	assert.ok(project.parts.tags.each);
});

test("keyed oneOf renders cases with #key paths", () => {
	const doc = parse(emit(fixture() as Record<string, unknown>).yaml);
	const status = doc.concepts.status;
	assert.equal(status.form, "choice");
	assert.deepEqual(Object.keys(status.cases), ["active", "inactive"]);
	assert.equal(status.cases.active.path, "status#active");
});

test("a default export sets the artifact root", () => {
	const f = fixture();
	const { yaml } = emit({ ...f, default: f.user } as Record<string, unknown>);
	assert.equal(parse(yaml).root, "user");
});

test("a bare mention of a bound concept in a fill warns", () => {
	const f = fixture();
	const bad = { ...f, account: def("an account", { status: f.status }) };
	const { warnings } = emit(bad as Record<string, unknown>);
	assert.ok(
		warnings.some(
			(w) => w.path === "account.status" && /bare mention/.test(w.message),
		),
	);
});

test("a given renders as a closed fact", () => {
	const doc = parse(
		emit({ pinned: given("no reserved keys, ever") } as Record<string, unknown>)
			.yaml,
	);
	assert.equal(doc.concepts.pinned.form, "fact");
	assert.equal(doc.concepts.pinned.is, "no reserved keys, ever");
	assert.match(doc.concepts.pinned.gap, /^None/);
	assert.equal(doc.concepts.pinned.describedBy, undefined);
});

test("a keyed many renders its key alongside its element", () => {
	const node = def("a node", { title: of(String) });
	const spec = def("a spec", {
		concepts: many("by the name each is bound under", of(String), of(node)),
	});
	const { yaml } = emit({ node, spec } as Record<string, unknown>);
	assert.match(yaml, /keyedBy:/);
	assert.match(yaml, /path: spec\.concepts\{\}/);
	assert.match(yaml, /path: spec\.concepts\[\]/);
	assert.match(yaml, /each element is addressed by a key|addressed by a key/);
});

test("an unkeyed many says the container is a sequence", () => {
	const spec = def("a list", { items: many("in order", of(String)) });
	const { yaml } = emit({ spec } as Record<string, unknown>);
	assert.doesNotMatch(yaml, /keyedBy:/);
	assert.match(yaml, /the container is a sequence/);
});
