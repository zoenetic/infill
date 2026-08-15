import { codegen } from "../../ts/src";
import * as spec from "./spec";

console.log(
	codegen(spec as Record<string, unknown>, {
		lib: "../../ts/src",
		spec: "./spec",
	}),
);
