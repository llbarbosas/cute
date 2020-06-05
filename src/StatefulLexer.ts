import {
  LexersObject,
  StatesObject,
  LexerInterface,
  Token,
} from "./types/cute.d.ts";
import Lexer from "./lexer.ts";

export default class StatefulLexer implements LexerInterface {
  private lexers: LexersObject = {};
  private stack: string[] = [];
  private currentState: string = "";

  constructor(states: StatesObject) {
    for (const [stateName, rules] of Object.entries(states)) {
      if (this.stack.length === 0) {
        this.changeState("push", stateName);
      }
      this.lexers[stateName] = new Lexer(rules);
    }
  }

  public getState(): string {
    return this.currentState;
  }

  private nextInteration(): IteratorResult<Token> {
    const currentLexer = this.getCurrentLexer();
    const nextIteration = currentLexer.next();
    const bufferIndex = currentLexer.getBufferIndex();

    for (const lexer of Object.values(this.lexers)) {
      lexer.setBufferIndex(bufferIndex);
    }

    return nextIteration;
  }

  public next(): IteratorResult<Token> {
    const nextIteration = this.nextInteration();
    const lastRule = this.getCurrentLexer().getLastRule();

    if (nextIteration.done || !lastRule) {
      return nextIteration;
    }

    if (lastRule.pop) {
      this.changeState("pop", lastRule.pop);
    }

    if (lastRule.push) {
      this.changeState("push", lastRule.push);
    }

    if (lastRule.next) {
      this.changeState("next", lastRule.next);
    }

    return nextIteration;
  }

  public reset(buffer: string): StatefulLexer {
    for (const lexer of Object.values(this.lexers)) {
      lexer.reset(buffer);
    }

    return this;
  }

  public [Symbol.iterator]() {
    return { next: this.next.bind(this) };
  }

  private changeState(action: "push" | "next" | "pop", value: string | number) {
    if (typeof value === "string") {
      if (action === "pop") throw new Error("pop values must be numbers");

      this.currentState = value;

      if (action === "push") {
        this.stack.push(value);
      }
    } else {
      if (action !== "pop") throw new Error(`${action} must be strings`);

      if (this.stack.length - value < 0) throw new Error();

      this.stack = this.stack.slice(0, this.stack.length - value);
      this.currentState = this.stack[this.stack.length - 1];
    }
  }

  private getCurrentLexer(): Lexer {
    return this.lexers[this.currentState];
  }
}
