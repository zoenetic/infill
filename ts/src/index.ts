/**
 * `codeform` - spec driven development for people who still want to write code.
 *
 * Build specifications out of `def`, `ref`, `of`, `many`, `maybe` and `oneOf` concepts,
 * then use {@link emit} to render them as a self-describing document that names each
 * concept's gaps for a human or AI to fill in.
 */
export { codegen, conceptNames } from "./codegen.js";
export { type Conforms, conforms } from "./conforms.js";
export { def } from "./def.js";
export { emit } from "./emit.js";
export { given } from "./given.js";
export { many } from "./many.js";
export { maybe } from "./maybe.js";
export { of } from "./of.js";
export { oneOf } from "./oneOf.js";
export { pick } from "./pick.js";
export { ref } from "./ref.js";
export type { Shape } from "./shape.js";
