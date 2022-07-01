/// <reference types="node" />
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: [
    {
      directory: './stories/title',
      titlePrefix: 'Custom Prefix',
    },
    // FIXME: Breaks e2e tests './intro.stories.mdx',
    '../../lib/ui/src/**/*.stories.@(ts|tsx|js|jsx|mdx)',
    '../../lib/components/src/**/*.stories.@(ts|tsx|js|jsx|mdx)',
    './stories/**/*.stories.@(ts|tsx|js|jsx|mdx)',
    './../../addons/docs/**/*.stories.@(ts|tsx|js|jsx|mdx)',
    './../../addons/interactions/**/*.stories.@(ts|tsx|js|jsx|mdx)',
  ],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        transcludeMarkdown: true,
        // needed if you use addon-docs in conjunction
        // with addon-storysource
        sourceLoaderOptions: null,
      },
    },
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-storysource',
    '@storybook/addon-links',
    '@storybook/addon-jest',
    '@storybook/addon-a11y',
  ],
  core: {
    channelOptions: { allowFunction: false, maxDepth: 10 },
    disableTelemetry: true,
  },
  logLevel: 'debug',
  features: {
    interactionsDebugger: true,
    breakingChangesV7: false,
    storyStoreV7: false,
  },
  staticDirs: [
    './statics/public',
    {
      from: './statics/examples/example1',
      to: '/example1',
    },
    {
      from: './statics/examples/example2',
      to: '/example2',
    },
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      fastRefresh: true,
      strictMode: true,
    },
  },
};
module.exports = config;
