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

type LexerRule = {
  match: string | RegExp;
  value?: (s: string) => string;
  lineBreaks?: boolean;
  ignore?: boolean;
  error?: boolean;
};

type CompiledLexerRule = LexerRule & {
  match: RegExp;
};

type LexerSave = {
  line: number;
  col: number;
};

type Pattern = RegExp | string[] | string | LexerRule;

export type LexerRulesObject = {
  [name: string]: Pattern;
};

type CompiledLexerRulesObject = {
  [name: string]: CompiledLexerRule;
};

export default class Lexer {
  private buffer = "";
  private done = false;
  private line = 1;
  private col = 1;

  private rules: CompiledLexerRulesObject;
  private errors: CompiledLexerRulesObject;
  private regexp: RegExp;
  private rulesGroupNames: string[];
  private errorsRegexp: RegExp;
  private errorsGroupNames: string[];

  constructor(rules: LexerRulesObject) {
    [this.rules, this.errors] = this.compileRules(rules);

    this.rulesGroupNames = Object.keys(this.rules);
    this.regexp = combineRegexp(
      getValues(this.rules, "match"),
      { sticky: true, groupAll: true },
    );

    this.errorsGroupNames = Object.keys(this.errors);
    this.errorsRegexp = combineRegexp(
      getValues(this.errors, "match"),
      { groupAll: true },
    );
  }

  private getGroup(match: RegExpExecArray, options = { error: false }) {
    const index = match.slice(1).findIndex((group) => !!group);

    const groupNames = !options.error
      ? this.rulesGroupNames
      : this.errorsGroupNames;

    return groupNames[index];
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
  ): CompiledLexerRulesObject[] {
    return Object
      .entries(rules)
      .reduce((arr: any[], [ruleName, pattern]) => {
        const compiledRule = this.compileRule(pattern);
        const ruleOrErrorIndex = !compiledRule.error ? 0 : 1;

        arr[ruleOrErrorIndex] = {
          ...arr[ruleOrErrorIndex],
          [ruleName]: compiledRule,
        };

        return arr;
      }, [{}, {}]);
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

      let valueRuleName, valueRule, value;

      if (!result && resultIndex < this.buffer.length) {
        const unexpectedToken = this.getUnexpectedToken(resultIndex);
        const errorResult = this.errorsRegexp.exec(
          unexpectedToken,
        );

        if (!errorResult) {
          throw new Error(
            `Unexpected token at line ${this.line} col ${this.col}: ${unexpectedToken}`,
          );
        }

        valueRuleName = this.getGroup(errorResult, { error: true });
        valueRule = this.errors[valueRuleName];
        value = errorResult[0];

        this.regexp.lastIndex = resultIndex + errorResult[0].length;
      } else {
        if (!result) return;

        valueRuleName = this.getGroup(result);
        valueRule = this.rules[valueRuleName];
        value = result[0];
      }

      const valueTransform = valueRule.value;
      const lineBreaks = countLineBreaks(value);

      if (!valueRule.ignore) {
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

      if (valueRule.lineBreaks && lineBreaks > 0) {
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
    const tokenEndIndex = this.buffer.slice(lastIndex)
      .search(removeFlags(this.regexp));

    return this.buffer.slice(
      lastIndex,
      lastIndex + tokenEndIndex,
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
