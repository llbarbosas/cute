import cute from "../mod.ts";

const lexer = cute.compile({
  text: /(a+)[a-z]+/,
  threeNumber: {
    match: /(\d)(\d)(\d)/,
    value: (groups: string[]) =>
      Number(groups[1]) + Number(groups[2]) + Number(groups[3]),
  },
  number: /\d/,
  newline: { match: /\n/, value: () => "i'm new line" },
  lparen: { match: "(", ignore: true },
  rparen: { match: ")", ignore: true },
});

const results = lexer("(abcd\n234\n\nabcd)");

try {
  for (const value of results) console.log(value);
} catch (error) {
  console.log(error);
}

/*
const lexerMd = cute.compile({
  header: /\n(#+)(.*)/,
  links: /\[([^\[]+)\]\(([^\)]+)\)/,
  bold: /(\*\*|__)(.*?)\1/,
  emphasis: /(\*|_)(.*?)\1/,
  del: /\~\~(.*?)\~\~/,
  quote: /\:\"(.*?)\"\:/,
  inlineCode: /`(.*?)`/,
  ul: /\n\*(.*)/,
  ol: /\n[0-9]+\.(.*)/,
  blockquote: /\n(&gt;|\>)(.*)/,
  horizontal: /\n-{5,}/,
  paragraph: /\n([^\n]+)\n/,
  newLine: /\n/,
});

const results3 = lexerMd(`
# Title

And *now* [a link](http://www.google.com) to **follow** and [another](http://yahoo.com/).

* One
* Two
* Three

## Subhead

One **two** three **four** five.

One __two__ three _four_ five __six__ seven _eight_.

1. One
2. Two
3. Three

More text with \`inline($code)\` sample.

> A block quote
> across two lines.

More text...
`);

for (const value of results3) console.log(value);
*/
