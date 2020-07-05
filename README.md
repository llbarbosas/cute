<h1 align="center">
  <img alt="cute logo" title="cute" src=".github/logo.png" width="250px" />
</h1>

<h3 align="center">
Tokenizer/lexer generator for Deno
</h3>

<p align="center">
  <a href="https://doc.deno.land/https/deno.land/x/cute/mod.ts">
    <img alt="deno doc" src="https://img.shields.io/badge/deno-doc-black?style=flat-square">
  </a>

  <a href="https://github.com/llbarbosas">
    <img alt="Made by Lucas Barbosa" src="https://img.shields.io/badge/made%20by-llbarbosas-000?style=flat-square">
  </a>

  <img alt="License" src="https://img.shields.io/badge/licence-MIT-000?style=flat-square">

  <a href="https://github.com/llbarbosas/cute/stargazers">
    <img alt="Stargazers" src="https://img.shields.io/github/stars/llbarbosas/cute?color=000&style=flat-square">
  </a>
</p>

## About

Cute is a fast tokenizer/lexer for TypeScript. This aims to help you recognize and classify patterns in texts, and also provides tools to parse the results.

This is heavily inspired by moo, and also applies the ES6 sticky flag on a single compiled RegExp for optimized performance.

## Usage

Using cute.compile, you can create your lexer.

```ts
import cute from "https://deno.land/x/cute/mod.ts";

const tokenizer = cute.compile({
  plus: "+",
  times: "*",
  number: {
    match: /\d+/,
    value: (s) => Number(s),
  },
  whitespace: { match: / +/, ignore: true },
});
```

Tokenizers are simple functions that return iterators:

```ts
const results = tokenizer("1+2*3*4+5");
```

Like any iterable, you can get your tokens in different ways:

```ts
const nextToken = results.next();

// or
for (const token of results) {
  console.log(token);
}

// or
Array.from(results).map((token) => token.type); // [...results]
```

You can use a tokenizer with different rules sets (or states) in more complex scenarios.

```ts
// JS-style string interpolation
const tokenizer = cute.states({
  main: {
    strstart: { match: "`", push: "lit" },
    ident: /\w+/,
    lbrace: { match: "{", push: "main" },
    rbrace: { match: "}", pop: 1 },
    colon: ":",
    space: { match: /\s+/ },
  },
  lit: {
    interp: { match: "${", push: "main" },
    escape: /\\./,
    strend: { match: "`", pop: 1 },
    const: { match: /(?:[^$`]|\$(?!\{))+/ },
  },
});

const results = tokenizer("`a${{c: d}}e`");

const types = Array.from(results).map((token) => token.type);

console.log(types); // strstart const interp lbrace ident colon space ident rbrace rbrace const strend
```

You can see the full documentation on [doc.deno.land](https://doc.deno.land/https/deno.land/x/cute/mod.ts)

### Tips

#### Don't forget to use non-greedy quantifiers

```ts
// DON'T
const tokenizer = cute.compile({
  string: /".*"/, // greedy quantifier *
  // ...
});

const results = tokenizer('"foo" "bar"');
results.next(); // -> { type: 'string', value: '"foo" "bar"' }

// DO

const tokenizer = cute.compile({
  string: /".*?"/, // non-greedy quantifier *?
  // ...
});

const results = tokenizer('"foo" "bar"');
results.next(); // -> { type: 'string', value: 'foo' }
results.next(); // -> { type: 'space', value: ' ' }
results.next(); // -> { type: 'string', value: 'bar' }
```

#### Value vs. Text

```ts
const tokenizer = cute.compile({
  ws: /[ \t]+/,
  string: {
    match: /"(?:\\["\\]|[^\n"\\])*"/,
    value: (s) => s.slice(1, -1), // function to transform token.value
  },
  literals: {
    match: /`(?:\\["\\]|[^\n"\\])*`/,
  },
});

const results = tokenizer('"hello"`world`');
results.next(); // { value: 'hello', text: '"hello"' }
results.next(); // { value: '`world`', text: '`world`' }
```

## Testing

You can test it by running `deno test`

## Licence

MIT Licence. See the file [LICENSE](LICENSE) for more details.
