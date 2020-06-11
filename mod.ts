import {
  LexerRulesObject,
  StatesObject,
  LexerInterface,
  RecursiveRulesObject,
} from "./src/types/cute.d.ts";
import Lexer from "./src/lexer.ts";
import StatefulLexer from "./src/stateful_lexer.ts";
import RecursiveLexer from "./src/recursive_lexer.ts";

export default {
  compile(rules: LexerRulesObject) {
    return new Lexer(rules);
  },
  states(states: StatesObject) {
    return new StatefulLexer(states);
  },
  recursive(lexer: Lexer, rules: RecursiveRulesObject) {
    return new RecursiveLexer(lexer, rules);
  },
};
