import { getProjectRoot } from '@storybook/core-common';
import { TypescriptOptions } from '../types';

export const createBabelLoader = (options: any, typescriptOptions: TypescriptOptions) => {
  return {
    test: typescriptOptions.skipBabel ? /\.(mjs|jsx?)$/ : /\.(mjs|tsx?|jsx?)$/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options,
      },
    ],
    include: [getProjectRoot()],
    exclude: /node_modules/,
  };
};
