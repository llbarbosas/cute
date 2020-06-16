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

type LexerOptions = {
  ignore?: boolean;
};

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
  private options: LexerOptions = {
    ignore: true,
  };

  constructor(rules: LexerRulesObject, options?: LexerOptions) {
    if (options) {
      this.options = options;
    }

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

      if (!resultRule.ignore || !this.options.ignore) {
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
    matchStr: string,
    transformFunction: (values: any[]) => any,
  ) {
    const lexerCopy = new Lexer(this.rules, { ignore: false });
    lexerCopy.reset(this.buffer);

    const matchArray = matchStr.split(" ");
    let tokenArray = Array.from(lexerCopy);

    let matchIndex = 0;
    let matchStart = 0;

    for (let i = 0; i < tokenArray.length; i++) {
      const currentToken = tokenArray[i];

      if (currentToken.type === matchArray[matchIndex]) {
        if (matchIndex === 0) {
          matchStart = i;
        }

        matchIndex++;
      } else {
        matchIndex = 0;
      }

      if (matchIndex === matchArray.length) {
        const matchTokens = tokenArray.slice(matchStart, i + 1);
        const matchTokensValues = matchTokens.map((t) => t.value);
        const transformedTokens = transformFunction(matchTokensValues)
          .toString();

        const tokenizedTransform = Array.from(
          lexerCopy.reset(transformedTokens),
        );

        tokenArray.splice(
          matchStart,
          i - matchStart + 1,
          ...tokenizedTransform,
        );

        i = matchStart - 1;
        matchIndex = 0;
      }
    }

    const returnBuffer = tokenArray.reduce(
      (acc, token) => acc += token.value,
      "",
    );

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
