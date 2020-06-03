import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import cute from "../mod.ts";

Deno.test("cut.compile tokenization", () => {
  const lexer = cute.compile({
    animal: ["fox", "dog"],
    det: "the",
    adp: "over",
    adj: { match: /quick|brown|lazy/, value: (s) => `it's ${s}` },
    verb: /jumps/,
    space: { match: / +/, ignore: true },
    newline: { match: "\n", lineBreaks: true, ignore: true },
  });

  lexer.reset("the quick brown fox\njumps over the lazy dog");

  const expectedTypes = [
    "det",
    "adj",
    "adj",
    "animal",
    "verb",
    "adp",
    "det",
    "adj",
    "animal",
  ];

  const types = lexer.toArray().map((token) => token.type);

  console.log(lexer.toArray());

  assertEquals(types, expectedTypes, "must be the expected types");

  let i = 0;
  for (const token of lexer) {
    assertEquals(
      token.type,
      expectedTypes[i++],
      "must be the expected types when iterating",
    );

    if (token.type === "adj") {
      assertEquals(
        token.value,
        `it's ${token.text}`,
        "must transform text given a value transformation prop",
      );
    }
  }
});
