/* eslint-disable no-param-reassign */
import { dirname, join } from 'path';
import type { PresetProperty } from '@storybook/core-common';
import { StorybookConfig } from './types';

export const addons: PresetProperty<'addons', StorybookConfig> = [
  require.resolve('./server/framework-preset-angular'),
  require.resolve('./server/framework-preset-angular-cli'),
  require.resolve('./server/framework-preset-angular-ivy'),
  require.resolve('./server/framework-preset-angular-docs'),
];

export const previewAnnotations: StorybookConfig['previewAnnotations'] = (entries = []) => [
  ...entries,
  require.resolve('./client/config'),
];

export const core: PresetProperty<'core', StorybookConfig> = async (config, options) => {
  const framework = await options.presets.apply<StorybookConfig['framework']>('framework');

  return {
    ...config,
    builder: {
      name: dirname(
        require.resolve(join('@storybook/builder-webpack5', 'package.json'))
      ) as '@storybook/builder-webpack5',
      options: typeof framework === 'string' ? {} : framework.options.builder || {},
    },
  };
};

export const typescript: PresetProperty<'typescript', StorybookConfig> = async (config) => {
  return {
    ...config,
    skipBabel: true,
  };
};

export const webpack: StorybookConfig['webpack'] = async (config) => {
  config.resolve = config.resolve || {};

  config.resolve.alias = {
    ...config.resolve?.alias,

    '@storybook/angular': dirname(require.resolve(join('@storybook/angular', 'package.json'))),

    react: dirname(require.resolve(join('react', 'package.json'))),
    'react-dom': dirname(require.resolve(join('react-dom', 'package.json'))),
  };
  return config;
};
