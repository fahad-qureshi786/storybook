import type { RuleSetRule } from 'webpack';

export const isRegExp = (value: RegExp | unknown): value is RegExp => value instanceof RegExp;

// This handles arrays in Webpack rule tests.
export const testMatch = (rule: RuleSetRule, string: string): boolean => {
  if (!rule.test) return false;
  return Array.isArray(rule.test)
    ? rule.test.some((test) => isRegExp(test) && test.test(string))
    : isRegExp(rule.test) && rule.test.test(string);
};
