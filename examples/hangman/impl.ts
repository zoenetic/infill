#!/usr/bin/env tsx
/**
 * Hangman — implemented from the codeform spec `hangman-artifact.yaml`.
 *
 * Spec-pinned facts (from the artifact):
 *   - hangman.answer   : string, "lowercase letters only" — the secret word.
 *   - hangman.maxWrong : number — wrong guesses allowed before losing.
 *   - hangman.guessed  : collection of string — letters already guessed.
 *   - hangman.status   : one of { playing, won, lost } (shape of `status`).
 *   - hangman.guess    : guess ONE letter; if answer contains it, reveal every
 *                        occurrence, else it is a wrong guess. Ignore a letter
 *                        already guessed. Win when every letter revealed; lose
 *                        once wrong guesses REACH maxWrong.
 *   - hangman.display  : answer with un-guessed letters as underscores, the
 *                        wrong letters guessed, and how many tries remain.
 *
 * Everything not pinned above is an inferred decision — see the report and the
 * inline `INFERRED:` notes.
 */

import * as readline from "node:readline";

// ── Types (status is the spec's three-case choice) ────────────────────────────
export type Status = "playing" | "won" | "lost";

export interface GameState {
	answer: string; // hangman.answer  (fact: lowercase letters only)
	maxWrong: number; // hangman.maxWrong
	guessed: string[]; // hangman.guessed  (INFERRED: a Set-like ordered array of single letters)
	status: Status; // hangman.status
}

// ── Pure core ─────────────────────────────────────────────────────────────────

/**
 * INFERRED: initial values. guessed starts empty; status starts "playing".
 * A zero-length answer would be "already won", but the spec says a word is
 * picked, so callers supply a real word.
 */
export function createGame(answer: string, maxWrong: number): GameState {
	return { answer, maxWrong, guessed: [], status: "playing" };
}

/** Distinct letters of the answer that still need revealing to win. */
function answerLetters(state: GameState): Set<string> {
	return new Set(state.answer.split(""));
}

/** Wrong letters = guessed letters not in the answer. */
export function wrongLetters(state: GameState): string[] {
	return state.guessed.filter((g) => !state.answer.includes(g));
}

/** How many wrong guesses remain before the loss threshold. */
export function triesRemaining(state: GameState): number {
	return state.maxWrong - wrongLetters(state).length;
}

/** True once every distinct answer letter has been guessed. */
function allRevealed(state: GameState): boolean {
	for (const letter of answerLetters(state)) {
		if (!state.guessed.includes(letter)) return false;
	}
	return true;
}

/**
 * The one mutating step of the spec's `hangman.guess`.
 *
 * INFERRED: guesses are delivered as a single-character string. We normalise
 * to lowercase (answer is lowercase-only per the fact) so an uppercase key
 * still matches. Non-letters and multi-char input are rejected as invalid and
 * leave state untouched (INFERRED — the spec only describes "one letter").
 *
 * Returns a small outcome tag so the CLI can narrate; the core stays pure
 * (returns a NEW state, never mutates the input).
 */
export type GuessOutcome =
	| "invalid" // not a single a–z letter
	| "repeat" // already guessed — ignored per spec
	| "hit" // letter is in the answer
	| "miss" // wrong guess
	| "over"; // game already finished

export interface GuessResult {
	state: GameState;
	outcome: GuessOutcome;
}

export function guess(state: GameState, raw: string): GuessResult {
	if (state.status !== "playing") {
		return { state, outcome: "over" };
	}

	const letter = raw.trim().toLowerCase();

	// INFERRED: validate to a single a–z letter.
	if (letter.length !== 1 || letter < "a" || letter > "z") {
		return { state, outcome: "invalid" };
	}

	// Spec: "Ignore a letter already guessed."
	if (state.guessed.includes(letter)) {
		return { state, outcome: "repeat" };
	}

	const guessed = [...state.guessed, letter];
	const next: GameState = { ...state, guessed };

	const hit = state.answer.includes(letter);

	// Spec: win when every letter revealed; lose once wrong reaches maxWrong.
	if (allRevealed(next)) {
		next.status = "won";
	} else if (wrongLetters(next).length >= next.maxWrong) {
		next.status = "lost";
	} else {
		next.status = "playing";
	}

	return { state: next, outcome: hit ? "hit" : "miss" };
}

