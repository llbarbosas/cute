import Lexer from "../lexer.ts";
import StatefulLexer from "../stateful_lexer.ts";

export type LexerRule = {
  match: string | RegExp;
  value?: (s: string) => string;
  lineBreaks?: boolean;
  ignore?: boolean;
  error?: boolean;
  push?: string;
  next?: string;
  pop?: number;
};

export type CompiledLexerRule = LexerRule & {
  match: RegExp;
};

export type Pattern = RegExp | string[] | string | LexerRule;

export type LexerRulesObject = {
  [name: string]: Pattern;
};

export type CompiledLexerRulesObject = {
  [name: string]: CompiledLexerRule;
};

export type Token = {
  type: string;
  value: string;
  text: string;
  offset: number;
  lineBreaks: number;
  line: number;
  col: number;
};

export interface LexerInterface {
  next(): IteratorResult<Token>;
  reset(buffer: string): LexerInterface;
  [Symbol.iterator](): { next: () => IteratorResult<Token> };
}

export type StatesObject = {
  [state: string]: LexerRulesObject;
};

export type LexersObject = {
  [stateLexer: string]: Lexer;
};

export type RecursiveRulesObject = {
  [name: string]: {
    match: string | string[];
    value: (values: string[]) => string;
  };
};
