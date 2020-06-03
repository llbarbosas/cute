import {
  isObject,
  escapeRegExp,
  isArray,
  isRegExp,
  isString,
  countLineBreaks,
  stringByteSize,
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

type LexerRuleObj = {
  match: string | RegExp;
  value?: (s: string) => string;
  lineBreaks?: boolean;
  ignore?: boolean;
  error?: boolean;
};

type CompiledLexerRuleObj = LexerRuleObj & {
  match: RegExp;
};

export type LexerRules = {
  [name: string]: RegExp | string[] | string | LexerRuleObj;
};

export default class Lexer {
  private buffer = "";
  private _done = false;
  private line = 1;
  private col = 1;

  private rules: {
    [name: string]: CompiledLexerRuleObj;
  };
  private regexp: RegExp;

  constructor(rules: LexerRules) {
    this.rules = this.compileRules(rules);

    const compiledRules = Object.values(this.rules)
      .map((rule: any) => rule.match);

    this.regexp = this.combineRegexp(compiledRules, true);
  }

  private combineRegexp(exps: any[], sticky = false): RegExp {
    const combinedString = exps.reduce(
      (acc: string, p: any) =>
        `${acc && acc + "|"}${p instanceof RegExp ? p.source : p}`,
      "",
    );

    return new RegExp(combinedString, sticky ? "y" : "");
  }

  private compileRules(
    rules: LexerRules,
  ): { [name: string]: CompiledLexerRuleObj } {
    const compiledRules = Object
      .entries(rules)
      .reduce((obj: {}, [ruleName, pattern]) => {
        let compiledPattern;

        if (isString(pattern)) {
          compiledPattern = new RegExp(escapeRegExp(pattern));
        } else if (isRegExp(pattern)) {
          compiledPattern = pattern;
        } else if (isArray(pattern)) {
          compiledPattern = this.combineRegexp(pattern);
        } else if (isObject(pattern)) {
          compiledPattern = isRegExp(pattern.match)
            ? pattern.match
            : new RegExp(escapeRegExp(pattern.match));
        } else {
          throw new Error(`Unexpected pattern type at ${ruleName}`);
        }

        const patternProps = isObject(pattern) ? pattern : {};

        return {
          ...obj,
          [ruleName]: {
            ...patternProps,
            match: compiledPattern,
          },
        };
      }, {});

    return compiledRules;
  }

  public [Symbol.iterator]() {
    return { next: this.next.bind(this) };
  }

  get done(): boolean {
    return this._done;
  }

  public toArray(options?: { preserveIterator?: boolean }): Token[] {
    let array;

    if (!options?.preserveIterator) {
      this.line = 1;
      this.col = 1;

      this.regexp.lastIndex = 0;

      array = [...this];

      this.line = 1;
      this.col = 1;
      this.regexp.lastIndex = 0;
      this._done = false;
    } else {
      array = [...this];
    }

    return array;
  }

  public next(): IteratorResult<Token> {
    if (this.done || this.buffer === "") {
      return { value: null, done: true };
    }

    const { lastIndex } = this.regexp;

    let result, type, match: string, lineBreaks = 0;

    do {
      result = this.regexp.exec(this.buffer);

      if (!result) {
        throw new Error(
          `Unexpected token at line ${this.line} col ${this.col}: ${
            this.buffer.slice(lastIndex, lastIndex + 8)
          } ...`,
        );
      }

      match = result[0];

      type = Object.keys(this.rules).find((key) =>
        this.rules[key].match.test(match)
      );

      if (!type) {
        throw new Error();
      }

      lineBreaks = countLineBreaks(match);

      if (this.rules[type].lineBreaks && lineBreaks > 0) {
        this.col = 1;
        this.line += lineBreaks;
      } else {
        this.col += match.length;
      }
    } while (
      this.rules[type].ignore && this.regexp.lastIndex < this.buffer.length
    );

    const done = this.rules[type].ignore ? true : this.done;
    this._done = this.regexp.lastIndex === this.buffer.length;

    const valueTransform = this.rules[type].value;

    const token = {
      type,
      value: valueTransform ? valueTransform(match) : match,
      text: match,
      offset: stringByteSize(this.buffer.slice(0, lastIndex)),
      lineBreaks,
      line: this.line,
      col: this.col - match.length,
    };

    return {
      value: token,
      done,
    };
  }

  public reset(buffer: string) {
    this.buffer = buffer;
    this.regexp.lastIndex = 0;
  }
}
