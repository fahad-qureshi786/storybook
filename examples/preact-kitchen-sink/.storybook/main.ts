import type { StorybookConfig } from '@storybook/preact-webpack5';

const path = require('path');

const mainConfig: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  logLevel: 'debug',
  addons: [
    '@storybook/addon-storysource',
    '@storybook/addon-actions',
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-a11y',
    '@storybook/addon-highlight',
  ],
  webpackFinal: (config) => {
    const rules = config.module?.rules || [];
    rules.push({
      test: [/\.stories\.js$/],
      use: [require.resolve('@storybook/source-loader')],
      include: [path.resolve(__dirname, '../src')],
      enforce: 'pre',
    });

    // eslint-disable-next-line no-param-reassign
    config.module = config.module || {};
    // eslint-disable-next-line no-param-reassign
    config.module.rules = rules;
    return config;
  },
  core: {
    channelOptions: { allowFunction: false, maxDepth: 10 },
    disableTelemetry: true,
  },
  staticDirs: ['../public'],
  features: {
    buildStoriesJson: true,
    breakingChangesV7: true,
  },
  framework: '@storybook/preact-webpack5',
};

module.exports = mainConfig;
