import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { codegen, conceptNames } from "./codegen";
import { emit } from "./emit";

const require = createRequire(import.meta.url);

function check(specPath: string): number {
	const dir = dirname(resolve(specPath));
	const tscBin = resolve(dirname(require.resolve("typescript")), "../bin/tsc");
	const { status } = spawnSync(
		process.execPath,
		[tscBin, "--noEmit", "-p", dir],
		{
			stdio: "inherit",
		},
	);
	if (status === 0) console.error("✅ decisions conform");
	return status ?? 1;
}

async function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			lib: { type: "string", default: "codeform" },
			overwrite: { type: "boolean", default: false },
		},
	});
	const [cmd, specPath] = positionals;
	if ((cmd !== "gen" && cmd !== "check" && cmd !== "emit") || !specPath) {
		console.error(
			"Usage:\n  codeform gen <spec.ts> [--lib <specifier>] [--overwrite]\n  codeform check <spec.ts>\n  codeform emit <spec.ts>",
		);
		process.exit(1);
	}
	if (cmd === "check") process.exit(check(specPath));
	if (cmd === "emit") {
		const mod = (await import(pathToFileURL(resolve(specPath)).href)) as Record<
			string,
			unknown
		>;
		const { yaml, warnings } = emit(mod);
		process.stdout.write(`${yaml}\n`);
		for (const w of warnings) console.error(`⚠ ${w.path}: ${w.message}`);
		return;
	}

	const specAbs = resolve(specPath);
	const outPath = resolve(dirname(specAbs), "decisions.gen.ts");
	const opts = {
		lib: values.lib,
		spec: `./${basename(specAbs).replace(/\.ts$/, "")}`,
	};
	const specMod = (await import(pathToFileURL(specAbs).href)) as Record<
		string,
		unknown
	>;

	// Bootstrap writes the whole file. Rather than checking existence first
	// (a TOCTOU race), create the file exclusively and treat EEXIST as "already
	// there — merge additively". `--overwrite` writes unconditionally.
	if (values.overwrite) {
		writeFileSync(outPath, codegen(specMod, opts));
		console.error(`wrote ${outPath}`);
		return;
	}
	try {
		writeFileSync(outPath, codegen(specMod, opts), { flag: "wx" });
		console.error(`wrote ${outPath}`);
		return;
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
	}

	// The file exists: read its text once and load it for its concept names,
	// then append any roots it is missing.
	const existing = readFileSync(outPath, "utf8");
	const decMod = (await import(pathToFileURL(outPath).href)) as Record<
		string,
		unknown
	>;
	const have = new Set(conceptNames(decMod));
	const missing = conceptNames(specMod).filter((n) => !have.has(n));
	if (missing.length === 0) {
		console.error("decisions file up to date");
		return;
	}

	const additions = codegen(specMod, opts, missing);
	writeFileSync(outPath, `${existing.trimEnd()}\n\n${additions}\n`);
	console.error(`added ${missing.length} root(s): ${missing.join(", ")}\n`);
}

main();
