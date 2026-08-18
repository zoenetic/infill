import type { Concept } from "./concept.js";

/** The named parts used to fill in a concept's structure: a map from part name to child concept. */
export type Fill = Record<string, Concept<any, any>>;
