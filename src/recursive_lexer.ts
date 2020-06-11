import { LexerInterface, Token, RecursiveRulesObject } from "./types/cute.d.ts";

import Lexer from "./lexer.ts";
import { isArray } from "./util.ts";

export default class RecursiveLexer { // implements LexerInterface
  private rules: RecursiveRulesObject = {};
  private currentRule = 0;
  private lexer: Lexer;

  constructor(lexer: Lexer, rules: RecursiveRulesObject) {
    this.lexer = lexer;

    for (const [ruleName, rule] of Object.entries(rules)) {
      this.rules[ruleName] = {
        match: isArray(rule.match) ? rule.match : rule.match.split(" "),
        value: rule.value,
      };
    }
  }

  reset(buffer: string) {
    this.lexer.reset(buffer);
    return this;
  }

  private getCurrentRuleName() {
    return Object.keys(this.rules)[this.currentRule];
  }

  next() {
    if (this.currentRule === Object.keys(this.rules).length) {
      return { value: undefined, done: true };
    }

    const currentRule = this.getCurrentRuleName();

    let buffer: Token[] = [];
    let returnBuffer = "";
    let {
      match: ruleMatches,
      value: valueTransformFunc,
    } = this.rules[currentRule];
    let currentMatchIndex = 0;

    for (const token of this.lexer) {
      if (token.type === ruleMatches[currentMatchIndex]) {
        buffer.push(token);
        currentMatchIndex++;
      } else {
        returnBuffer += buffer.reduce((acc, token) => acc + token.value, "");
        returnBuffer += token.value;

        buffer = [];
        currentMatchIndex = 0;
      }

      if (buffer.length === ruleMatches.length) {
        const bufferValues = buffer.map((token) => token.value);
        const valueReturn = valueTransformFunc(bufferValues);
        const valueToken = this.lexer.lexOne(valueReturn);

        if (!valueToken) {
          throw new Error("RecursiveRule.value must return tokenizable string");
        }

        if (valueToken.type === ruleMatches[0]) {
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

    this.reset(returnBuffer);
    this.currentRule++;

    return { value: returnBuffer, done: false };
  }

  [Symbol.iterator]() {
    return { next: this.next.bind(this) };
  }

  finally() {
    const result = Array.from(this);
    return result[result.length - 1];
  }
}
