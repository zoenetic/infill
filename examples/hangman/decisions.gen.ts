import { type Conforms, conforms, def, many, maybe, of, oneOf, pick, ref } from "codeform";
import * as spec from "./spec";

export const hangman = def("a command-line hangman game the player runs and plays to completion: pick a word, then let them guess letters until they win or run out of tries", {
	answer: of("the secret word to guess, lowercase letters only", String),
	maxWrong: of("how many wrong guesses are allowed before losing", Number),
	guessed: many("the letters the player has already guessed", of(String)),
	status: of(spec.status),
	guess: def("the player guesses one letter. If the answer contains it, reveal every occurrence; otherwise it is a wrong guess. Ignore a letter already guessed. Win when every letter is revealed; lose once the wrong guesses reach maxWrong."),
	display: def("the view shown each turn: the answer with un-guessed letters as underscores, the wrong letters guessed, and how many tries remain"),
});
export const _hangman: Conforms<typeof hangman, typeof spec.hangman, "hangman"> = conforms<typeof hangman, typeof spec.hangman, "hangman">();

export const status = oneOf("how the game stands", {
	playing: def("the player still has guesses left and letters hidden"),
	won: def("every letter in the answer has been revealed"),
	lost: def("the player used up all their wrong guesses"),
});
export const _status: Conforms<typeof status, typeof spec.status, "status"> = conforms<typeof status, typeof spec.status, "status">();
