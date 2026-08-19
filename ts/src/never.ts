import { former, type Node } from "./concept.js";
import type { Gap } from "./gap.js";

/**
 * Declines a region: "this does not apply here, and I know it doesn't."
 *
 * The far end of the dial past `given`. A `def` is a question you have not
 * answered; a `given` is one you answered with content; a `never` is one you
 * answered with "nothing". Without it there is no way to tell a decision from
 * an oversight, which is the whole reason a fixed space is worth having.
 */
export type Never = Node<"never", Gap, {}, undefined, { readonly declined: true }>;

/** Decline a region, saying why. */
export function never(because: string): Never {
	return { [former]: "never", description: because, declined: true } as Never;
}
