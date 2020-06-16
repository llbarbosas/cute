import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import cute from "../mod.ts";

Deno.test("lexer.transform: expression", () => {
  const lexer = cute.compile({
    number: { match: /\d+/, value: (s) => Number(s) },
    plus: "+",
    times: "*",
  });

  lexer.reset("1+2*3*4+5");

  lexer.transform(
    "number times number",
    ([n1, op, n2]) => n1 * n2,
  );

  lexer.transform(
    "number plus number",
    ([n1, op, n2]) => n1 + n2,
  );

  assertEquals(
    Array.from(lexer)
      .map((token) => token.value),
    [1 + 2 * 3 * 4 + 5],
  );

  /* 
    The solution bellow may look better, but it does not 
    meet the order of precedence operations.

    const lexer = cute.compile({
      number: { match: /\d+/, value: (s) => Number(s) },
      operator: ["+", "*"]
    });

    lexer.reset("1+2*3*4");

    lexer.transform(
      "number operator number",
      ([n1, op, n2]) => {
        if(op === "+") {
          return n1 + n2;
        } 

        if(op === "*") {
          return n1 * n2;
        }
      } ,
    );
  */
});

Deno.test("lexer.transform: EBNF", () => {
  const transformMatchLexer = cute.compile({
    multiply: {
      match: /\d+\*/,
      value: (s) => Number(s.replace("*", "")),
    },
    type: /[a-zA-Z]+/,
    ws: { match: / +/, ignore: true },
  });

  transformMatchLexer.reset("3*A B");

  transformMatchLexer.transform(
    "multiply type",
    ([times, type]) => {
      return repeatWithSeparator(type, times);
    },
  );

  //console.log(...transformMatchLexer);

  assertEquals(
    Array.from(transformMatchLexer).map((t) => t.value),
    ["A", "A", "A", "B"],
  );
});

function repeatWithSeparator(
  string: string,
  times: number,
  separator: string = " ",
): string {
  if (times < 0) {
    return "";
  }
  if (times === 1) {
    return string;
  } else {
    return string + separator + repeatWithSeparator(string, times - 1);
  }
}
