import path from 'path';
import type { PresetProperty } from '@storybook/core-common';
import type { StorybookConfig } from './types';

export const addons: PresetProperty<'addons', StorybookConfig> = [
  path.dirname(require.resolve(path.join('@storybook/preset-react-webpack', 'package.json'))),
  path.dirname(require.resolve(path.join('@storybook/react', 'package.json'))),
];

export const core: PresetProperty<'core', StorybookConfig> = async (config, options) => {
  const framework = await options.presets.apply<StorybookConfig['framework']>('framework');

  return {
    ...config,
    builder: {
      name: path.dirname(
        require.resolve(path.join('@storybook/builder-webpack5', 'package.json'))
      ) as '@storybook/builder-webpack5',
      options: typeof framework === 'string' ? {} : framework.options.builder || {},
    },
  };
};

export const webpack: StorybookConfig['webpack'] = async (config) => {
  // eslint-disable-next-line no-param-reassign
  config.resolve = config.resolve || {};

  // eslint-disable-next-line no-param-reassign
  config.resolve.alias = {
    ...config.resolve?.alias,
    '@storybook/react': path.dirname(
      require.resolve(path.join('@storybook/react', 'package.json'))
    ),
  };
  return config;
};
