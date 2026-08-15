/**
 * `infill` - spec driven development for people who still want to write code.
 *
 * Build specifications out of `def`, `ref`, `of`, `many`, `maybe` and `oneOf` concepts,
 * then use {@link emit} to render them as a self-describing document that names each
 * concept's gaps for a human or AI to fill in.
 */
export { codegen } from "./codegen";
export type { Conforms } from "./conforms";
export { def } from "./def";
export { emit } from "./emit";
export { many } from "./many";
export { maybe } from "./maybe";
export { of } from "./of";
export { oneOf } from "./oneOf";
export { pick } from "./pick";
export { ref } from "./ref";
