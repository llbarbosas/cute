import { LexerRulesObject } from "./src/types/cute.d.ts";
// import Lexer, { LexerRulesObject } from "./src/lexer.ts";
import Lexer from "./src/lexer.ts";

export default {
  compile: (rules: LexerRulesObject): Lexer => new Lexer(rules),
  error: Object.freeze({ match: /.+/, error: true }),
};
