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
Cute is a fast tokenizer/lexer for JavaScript. This aims to help you recognize and classify patterns in texts, and also provides tools to parse the results.

This is heavily inspired by moo, and besides having a compatible API, this also applies the ES6 sticky flag on a single compiled RegExp for optimized performance.

## Usage
Using cute.compile, you can create your lexer. 

```ts
import cute from 'https://deno.land/x/cute/mod.ts'

const lexer = cute.compile({
  plus: "+",
  times: "*",
  number: {
    match: /\d+/, 
    value: (s) => Number(s)
  },
  whitespace: { match: / +/, ignore: true }
});
```

To feed him, use `lexer.reset("text to tokenize")`.

```ts
lexer.reset("1+2*3*4+5");
``` 

Lexers are also iterators, so you can get your tokens in different ways:

```ts
const nextToken = lexer.next();

// or 
for(const token of lexer){
  console.log(token);
}

// or 
Array.from(lexer).map(token => token.type);
``` 

To help you parsing the results, you can add some rules to transform your text.

```ts
// 1+2*3*4+5 -> 1+24+5
lexer.transform(
  "number times number",
  ([n1, op, n2]) => n1 * n2,
);

// 1+24+5 -> 30
lexer.transform(
  "number plus number",
  ([n1, op, n2]) => n1 + n2,
);

const values = Array.from(lexer).map((token) => token.value);

console.log(values[0]); // 30
``` 

You can use a lexer with different rules sets (or states) in more complex scenarios. Cute calls this `StatefulLexer`
```ts
// JS-style string interpolation
const lexer = cute.states({
  main: {
    strstart: { match: '`', push: 'lit' },
    ident:    /\w+/,
    lbrace:   { match: '{', push: 'main' },
    rbrace:   { match: '}', pop: 1 },
    colon:    ':',
    space:    { match: /\s+/, lineBreaks: true },
  },
  lit: {
    interp:   { match: '${', push: 'main' },
    escape:   /\\./,
    strend:   { match: '`', pop: 1 },
    const:    { match: /(?:[^$`]|\$(?!\{))+/, lineBreaks: true },
  },
});

lexer.reset("`a${{c: d}}e`");

const types = Array.from(lexer).map((token) => token.type); 

console.log(types); // strstart const interp lbrace ident colon space ident rbrace rbrace const strend
```

You can see the full documentation on [doc.deno.land](https://doc.deno.land/https/deno.land/x/cute/mod.ts)

### Tips
#### Don't forget to use non-greedy quantifiers 

```ts
// DON'T
const lexer = cute.compile({
  string: /".*"/,   // greedy quantifier *
  // ...
})

lexer.reset('"foo" "bar"')
lexer.next() // -> { type: 'string', value: '"foo" "bar"' }

// DO

let lexer = cute.compile({
  string: /".*?"/,   // non-greedy quantifier *?
  // ...
})

lexer.reset('"foo" "bar"')
lexer.next() // -> { type: 'string', value: 'foo' }
lexer.next() // -> { type: 'space', value: ' ' }
lexer.next() // -> { type: 'string', value: 'bar' }
```

#### Tracking new lines

```ts
cute.compile({
  newline: { match: '\n', lineBreaks: true }, // default is lineBreaks = false
})
```

#### Value vs. Text
```ts
const lexer = cute.compile({
  ws: /[ \t]+/,
  string: { 
    match: /"(?:\\["\\]|[^\n"\\])*"/, 
    value: s => s.slice(1, -1) // function to transform token.value 
  },
  literals: {
    match: /`(?:\\["\\]|[^\n"\\])*`/ 
  }
})

lexer.reset('"hello"`world`')
lexer.next() // { value: 'hello', text: '"hello"' } 
lexer.next() // { value: '`world`', text: '`world`' }
```

## Testing
You can test it by running `deno test`

## Licence

MIT Licence. See the file [LICENSE](LICENSE) for more details.
