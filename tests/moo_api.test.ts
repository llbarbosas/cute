import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import cute from "../mod.ts";

/* 
 *  These tests aim to ensure compatibility with moo API
 */

// https://github.com/no-context/moo#usage
Deno.test(`moo's "Usage"`, () => {
  const lexer = cute.compile({
    WS: /[ \t]+/,
    comment: /\/\/.*?$/,
    number: /0|[1-9][0-9]*/,
    string: /"(?:\\["\\]|[^\n"\\])*"/,
    lparen: "(",
    rparen: ")",
    keyword: ["while", "if", "else", "moo", "cows"],
    NL: { match: /\n/, lineBreaks: true },
  });

  lexer.reset("while (10) cows\nmoo");

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "keyword",
        value: "while",
        text: "while",
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "WS",
        value: " ",
        text: " ",
        offset: 5,
        lineBreaks: 0,
        line: 1,
        col: 6,
      },
      done: false,
    },
  );

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "lparen",
        value: "(",
        text: "(",
        offset: 6,
        lineBreaks: 0,
        line: 1,
        col: 7,
      },
      done: false,
    },
  );

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "number",
        value: "10",
        text: "10",
        offset: 7,
        lineBreaks: 0,
        line: 1,
        col: 8,
      },
      done: false,
    },
  );
});

// https://github.com/no-context/moo#on-regular-expressions
Deno.test(`moo's "On Regular Expressions - Greedy quantifiers"`, () => {
  const greedyLexer = cute.compile({
    string: /".*"/,
  });

  greedyLexer.reset('"foo" "bar"');

  assertEquals(
    greedyLexer.next(),
    {
      value: {
        type: "string",
        value: '"foo" "bar"',
        text: '"foo" "bar"',
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );

  const nonGreedyLexer = cute.compile({
    string: /".*?"/,
    space: / +/,
  });

  nonGreedyLexer.reset('"foo" "bar"');

  assertEquals(
    nonGreedyLexer.next(),
    {
      value: {
        type: "string",
        value: '"foo"',
        text: '"foo"',
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );

  assertEquals(
    nonGreedyLexer.next(),
    {
      value: {
        type: "space",
        value: " ",
        text: " ",
        offset: 5,
        lineBreaks: 0,
        line: 1,
        col: 6,
      },
      done: false,
    },
  );

  assertEquals(
    nonGreedyLexer.next(),
    {
      value: {
        type: "string",
        value: '"bar"',
        text: '"bar"',
        offset: 6,
        lineBreaks: 0,
        line: 1,
        col: 7,
      },
      done: false,
    },
  );
});

// https://github.com/no-context/moo#on-regular-expressions
Deno.test(`moo's "On Regular Expressions - The order of your rules matters"`, () => {
  assertEquals(
    cute.compile({
      identifier: /[a-z0-9]+/,
      number: /[0-9]+/,
    }).reset("42").next(),
    {
      value: {
        type: "identifier",
        value: "42",
        text: "42",
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );

  assertEquals(
    cute.compile({
      number: /[0-9]+/,
      identifier: /[a-z0-9]+/,
    }).reset("42").next(),
    {
      value: {
        type: "number",
        value: "42",
        text: "42",
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );
});

// https://github.com/no-context/moo#line-numbers
Deno.test(`moo's "Line numbers"`, () => {
  const lexer = cute.compile({
    newline: { match: "\n", lineBreaks: true },
  }).reset("\n\n\n");

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "newline",
        value: "\n",
        text: "\n",
        offset: 0,
        lineBreaks: 1,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "newline",
        value: "\n",
        text: "\n",
        offset: 1,
        lineBreaks: 1,
        line: 2,
        col: 1,
      },
      done: false,
    },
  );
});

// https://github.com/no-context/moo#value-vs-text
Deno.test(`moo's "Value vs Text"`, () => {
  const lexer = cute.compile({
    ws: /[ \t]+/,
    string: {
      match: /"(?:\\["\\]|[^\n"\\])*"/,
      value: (s) => s.slice(1, -1).toString(),
    },
  });

  lexer.reset('"test"');

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "string",
        value: "test",
        text: '"test"',
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );
});

// https://github.com/no-context/moo#reset
Deno.test(`moo's "Reset"`, () => {
  const lexer = cute.compile({
    ws: /[ \t]+/,
    text: /\w+/,
    newline: { match: "\n", lineBreaks: true },
  });

  lexer.reset("some line\n");

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "text",
        value: "some",
        text: "some",
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );

  lexer.reset("a different line\n");

  assertEquals(
    lexer.next(),
    {
      value: {
        type: "text",
        value: "a",
        text: "a",
        offset: 0,
        lineBreaks: 0,
        line: 1,
        col: 1,
      },
      done: false,
    },
  );
});

// https://github.com/no-context/moo#states
Deno.test(`moo's "States"`, () => {
  const lexer = cute.states({
    main: {
      strstart: { match: "`", push: "lit" },
      ident: /\w+/,
      lbrace: { match: "{", push: "main" },
      rbrace: { match: "}", pop: 1 },
      colon: ":",
      space: { match: /\s+/, lineBreaks: true },
    },
    lit: {
      interp: { match: "${", push: "main" },
      escape: /\\./,
      strend: { match: "`", pop: 1 },
      const: { match: /(?:[^$`]|\$(?!\{))+/, lineBreaks: true },
    },
  });

  lexer.reset("`a${{c: d}}e`");

  const types = Array.from(lexer).map((token) => token.type);

  assertEquals(
    types,
    [
      "strstart",
      "const",
      "interp",
      "lbrace",
      "ident",
      "colon",
      "space",
      "ident",
      "rbrace",
      "rbrace",
      "const",
      "strend",
    ],
  );
});
