import type { Shape } from "infill";
import * as spec from "./spec";

// Phase 2: real code, typed by the spec. `Shape<typeof spec.route>` is
// `{ path: string; method: "get" | "post" | "delete"; authenticated: boolean }`,
// so every value is checked — a wrong method or a non-string path won't compile.
export const usersRoute: Shape<typeof spec.route> = {
	path: "/users/:id",
	method: "get",
	authenticated: true,
};
