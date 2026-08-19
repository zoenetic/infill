/**
 * The base conceptual space — Zachman's interrogatives, as a codeform spec.
 *
 * Nothing here is answered. Every region is an open gap whose whole job is to
 * make you say something, or say explicitly that it does not apply. The space
 * is a prompt, not a taxonomy: it does not need to be a complete account of
 * software to be useful, it needs to stop you moving on.
 */
import { def, many, of } from "codeform";

export const region = def("one area of the space, to be answered or declined", {
	answer: of("what is true here for this system", String),
});

export const space = def(
	"every system definition, laid out so that leaving something out is a decision rather than an oversight",
	{
		why: def(
			"the motivation: what this is for, who for, and how you would know it worked",
		),
		what: def("the things the system holds — its entities and their content"),
		how: def("the processes: what can be done, and what happens when it is"),
		who: def("the actors: who or what acts, and what each is allowed to do"),
		when: def("the timing: lifecycles, states, ordering, and what triggers change"),
		where: def(
			"the locations: what the system talks to, where it runs, and how it is reached",
		),
	},
);
