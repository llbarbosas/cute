import Lexer, { LexerRulesObject } from "./src/lexer.ts";

export default {
  compile: (rules: LexerRulesObject): Lexer => new Lexer(rules),
  error: Object.freeze({ match: /.+/, error: true }),
};
