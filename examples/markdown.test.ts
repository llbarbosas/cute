import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

import cute from "../mod.ts";

Deno.test("markdown transform: Headers", () => {
  const markdown = `
# H1
## H2
### H3
#### H4
##### H5
###### H6

Alternatively, for H1 and H2, an underline-ish style:

Alt-H1
======

Alt-H2
------`;

  const lexer = cute.compile({
    minus: "-",
    equals: "=",
    hash: "#",
    html: /<\s*\w+[^>]*>.*?<\s*\/\s*\w+>/,
    newline: "\n",
    ws: / +/,
    text: /[\d\w?!,:\- ]+/,
  });

  lexer.reset(markdown);

  // console.log(Array.from(lexer).map((t) => ({ value: t.value, type: t.type })));

  lexer.transform(
    "hash ws text newline",
    ([, , text]) => `<h1>${text}</h1>`,
  );

  lexer.transform(
    "hash hash ws text newline",
    ([, , text]) => `<h1>${text}</h1>`,
  );

  lexer.transform(
    "hash ws text newline",
    ([, , text]) => `<h1>${text}</h1>`,
  );

  lexer.transform(
    "asterisk text asterisk",
    ([, text]: string[]) => `<i>${text}</i>`,
  );
  // console.log(...lexer);
  // assertEquals();
});
