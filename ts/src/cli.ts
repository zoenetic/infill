import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { codegen, conceptNames } from "./codegen";

async function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			lib: { type: "string", default: "infill" },
			overwrite: { type: "boolean", default: false },
		},
	});
	const [cmd, specPath] = positionals;
	if (cmd !== "gen" || !specPath) {
		console.error(
			"Usage: infill gen <spec.ts> [--lib <specifier>] [--overwrite]",
		);
		process.exit(1);
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

	if (!existsSync(outPath) || values.overwrite) {
		writeFileSync(outPath, codegen(specMod, opts));
		console.error(`wrote ${outPath}`);
		return;
	}

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
	writeFileSync(
		outPath,
		`${readFileSync(outPath, "utf8").trimEnd()}\n\n${additions}\n`,
	);
	console.error(`added ${missing.length} root(s): ${missing.join(", ")}\n`);
}

main();
