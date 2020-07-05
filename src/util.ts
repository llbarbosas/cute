export function countNewLines(str: string) {
  if (!str) return 0;

  return (str.match(/\n/g) || []).length;
}

export const pipe = (...fns: Function[]) => (input: any) =>
  fns.reduce((acc, fn) => fn(acc), input);

export const ignoreRegexpGroups = (str: string) =>
  str.replace(/(?<!\\)\((?!\?\:)/g, "(?:");

export const escapeRegExpString = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