/**
 * Drive a whole sequence of guesses through the pure core — the testable
 * "pure step you can call with a sequence of guesses".
 */
export function playSequence(
	answer: string,
	maxWrong: number,
	guesses: string[],
): { state: GameState; outcomes: GuessOutcome[] } {
	let state = createGame(answer, maxWrong);
	const outcomes: GuessOutcome[] = [];
	for (const g of guesses) {
		const r = guess(state, g);
		state = r.state;
		outcomes.push(r.outcome);
	}
	return { state, outcomes };
}

// ── Display (hangman.display) ─────────────────────────────────────────────────
/**
 * The view shown each turn: answer with un-guessed letters as underscores,
 * the wrong letters guessed, and how many tries remain.
 *
 * INFERRED: exact rendering — spaced underscores/letters ("h _ n _ m _ n"),
 * wrong letters comma-joined, "Tries remaining" line. Genre-obvious in spirit,
 * open in exact glyphs.
 */
export function renderMasked(state: GameState): string {
	return state.answer
		.split("")
		.map((ch) => (state.guessed.includes(ch) ? ch : "_"))
		.join(" ");
}

export function display(state: GameState): string {
	const masked = renderMasked(state);
	const wrong = wrongLetters(state);
	const lines = [
		`Word:  ${masked}`,
		`Wrong: ${wrong.length ? wrong.join(", ") : "(none)"}`,
		`Tries remaining: ${triesRemaining(state)}`,
	];
	return lines.join("\n");
}

// ── CLI wrapper ───────────────────────────────────────────────────────────────
/**
 * INFERRED: where the secret word comes from. Priority:
 *   1) HANGMAN_WORD env var (used by the automated playthroughs),
 *   2) first CLI arg,
 *   3) a random pick from a small built-in list.
 * maxWrong defaults to 6 (the classic gallows count) unless HANGMAN_MAX is set.
 */
const WORD_LIST = ["hangman", "typescript", "codeform", "gallows", "puzzle"];

function pickWord(): string {
	const env = process.env.HANGMAN_WORD;
	if (env) return env.toLowerCase();
	const arg = process.argv[2];
	if (arg) return arg.toLowerCase();
	return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

function narrate(outcome: GuessOutcome, letter: string): string {
	switch (outcome) {
		case "hit":
			return `Good — '${letter}' is in the word.`;
		case "miss":
			return `Sorry — no '${letter}'.`;
		case "repeat":
			return `You already guessed '${letter}'.`;
		case "invalid":
			return `Please enter a single letter a–z.`;
		case "over":
			return `The game is already over.`;
	}
}

async function runCli(): Promise<void> {
	const answer = pickWord();
	const maxWrong = Number(process.env.HANGMAN_MAX ?? 6);
	let state = createGame(answer, maxWrong);

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log("H A N G M A N");
	console.log(
		`Guess the ${answer.length}-letter word. ${maxWrong} wrong guesses allowed.\n`,
	);
	console.log(display(state));
	process.stdout.write("\nGuess a letter: ");

	// Async line iterator works for both a live TTY and piped stdin.
	for await (const raw of rl) {
		const r = guess(state, raw);
		state = r.state;
		const letter = raw.trim().toLowerCase();
		console.log(narrate(r.outcome, letter) + "\n");
		if (state.status !== "playing") break;
		console.log(display(state));
		process.stdout.write("\nGuess a letter: ");
	}

	console.log(display(state));
	if (state.status === "won") {
		console.log(`\nYou won! The word was "${answer}".`);
	} else {
		console.log(`\nYou lost. The word was "${answer}".`);
	}
	rl.close();
}

// Only run the CLI when executed directly, not when imported by tests.
const isMain =
	process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
	runCli().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}
