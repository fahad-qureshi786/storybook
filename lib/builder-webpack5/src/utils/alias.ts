import { dirname, join } from 'path';

export const getAliasPaths = (): Record<string, string> =>
  [
    'global',
    '@storybook/addons',
    '@storybook/api',
    '@storybook/store',
    '@storybook/channels',
    '@storybook/channel-postmessage',
    '@storybook/channel-websocket',
    '@storybook/components',
    '@storybook/core-events',
    '@storybook/router',
    '@storybook/theming',
    '@storybook/semver',
    '@storybook/preview-web',
    '@storybook/client-api',
    '@storybook/client-logger',
  ].reduce(
    (acc, key) => ({
      ...acc,
      [key]: dirname(require.resolve(join(key, `package.json`))),
    }),
    {}
  );
