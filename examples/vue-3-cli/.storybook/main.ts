import type { StorybookConfig } from '@storybook/vue3-webpack5';

const mainConfig: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  core: {
    disableTelemetry: true,
    channelOptions: { allowFunction: false, maxDepth: 10 },
  },
  framework: '@storybook/vue3-webpack5',
};

module.exports = mainConfig;
