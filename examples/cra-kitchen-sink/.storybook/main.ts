import type { StorybookConfig } from '@storybook/react-webpack5';

const path = require('path');

const mainConfig: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  logLevel: 'debug',
  addons: [
    '@storybook/preset-create-react-app',
    {
      name: '@storybook/addon-docs/preset',
      options: {
        configureJSX: true,
      },
    },
    '@storybook/addon-actions',
    '@storybook/addon-links',
    '@storybook/addon-backgrounds',
    '@storybook/addon-a11y',
    '@storybook/addon-jest',
    '@storybook/addon-highlight',
  ],
  // add monorepo root as a valid directory to import modules from
  webpackFinal: (config) => {
    const resolvePlugins = config.resolve?.plugins;
    if (Array.isArray(resolvePlugins)) {
      resolvePlugins.forEach((p) => {
        // @ts-ignore
        const appSrcs = p.appSrcs as unknown as string[];
        if (Array.isArray(appSrcs)) {
          appSrcs.push(path.join(__dirname, '..', '..', '..'));
        }
      });
    }
    return config;
  },
  core: {
    disableTelemetry: true,
    channelOptions: { allowFunction: false, maxDepth: 10 },
  },
  staticDirs: ['../public'],
  features: {
    buildStoriesJson: true,
    breakingChangesV7: true,
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: { fastRefresh: true },
  },
};

module.exports = mainConfig;
