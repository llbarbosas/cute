import Lexer, { LexerRules } from "./src/lexer.ts";

export default {
  compile: (rules: LexerRules): Lexer => new Lexer(rules),
  error: Object.freeze({ match: /.*?/, error: true }),
};
