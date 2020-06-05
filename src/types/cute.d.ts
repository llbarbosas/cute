export type LexerRule = {
  match: string | RegExp;
  value?: (s: string) => string;
  lineBreaks?: boolean;
  ignore?: boolean;
  error?: boolean;
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
