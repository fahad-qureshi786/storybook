import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../../../lib/blocks/src/**/*.stories.*'],
  logLevel: 'debug',
  addons: ['@storybook/addon-essentials'],
  core: {
    channelOptions: { allowFunction: false, maxDepth: 10 },
    disableTelemetry: true,
  },
  typescript: {
    check: true,
    checkOptions: {},
  },
  features: {
    postcss: false,
    storyStoreV7: true,
    buildStoriesJson: true,
    babelModeV7: true,
    warnOnLegacyHierarchySeparator: false,
    previewMdx2: true,
    breakingChangesV7: true,
  },
  framework: '@storybook/react-webpack5',
};
module.exports = config;
