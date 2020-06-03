<h1 align="center">
  <img alt="cute logo" title="cute" src=".github/logo.png" width="250px" />
</h1>

<h3 align="center">
Tokenizer/lexer generator for Deno inspirated by <a href="https://github.com/no-context/moo">moo</a>
</h3>

<p align="center">
  <a href="https://github.com/llbarbosas">
    <img alt="Made by Lucas Barbosa" src="https://img.shields.io/badge/made%20by-llbarbosas-000?style=flat-square">
  </a>

  <img alt="License" src="https://img.shields.io/badge/licence-MIT-000?style=flat-square">

  <a href="https://github.com/llbarbosas/cute/stargazers">
    <img alt="Stargazers" src="https://img.shields.io/github/stars/llbarbosas/cute?color=000&style=flat-square">
  </a>
</p>

<p align="center">
  <a href="#rocket-about">About</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#runner-usage">Usage</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#memo-licence">Licence</a>
</p>

## :rocket: About
Just playing with Deno. Use it by your responsability.

## :runner: Usage
```typescript
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

lexer.toArray().map(token => token.type);
```

### :white_check_mark: Testing
You can test it by running `deno test`

## :memo: Licence

MIT Licence. See the file [LICENSE](LICENSE) for more details.
