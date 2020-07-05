import compile, { withColLine } from "./compile.ts";

export default function states(statesObj: any) {
  const { actions, compiledStates } = compileStates(statesObj);
  const initialState = Object.keys(statesObj)[0];

  return (buffer: string) => {
    let statesHistory = [initialState];
    let lastToken: any;
    let index = 0;
    const currentState = () => statesHistory[statesHistory.length - 1];
    const currentCompiledState = () => (compiledStates as any)[currentState()];
    const currentAction = () => (actions as any)[currentState()];

    const next = () => {
      const iteration = currentCompiledState()(buffer).next(index);
      const state = currentState();

      if (iteration.done) return iteration;

      const token = withColLine(lastToken)(iteration.value);

      const { type, end } = token;

      statesHistory = currentAction()[type](statesHistory);
      if (statesHistory.length === 0) throw new Error();

      index = end;
      lastToken = token;

      iteration.value = { ...token, state };

      return iteration;
    };

    return {
      next,
      [Symbol.iterator]: () => ({ next }),
    };
  };
}

function compileStates(statesObj: any) {
  return Object.entries(statesObj).reduce(
    (acc, [state, rules]: [string, any]) => {
      const actions: any = {};

      Object.entries(rules).forEach(([ruleName, rule]: [string, any]) => {
        const { push, next, pop } = rule;

        if (push) {
          actions[ruleName] = (history: string[]) => [...history, push];
        } else if (next) {
          actions[ruleName] = (history: string[]) => [
            ...history.slice(0, history.length - 1),
            next,
          ];
        } else if (pop) {
          actions[ruleName] = (history: string[]) => [
            ...history.slice(0, history.length - 1),
          ];
        } else {
          actions[ruleName] = (history: string[]) => history;
        }
      });

      return {
        actions: { ...acc.actions, [state]: actions },
        compiledStates: { ...acc.compiledStates, [state]: compile(rules) },
      };
    },
    { actions: {}, compiledStates: {} }
  );
}
