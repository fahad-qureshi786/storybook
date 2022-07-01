import type { StorybookConfig } from '@storybook/vue-webpack5';

const mainConfig: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  logLevel: 'debug',
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-storysource',
    '@storybook/preset-scss',
  ],
  core: {
    channelOptions: { allowFunction: false, maxDepth: 10 },
    disableTelemetry: true,
  },
  features: {
    storyStoreV7: true,
    buildStoriesJson: true,
    breakingChangesV7: true,
  },
  framework: '@storybook/vue-webpack5',
};

module.exports = mainConfig;
