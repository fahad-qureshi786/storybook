import ReactDocgenTypescriptPlugin from '@storybook/react-docgen-typescript-plugin';
import { hasDocsOrControls } from '@storybook/docs-tools';

import type { StorybookConfig } from './types';

export const babel: StorybookConfig['babel'] = async (config, options) => {
  if (!hasDocsOrControls(options)) return config;

  const typescriptOptions = await options.presets.apply<StorybookConfig['typescript']>(
    'typescript',
    {} as any
  );

  const { reactDocgen } = typescriptOptions || {};

  if (typeof reactDocgen !== 'string') {
    return config;
  }

  return {
    ...config,
    overrides: [
      ...(config?.overrides || []),
      {
        test: reactDocgen === 'react-docgen' ? /\.(cjs|mjs|tsx?|jsx?)$/ : /\.(cjs|mjs|jsx?)$/,
        plugins: [
          [
            require.resolve('babel-plugin-react-docgen'),
            {
              DOC_GEN_COLLECTION_NAME: 'STORYBOOK_REACT_CLASSES',
            },
          ],
        ],
      },
    ],
  };
};

export const webpackFinal: StorybookConfig['webpackFinal'] = async (config, options) => {
  if (!hasDocsOrControls(options)) return config;

  const typescriptOptions = await options.presets.apply<StorybookConfig['typescript']>(
    'typescript',
    {} as any
  );

  const { reactDocgen, reactDocgenTypescriptOptions } = typescriptOptions || {};

  if (reactDocgen !== 'react-docgen-typescript') {
    return config;
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      new ReactDocgenTypescriptPlugin({
        ...reactDocgenTypescriptOptions,
        // We *need* this set so that RDT returns default values in the same format as react-docgen
        savePropValueAsString: true,
      }),
    ],
  };
};
