import type { StorybookConfig } from '@storybook/react-webpack5';

const path = require('path');

const mainConfig: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  addons: [
    '@storybook/preset-create-react-app',
    {
      name: '@storybook/addon-essentials',
      options: {
        viewport: false,
      },
    },
  ],
  logLevel: 'debug',
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
    channelOptions: { allowFunction: false, maxDepth: 10 },
    disableTelemetry: true,
  },
  staticDirs: ['../public'],
  features: {
    buildStoriesJson: true,
    breakingChangesV7: true,
  },
  framework: '@storybook/react-webpack5',
};

module.exports = mainConfig;
