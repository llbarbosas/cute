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
This is an reimplementation of [moo](https://github.com/no-context/moo) for Deno for study purpose. Like him, this is also a optimised tokenizer that compiles a single RegExp for performance (using ES6 sticky flag).

## Usage

```ts
import cute from 'https://deno.land/x/cute/mod.ts'

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

lexer.next(); // { type: "det", value: "the", text: "the", offset: 0, lineBreaks: 0, line: 1, col: 1 }
lexer.next(); // { type: "adj", value: "it's quick", text: "quick", offset: 3, lineBreaks: 0, line: 1, col: 5 }

// or you can iterate 

for(const token of lexer){
    console.log(token);
}

// or even

Array.from(lexer).map(token => token.type);
```

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
The value is the same as the text, unless you provide a value transform.
```ts
const lexer = cute.compile({
  ws: /[ \t]+/,
  string: {match: /"(?:\\["\\]|[^\n"\\])*"/, value: s => s.slice(1, -1)},
})

lexer.reset('"test"')
lexer.next() /* { value: 'test', text: '"test"' ... } */
```

#### States
Cute can handle states with different rules from each other
```ts
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

lexer.reset("`a${{c: d}}e`"); // JS-style string interpolation
Array.from(lexer).map((token) => token.type); // strstart const interp lbrace ident colon space ident rbrace rbrace const strend
```
## Testing
You can test it by running `deno test`

## Licence

MIT Licence. See the file [LICENSE](LICENSE) for more details.
