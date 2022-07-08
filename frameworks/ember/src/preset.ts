/* eslint-disable no-param-reassign */
import { dirname, join } from 'path';
import type { PresetProperty } from '@storybook/core-common';
import type { StorybookConfig } from './types';

export const addons: PresetProperty<'addons', StorybookConfig> = [
  require.resolve('./server/framework-preset-babel-ember'),
  require.resolve('./server/framework-preset-ember-docs'),
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

export const webpack: StorybookConfig['webpack'] = async (config) => {
  config.resolve = config.resolve || {};

  config.resolve.alias = {
    ...config.resolve?.alias,

    '@storybook/ember': dirname(require.resolve(join('@storybook/ember', 'package.json'))),

    react: dirname(require.resolve(join('react', 'package.json'))),
    'react-dom': dirname(require.resolve(join('react-dom', 'package.json'))),
  };
  return config;
};
