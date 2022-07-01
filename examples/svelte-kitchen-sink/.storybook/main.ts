const path = require('path');
const sveltePreprocess = require('svelte-preprocess');

const mainConfig: import('@storybook/svelte-webpack5').StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx||mdx|svelte)'],
  logLevel: 'debug',
  addons: [
    '@storybook/addon-storysource',
    '@storybook/addon-actions',
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
      },
    },
    '@storybook/addon-controls',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-backgrounds',
    '@storybook/addon-viewport',
    '@storybook/addon-a11y',
    '@storybook/addon-highlight',
  ],
  webpackFinal: async (config) => {
    const rules = config.module?.rules || [];
    rules.push({
      test: [/\.stories\.js$/, /index\.js$/],
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
    breakingChangesV7: true,
  },
  framework: {
    name: '@storybook/svelte-webpack5',
    options: {
      preprocess: sveltePreprocess(),
    },
  },
};

module.exports = mainConfig;
