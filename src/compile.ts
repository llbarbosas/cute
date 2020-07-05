import {
  countNewLines,
  pipe,
  ignoreRegexpGroups,
  escapeRegExpString,
} from "./util.ts";

export default function compile(rules: any) {
  const {
    regexp,
    rawRules,
    typeNames,
    valueTransformFns,
    ignore, // TODO: implement token ignore
  } = compileRules(rules);

  return (buffer: string) => {
    let lastToken: any;

    const next = (index?: number) => {
      if (index) regexp.lastIndex = index;

      const token = getNextToken(buffer, regexp);

      const value = !!token
        ? pipe(
            withValueTransform(rawRules, valueTransformFns),
            withTypeName(typeNames),
            withColLine(lastToken)
          )(token)
        : null;

      lastToken = value;

      return { value, done: value === null };
    };

    return {
      next,
      [Symbol.iterator]: () => ({ next }),
    };
  };
}

function highlightUnexpectedToken(
  buffer: string,
  regexp: RegExp,
  lastIndex: number
) {
  const regexpClone = new RegExp(regexp.source, "g");
  regexpClone.lastIndex = lastIndex;

  const result = regexpClone.exec(buffer);
  const errorEnd = result
    ? regexpClone.lastIndex - result[0].length
    : buffer.length;

  const unexpectedToken = buffer
    .substring(lastIndex, errorEnd)
    .replace(/\n/g, "\\n");

  return `Unexpected token "${unexpectedToken}"`;
}

function getNextToken(buffer: string, regexp: RegExp) {
  const { lastIndex: previousIndex } = regexp;
  const result = regexp.exec(buffer);

  if (previousIndex !== buffer.length && result === null) {
    throw new Error(highlightUnexpectedToken(buffer, regexp, previousIndex));
  }

  if (previousIndex === buffer.length || result === null) return null;

  const [text, ...groups] = result;
  const typeIndex = groups.findIndex((v) => v !== undefined);

  return {
    text,
    type: typeIndex,
    start: previousIndex,
    end: regexp.lastIndex,
  };
}

function withTypeName(typeNames: string[]) {
  return (token: any) => {
    return {
      ...token,
      type: typeNames[token.type],
    };
  };
}

function withValueTransform(rawRules: RegExp[], valueTransformFns: any[]) {
  return (token: any) => {
    const result = rawRules[token.type].exec(token.text);

    if (!result) throw new Error();

    const valueTransformFn = valueTransformFns[token.type];

    return {
      ...token,
      value: valueTransformFn ? valueTransformFn(result) : token.text,
    };
  };
}

export function withColLine(lastToken: any) {
  return (token: any) => {
    const line = lastToken ? lastToken.line + countNewLines(lastToken.text) : 1;
    const col = lastToken
      ? lastToken.line !== line
        ? 1
        : lastToken.col + lastToken.text.length
      : 1;

    return { ...token, line, col };
  };
}

function getRuleSource(rule: string | RegExp | any) {
  if (rule instanceof RegExp) return ignoreRegexpGroups(rule.source);
  if (typeof rule === "string") return escapeRegExpString(rule);
  if (rule.match)
    return rule.match instanceof RegExp
      ? ignoreRegexpGroups(rule.match.source)
      : escapeRegExpString(rule.match);

  throw new Error();
}

function compileRules(rules: any) {
  const { regexpSource, ...compiledData } = Object.entries(rules).reduce(
    (acc: any, [ruleName, rule]: [string, any]) => {
      const ruleSource = getRuleSource(rule);
      const rawRule = rule instanceof RegExp ? rule : new RegExp(ruleSource);
      let valueTransformFn,
        ignore = false;

      if (rule.value) valueTransformFn = rule.value;
      if (rule.ignore) ignore = rule.ignore;

      const regexpSource = `${
        acc.regexpSource && acc.regexpSource + "|"
      }(${ruleSource})`;

      return {
        regexpSource,
        typeNames: [...acc.typeNames, ruleName],
        rawRules: [...acc.rawRules, rawRule],
        valueTransformFns: [...acc.valueTransformFns, valueTransformFn],
        ignore: [...acc.ignore, ignore],
      };
    },
    {
      regexpSource: "",
      rawRules: [],
      typeNames: [],
      valueTransformFns: [],
      ignore: [],
    }
  );

  return {
    regexp: new RegExp(regexpSource, "y"),
    ...compiledData,
  };
}
