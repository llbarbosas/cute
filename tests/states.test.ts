import cute from "../mod.ts";

import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("cute.states", () => {
  const lexer = cute.states({
    numbers: {
      one: { match: "1", push: "letters" },
      two: { match: "2", pop: 1 },
      three: "3",
    },
    letters: {
      a: { match: "a", push: "numbers" },
      b: { match: "b", pop: 1 },
      c: "c",
    },
  });

  const results = lexer("1cb31a2b3");

  const expectedStates = [
    "numbers",
    "letters",
    "letters",
    "numbers",
    "numbers",
    "letters",
    "numbers",
    "letters",
    "numbers",
  ];

  const states = Array.from(results).map((token: any) => token.state);

  assertEquals(expectedStates, states);
});
