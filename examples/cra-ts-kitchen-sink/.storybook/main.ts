import type { StorybookConfig } from '@storybook/react-webpack5';

const path = require('path');

const mainConfig: StorybookConfig = {
  stories: ['../src/components', '../src/stories'],
  logLevel: 'debug',
  addons: [
    '@storybook/preset-create-react-app',
    '@storybook/addon-docs',
    '@storybook/addon-actions',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-highlight',
    './localAddon/manager.tsx',
    './localAddon/preset.ts',
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
