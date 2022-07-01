import type { RuleSetRule } from 'webpack';
import { getProjectRoot } from '@storybook/core-common';

export const customManagerRuntimeLoader = () => {
  return {
    test: /\.(mjs|tsx?|jsx?)$/,
    loader: require.resolve('esbuild-loader'),
    options: {
      loader: 'tsx',
      target: 'chrome100',
    },
    include: [getProjectRoot()],
    exclude: [/node_modules/, /dist/],
  } as RuleSetRule;
};
