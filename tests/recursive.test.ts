import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import cute from "../mod.ts";

Deno.test("cute recursive", () => {
  const tokenizer = cute.compile({
    number: /\d+/,
    plus: "+",
    times: "*",
  });

  const recTok = cute.recursive(tokenizer, {
    product: {
      match: "number times number",
      value: ([n1, op, n2]: string[]) => (Number(n1) * Number(n2)).toString(),
    },
    sum: {
      match: "number plus number",
      value: ([n1, op, n2]: string[]) => (Number(n1) + Number(n2)).toString(),
    },
  });

  assertEquals(
    recTok.reset("1+2*3*4").finally(),
    (1 + 2 * 3 * 4).toString(),
  );

  const tokenizer2 = cute.compile({
    asterisk: "*",
    underscore: "_",
    tildes: "~",
    hash: "#",
    html: /<.*?<\/.*?\>/,
    newline: "\n",
    ws: / +/,
    text: /[\w\d ]+/,
  });

  const parser = cute.recursive(tokenizer2, {
    h1: {
      match: "hash ws text newline",
      value: ([, , text]: string[]) => `<h1>${text}</h1>`,
    },
    italic: {
      match: "asterisk text asterisk",
      value: ([, text]: string[]) => `<i>${text}</i>`,
    },
    bold: {
      match: "asterisk asterisk text asterisk asterisk",
      value: ([, , text]: string[]) => `<b>${text}</b>`,
    },
  });

  parser.reset("# This is a header\n**bold** and *italic* text");

  assertEquals(
    parser
      .reset("# This is a header\n**bold** and *italic* text")
      .finally(),
    "<h1>This is a header</h1><b>bold</b> and <i>italic</i> text",
  );
});
