import { LexerRulesObject, StatesObject } from "./src/types/cute.d.ts";
import Lexer from "./src/lexer.ts";
import StatefulLexer from "./src/stateful_lexer.ts";

export default {
  compile: (rules: LexerRulesObject) => new Lexer(rules),
  states: (states: StatesObject) => new StatefulLexer(states),
};
