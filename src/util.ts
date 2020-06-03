export const isString = (s: any): s is string => typeof s === "string";

export const isArray = (s: any): s is any[] => Array.isArray(s);

export const isRegExp = (s: any): s is RegExp => s instanceof RegExp;

export const isObject = (s: any): s is Object =>
  typeof s === "object" && !isArray(s) && !isRegExp(s);

export const escapeRegExp = (string: string) =>
  string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const countLineBreaks = (string: string) =>
  string.split("\n").length - 1;

export const stringByteSize = (string: string) => new Blob([string]).size;
