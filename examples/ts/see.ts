import { emit } from "../../ts/src/emit";
import * as spec from "./spec";

const { yaml, warnings } = emit(spec as Record<string, unknown>);
console.log(yaml);
for (const w of warnings) console.error(`⚠ ${w.path}: ${w.message}`);
