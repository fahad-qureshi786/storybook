/* eslint-disable no-param-reassign */

import { dirname, join } from 'path';
import type { PresetProperty, Options } from '@storybook/core-common';
import type { FrameworkOptions, StorybookConfig } from './types';

export const addons: PresetProperty<'addons', StorybookConfig> = [
  dirname(require.resolve(join('@storybook/preset-react-webpack', 'package.json'))),
  dirname(require.resolve(join('@storybook/react', 'package.json'))),
  dirname(require.resolve(join('@storybook/builder-webpack5', 'package.json'))),
];

const defaultFrameworkOptions: FrameworkOptions = {
  legacyRootApi: true,
};

export const frameworkOptions = async (
  _: never,
  options: Options
): Promise<StorybookConfig['framework']> => {
  const config = await options.presets.apply<StorybookConfig['framework']>('framework');

  if (typeof config === 'string') {
    return {
      name: config,
      options: defaultFrameworkOptions,
    };
  }
  if (typeof config === 'undefined') {
    return {
      name: require.resolve('@storybook/react-webpack5') as '@storybook/react-webpack5',
      options: defaultFrameworkOptions,
    };
  }

  return {
    name: config.name,
    options: {
      ...defaultFrameworkOptions,
      ...config.options,
    },
  };
};

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
    '@storybook/react': dirname(require.resolve(join('@storybook/react', 'package.json'))),
  };
  return config;
};
