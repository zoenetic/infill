import { crawl, gapsOf } from "../src/crawl";
import * as spec from "./spec";

for (const root of crawl(spec as Record<string, unknown>)) {
	console.log(root.path, gapsOf(root));
	console.dir(root, { depth: null });
}
