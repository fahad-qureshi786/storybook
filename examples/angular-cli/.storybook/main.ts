const mainConfig: import('@storybook/angular').StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  logLevel: 'debug',
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-storysource',
    '@storybook/addon-actions',
    '@storybook/addon-viewport',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-jest',
    '@storybook/addon-backgrounds',
    '@storybook/addon-a11y',
    '@storybook/addon-toolbars',
    '@storybook/addon-highlight',
  ],
  core: {
    channelOptions: { allowFunction: false, maxDepth: 10 },
    disableTelemetry: true,
  },
  // These are just here to test composition. They could be added to any storybook example project
  refs: {
    react: {
      title: 'ReactTS',
      url: 'http://localhost:9011',
    },
    first: {
      title: 'Composition test one',
      url: 'https://storybookjs.netlify.app/cra-ts-essentials',
    },
    second: {
      title: 'Composition test two',
      url: 'https://storybookjs.netlify.app/cra-ts-essentials',
    },
    third: {
      title: 'Composition test three',
      url: 'https://storybookjs.netlify.app/cra-ts-essentials',
    },
  },
  staticDirs: ['../src/assets'],
  features: {
    buildStoriesJson: false,
    breakingChangesV7: false,
    storyStoreV7: false,
  },
  framework: {
    name: '@storybook/angular',
    options: {
      enableIvy: true,
    },
  },
};
module.exports = mainConfig;
