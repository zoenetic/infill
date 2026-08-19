/**
 * `codeform` - spec driven development for people who still want to write code.
 *
 * Build specifications out of `def`, `ref`, `of`, `many`, `maybe` and `oneOf` concepts,
 * then use {@link emit} to render them as a self-describing document that names each
 * concept's gaps for a human or AI to fill in.
 */
export { codegen } from "./codegen.js";
export type { Concept, Former, Node, TypeOf } from "./concept.js";
export { type Conforms, conforms } from "./conforms.js";
export { def, type Def } from "./def.js";
export { emit } from "./emit.js";
export type { Fill } from "./fill.js";
export type { Gap, GapOf } from "./gap.js";
export { given, type Given } from "./given.js";
export { many, type Many } from "./many.js";
export { maybe, type Maybe } from "./maybe.js";
export {
	of,
	type Of,
	type OfToken,
	type OfType,
	type TokenType,
	type TypeToken,
} from "./of.js";
export { type Choice, oneOf } from "./oneOf.js";
export { type CasesOf, pick, type Picked } from "./pick.js";
export { ref, type Ref } from "./ref.js";
export type { Shape } from "./shape.js";
