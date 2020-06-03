import Lexer, { LexerRules } from "./lexer.ts";

const compile = (rules: LexerRules): Lexer => new Lexer(rules);

export default { compile };
