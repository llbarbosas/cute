import {
  isString,
  isObject,
  isRegExp,
  isArray,
  escapeRegExp,
  combineArraySingleString,
  countLineBreaks,
  stringByteSize,
  removeFlags,
} from "./util.ts";

import {
  Token,
  CompiledLexerRulesObject,
  LexerRulesObject,
  CompiledLexerRule,
  Pattern,
  LexerInterface,
} from "./cute.d.ts";

export default class Lexer implements LexerInterface {
  private rules: CompiledLexerRulesObject;
  private ruleNames: string[];
  private regexp: RegExp;
  private history: { token: Token; rule: CompiledLexerRule }[] = [];
  private buffer = "";
  private nextValues = {
    col: 1,
    line: 1,
    offset: 0,
  };

  constructor(rules: LexerRulesObject) {
    const {
      rules: compiledRules,
      ruleNames,
      regexp,
    } = compileRules(rules);

    this.rules = compiledRules;
    this.ruleNames = ruleNames;
    this.regexp = regexp;
  }

  private getRuleNameByExec(execArray: RegExpExecArray) {
    const index = execArray.slice(1).findIndex((group) => group !== undefined);

    if (index === -1) {
      throw new Error("Unknown rule");
    }

    return this.ruleNames[index];
  }

  private getUnexpectedToken(lastIndex: number): string {
    const nextMatchIndex = this.buffer.slice(lastIndex)
      .search(removeFlags(this.regexp));

    return this.buffer.slice(
      lastIndex,
      lastIndex + nextMatchIndex,
    );
  }

  public reset(buffer: string): Lexer {
    this.buffer = buffer;

    this.nextValues = {
      line: 1,
      col: 1,
      offset: 0,
    };

    this.regexp.lastIndex = 0;

    return this;
  }

  public getLastRule() {
    return this.history[this.history.length - 1]?.rule;
  }

  public setBufferIndex(index: number) {
    this.regexp.lastIndex = index;
  }

  public getBufferIndex() {
    return this.regexp.lastIndex;
  }

  public lexOne(string: string): Token | undefined {
    const regexpClone = new RegExp(this.regexp.source, "y");
    const result = regexpClone.exec(string);

    if (!result) {
      return;
    }

    const resultRuleName = this.getRuleNameByExec(result);
    const resultRule = this.rules[resultRuleName];
    const text = result[0];
    const resultTransformFunction = resultRule.value;
    const lineBreaks = countLineBreaks(text);

    const token: Token = {
      type: resultRuleName,
      value: resultTransformFunction ? resultTransformFunction(text) : text,
      text: text,
      offset: 0,
      lineBreaks,
      col: 1,
      line: 1,
    };

    return token;
  }

  public next(): IteratorResult<Token> {
    let isBufferCompletelyConsumed =
      this.regexp.lastIndex === this.buffer.length;

    while (!isBufferCompletelyConsumed) {
      const { lastIndex: resultIndex } = this.regexp;

      const execResult = this.regexp.exec(this.buffer);

      const { line: lastLine, col: lastCol, offset: lastOffset } =
        this.nextValues;

      if (!execResult) {
        throw new Error(
          `Unexpected value at line ${lastLine} col ${lastCol}: ${
            this.getUnexpectedToken(resultIndex)
          }`,
        );
      }

      const resultRuleName = this.getRuleNameByExec(execResult);
      const resultRule = this.rules[resultRuleName];
      const text = execResult[0];
      const resultTransformFunction = resultRule.value;
      const lineBreaks = countLineBreaks(text);

      const token = {
        type: resultRuleName,
        value: resultTransformFunction ? resultTransformFunction(text) : text,
        text: text,
        offset: lastOffset,
        lineBreaks,
        col: lastCol,
        line: lastLine,
      };

      this.nextValues = {
        line: lastLine + lineBreaks,
        col: lineBreaks > 0 ? 1 : lastCol + text.length,
        offset: lastOffset + stringByteSize(text),
      };

      this.history.push({ token, rule: resultRule });

      if (!resultRule.ignore) {
        return {
          value: token,
          done: false,
        };
      }

      isBufferCompletelyConsumed = this.regexp.lastIndex === this.buffer.length;
    }

    return { done: true, value: undefined };
  }

  public [Symbol.iterator]() {
    return { next: this.next.bind(this) };
  }

  public transform(
    match: string,
    transformFunction: (values: any[]) => any,
  ) {
    const matchArray = match.split(" ");
    let buffer: Token[] = [];
    let returnBuffer = "";
    let currentMatchIndex = 0;

    for (const token of this) {
      if (token.type === matchArray[currentMatchIndex]) {
        buffer.push(token);
        currentMatchIndex++;
      } else {
        returnBuffer += buffer.reduce((acc, token) => acc + token.value, "");
        returnBuffer += token.value;

        buffer = [];
        currentMatchIndex = 0;
      }

      if (buffer.length === matchArray.length) {
        const bufferValues = buffer.map((token) => token.value);
        const valueReturn = transformFunction(bufferValues).toString();
        const valueToken = this.lexOne(valueReturn);

        if (!valueToken) {
          throw new Error("RecursiveRule.value must return tokenizable string");
        }

        if (valueToken.type === matchArray[0]) {
          buffer = [valueToken];
          currentMatchIndex = 1;
        } else {
          returnBuffer += valueToken.value;

          buffer = [];
          currentMatchIndex = 0;
        }
      }
    }

    returnBuffer += buffer.reduce((acc, token) => acc + token.value, "");

    return this.reset(returnBuffer);
  }
}

function compileRules(rules: LexerRulesObject) {
  let compiledRules: CompiledLexerRulesObject = {};
  let ruleNames: string[] = [];
  let combinedRulesReString = "";

  for (const [name, pattern] of Object.entries(rules)) {
    const [patternString, compiledPattern] = compilePattern(pattern);

    compiledRules[name] = compiledPattern;
    ruleNames.push(name);
    combinedRulesReString = `${combinedRulesReString &&
      combinedRulesReString + "|"}(${patternString})`;
  }

  return {
    rules: compiledRules,
    ruleNames,
    regexp: new RegExp(combinedRulesReString, "y"),
  };
}

function compilePattern(pattern: Pattern): [string, CompiledLexerRule] {
  let patternMatchString: string;
  let compiledRule: Object = {};

  if (isString(pattern)) {
    patternMatchString = escapeRegExp(pattern);
  } else if (isRegExp(pattern)) {
    patternMatchString = pattern.source;
  } else if (isArray(pattern)) {
    patternMatchString = combineArraySingleString(pattern);
  } else if (isObject(pattern)) {
    const { match, ...ruleRest } = pattern;
    compiledRule = ruleRest;

    patternMatchString = isRegExp(match) ? match.source : escapeRegExp(match);
  } else {
    throw new Error(`Unexpected pattern type: ${pattern}`);
  }

  return [
    patternMatchString,
    {
      ...compiledRule,
      match: new RegExp(patternMatchString),
    },
  ];
}
