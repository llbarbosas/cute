import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import cute from "../mod.ts";

Deno.test("lexer.transform: expression", () => {
  const lexer = cute.compile({
    number: { match: /\d+/, value: (s) => Number(s) },
    plus: "+",
    times: "*",
  });

  lexer.reset("1+2*3*4");

  // "1+2*3*4" -> "1+24"
  lexer.transform(
    "number times number",
    ([n1, op, n2]) => n1 * n2,
  );

  // "1+24" -> "25"
  lexer.transform(
    "number plus number",
    ([n1, op, n2]) => n1 + n2,
  );

  assertEquals(
    Array.from(lexer)
      .map((token) => token.value),
    [25],
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

Deno.test("lexer.transform: markdown", () => {
  const lexer = cute.compile({
    asterisk: "*",
    underscore: "_",
    minus: "-",
    plus: "+",
    listItem: /\n\d+\./,
    equals: "=",
    tildes: "~",
    hash: "#",
    html: /<\s*\w+[^>]*>.*?<\s*\/\s*\w+>/,
    newline: "\n",
    ws: / +/,
    text: /[\d\w?! ]+/,
  });

  lexer.reset("# Hi everyone\nhow r you guys?# s -+");

  lexer.transform(
    "hash ws text newline",
    ([, , text]) => `<h1>${text}</h1>`,
  );
  lexer.transform(
    "asterisk text asterisk",
    ([, text]: string[]) => `<i>${text}</i>`,
  );
  lexer.transform(
    "asterisk asterisk text asterisk asterisk",
    ([, , text]) => `<b>${text}</b>`,
  );
  lexer.transform(
    "hash ws text newline",
    ([, , text]) => `<h1>${text}</h1>`,
  );

  // console.log(...lexer);
  // assertEquals();
});
