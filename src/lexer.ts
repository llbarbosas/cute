import {
  isObject,
  isArray,
  isRegExp,
  isString,
  countLineBreaks,
  stringByteSize,
  combineRegexp,
  regExpFromString,
  getValues,
  removeFlags,
} from "./util.ts";

type Token = {
  type: string;
  value: string;
  text: string;
  offset: number;
  lineBreaks: number;
  line: number;
  col: number;
};

type LexerRuleObj = { // LexerRule
  match: string | RegExp;
  value?: (s: string) => string;
  lineBreaks?: boolean;
  ignore?: boolean;
  error?: boolean;
};

type CompiledLexerRule = LexerRuleObj & { // CompiledLexerRule
  match: RegExp;
};

type LexerSave = {
  line: number;
  col: number;
};

type Pattern = RegExp | string[] | string | LexerRuleObj; // Pattern

export type LexerRulesObject = { // LexerRulesObject
  [name: string]: Pattern;
};

type CompiledLexerRulesObject = { // CompiledLexerRulesObject
  [name: string]: CompiledLexerRule;
};

export default class Lexer {
  private buffer = "";
  private done = false;
  private line = 1;
  private col = 1;

  private rules: CompiledLexerRulesObject;
  private regexp: RegExp;

  constructor(rules: LexerRulesObject) {
    this.rules = this.compileRules(rules);
    this.regexp = combineRegexp(getValues(this.rules, "match"), true);
  }

  private compileRule(
    rule: Pattern,
  ): CompiledLexerRule {
    if (isString(rule)) {
      return {
        match: regExpFromString(rule),
      };
    }

    if (isRegExp(rule)) {
      return {
        match: rule,
      };
    }

    if (isArray(rule)) {
      return {
        match: combineRegexp(rule),
      };
    }

    if (isObject(rule)) {
      return {
        ...rule,
        match: isRegExp(rule.match) ? rule.match : regExpFromString(rule.match),
      };
    }

    throw new Error(`Unexpected pattern type: ${rule}`);
  }

  private compileRules(
    rules: LexerRulesObject,
  ): CompiledLexerRulesObject {
    return Object
      .entries(rules)
      .reduce((obj: {}, [ruleName, pattern]) => {
        return {
          ...obj,
          [ruleName]: this.compileRule(pattern),
        };
      }, {});
  }

  public [Symbol.iterator]() {
    return { next: this.next.bind(this) };
  }

  public save(): LexerSave {
    return {
      line: this.line,
      col: this.col,
    };
  }

  public reset(buffer: string, save?: LexerSave): Lexer {
    this.buffer = buffer;

    this.line = save ? save.line : 1;
    this.col = save ? save.col : 1;
    this.regexp.lastIndex = 0;
    this.done = false;

    return this;
  }

  public toArray(): Token[] {
    const save = this.save();
    const { lastIndex } = this.regexp;

    this.reset(this.buffer);

    const array = [...this];

    this.reset(this.buffer, save);
    this.regexp.lastIndex = lastIndex;

    return array;
  }

  private readNextToken(): Token | undefined {
    let token: Token | undefined;

    do {
      const { lastIndex: resultIndex } = this.regexp;
      const result = this.regexp.exec(this.buffer);

      if (!result && resultIndex < this.buffer.length) {
        throw new Error(
          `Unexpected token at line ${this.line} col ${this.col}: ${
            this.getUnexpectedToken(resultIndex)
          }`,
        );
      }

      if (!result) return;

      const value = result[0];

      const valueRuleName = Object.keys(this.rules).find((key) =>
        this.rules[key].match.test(value)
      );

      if (!valueRuleName) throw new Error();

      const valueTransform = this.rules[valueRuleName].value;
      const lineBreaks = countLineBreaks(value);

      if (!this.rules[valueRuleName].ignore) {
        token = {
          type: valueRuleName,
          text: value,
          value: valueTransform ? valueTransform(value) : value,
          lineBreaks,
          offset: stringByteSize(this.buffer.slice(0, resultIndex)),
          col: this.col,
          line: this.line,
        };
      }

      if (this.rules[valueRuleName].lineBreaks && lineBreaks > 0) {
        this.col = 1;
        this.line += lineBreaks;
      } else {
        this.col += value.length;
      }

      this.done = resultIndex === this.buffer.length;
    } while (this.done || !token);

    return token;
  }

  private getUnexpectedToken(lastIndex: number): string {
    return this.buffer.slice(
      lastIndex,
      lastIndex +
        this.buffer.slice(lastIndex)
          .search(removeFlags(this.regexp)),
    );
  }

  public next(): IteratorResult<Token> {
    const token = this.readNextToken();

    if (!token) {
      return {
        value: null,
        done: true,
      };
    }

    return {
      value: token,
      done: false,
    };
  }
}
