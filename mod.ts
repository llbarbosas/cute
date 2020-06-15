import {
  LexerRulesObject,
  StatesObject,
} from "./src/cute.d.ts";
import Lexer from "./src/lexer.ts";
import StatefulLexer from "./src/stateful_lexer.ts";

export default {
  compile(rules: LexerRulesObject) {
    return new Lexer(rules);
  },
  states(states: StatesObject) {
    return new StatefulLexer(states);
  },
};
