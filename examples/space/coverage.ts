/**
 * The report a fixed space makes possible and a pile of markdown does not:
 * for every region the space asks about, did you answer, decline, or not look?
 */
import { former, type Concept } from "codeform";
import { space } from "./space.js";
import { orders } from "./orders.js";

type State = "answered" | "declined" | "untouched";

const describe = (c: Concept<any, any>) => c.description ?? "";

function stateOf(asked: Concept<any, any>, given?: Concept<any, any>): State {
	if (!given) return "untouched";
	if (given[former] === "never") return "declined";
	// Untouched = still word-for-word the question the space asked, with nothing
	// carved under it. Anything else is an answer.
	const restated = describe(given) === describe(asked);
	const carved = Object.keys(given.fill ?? {}).length > 0;
	return restated && !carved ? "untouched" : "answered";
}

const asked = space.fill ?? {};
const answers = (orders.fill ?? {}) as Record<string, Concept<any, any>>;

const mark = { answered: "✔", declined: "—", untouched: "·" } as const;
const rows = Object.entries(asked).map(([name, q]) => {
	const s = stateOf(q, answers[name]);
	const note =
		s === "declined" ? describe(answers[name]) :
		s === "answered" ? describe(answers[name]) :
		"nobody has looked at this yet";
	return { name, s, note };
});

const width = Math.max(...rows.map((r) => r.name.length));
console.log(`\ncoverage of \`space\` by \`orders\`\n`);
for (const r of rows)
	console.log(`  ${mark[r.s]} ${r.name.padEnd(width)}  ${r.s.padEnd(9)} ${r.note}`);

const tally = rows.reduce<Record<State, number>>(
	(a, r) => ({ ...a, [r.s]: a[r.s] + 1 }),
	{ answered: 0, declined: 0, untouched: 0 },
);
console.log(
  `\n  ${tally.answered} answered, ${tally.declined} declined, ${tally.untouched} not looked at ` +
  `— ${tally.answered + tally.declined}/${rows.length} regions acknowledged\n`,
);
