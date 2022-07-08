import 'jest-specific-snapshot';
import path from 'path';
// import { mkdtemp as mkdtempCb } from 'fs';
// import { promisify } from 'util';
// import type { Configuration } from 'webpack';
import { resolvePathInStorybookCache, createFileSystemCache } from '@storybook/core-common';
import { executor as previewExecutor } from '@storybook/builder-webpack5';
import { executor as managerExecutor } from '@storybook/builder-manager';

import { sync as readUpSync } from 'read-pkg-up';
// import { buildDevStandalone } from './build-dev';
import { buildStaticStandalone } from './build-static';

// import { outputStats } from './utils/output-stats';

// const { SNAPSHOT_OS } = global;
// const mkdtemp = promisify(mkdtempCb);
const { packageJson } = readUpSync({ cwd: __dirname }) || {};

// this only applies to this file
jest.setTimeout(10000);

// FIXME: this doesn't work
const skipStoriesJsonPreset = [{ features: { buildStoriesJson: false, storyStoreV7: false } }];

jest.mock('@storybook/builder-webpack5', () => {
  const value = jest.fn(() => false);
  const { ...actualBuilder } = jest.requireActual('@storybook/builder-webpack5');
  // MUTATION! we couldn't mock webpack5, so we added a level of indirection instead
  actualBuilder.executor.get = () => ({ webpack: value });
  actualBuilder.overridePresets = [...actualBuilder.overridePresets, skipStoriesJsonPreset];
  return actualBuilder;
});

jest.mock('@storybook/builder-manager', () => {
  const value = jest.fn();
  const { ...actualBuilder } = jest.requireActual('@storybook/builder-manager');
  // MUTATION!
  actualBuilder.executor.get = () => value;
  return actualBuilder;
});

jest.mock('@storybook/telemetry', () => ({
  getStorybookMetadata: jest.fn(() => ({})),
  telemetry: jest.fn(() => ({})),
}));
jest.mock('fs-extra', () => ({
  copy: jest.fn(() => undefined),
  writeFile: jest.fn(() => undefined),
  readFile: jest.fn((f) => ''),
  emptyDir: jest.fn(() => undefined),
  ensureDir: jest.fn(() => undefined),
  writeJSON: jest.fn(() => undefined),
  readJSON: jest.fn(() => ({})),
  pathExists: jest.fn(() => true),
}));

jest.mock('./utils/StoryIndexGenerator', () => {
  const { StoryIndexGenerator } = jest.requireActual('./utils/StoryIndexGenerator');
  return {
    StoryIndexGenerator: class extends StoryIndexGenerator {
      initialize() {
        return Promise.resolve(undefined);
      }

      getIndex() {
        return { stories: {}, v: 3 };
      }
    },
  };
});

jest.mock('./utils/stories-json', () => ({
  extractStoriesJson: () => Promise.resolve(),
  useStoriesJson: () => {},
}));

// we're not in the right directory for auto-title to work, so just
// stub it out
jest.mock('@storybook/store', () => {
  const actualStore = jest.requireActual('@storybook/store');
  return {
    ...actualStore,
    autoTitle: () => 'auto-title',
    autoTitleFromSpecifier: () => 'auto-title-from-specifier',
  };
});

jest.mock('http', () => ({
  ...jest.requireActual('http'),
  createServer: () => ({ listen: (_options, cb) => cb(), on: jest.fn() }),
}));
jest.mock('ws');
jest.mock('@storybook/node-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    line: jest.fn(),
    trace: jest.fn(),
  },
}));
jest.mock('./utils/output-startup-information', () => ({
  outputStartupInformation: jest.fn(),
}));

jest.mock('./utils/output-stats');

const getBaseOptions = () => ({
  docsMode: false,
  cache: createFileSystemCache({
    basePath: resolvePathInStorybookCache('dev-server'),
    ns: 'storybook-test', // Optional. A grouping namespace for items.
  }),
  ci: true,
});

const ROOT = process.cwd();
const NODE_MODULES = /.*node_modules/g;
const cleanRoots = (obj): any => {
  if (!obj) return obj;
  if (typeof obj === 'string')
    return obj.replace(ROOT, 'ROOT').replace(NODE_MODULES, 'NODE_MODULES');
  if (Array.isArray(obj)) return obj.map(cleanRoots);
  if (obj instanceof RegExp) return cleanRoots(obj.toString());
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => {
        if (key === 'version' && typeof val === 'string') {
          return [key, '*'];
        }
        return [key, cleanRoots(val)];
      })
    );
  }
  return obj;
};

// const getConfig = (fn: any, name): Configuration | null => {
//   const call = fn.mock.calls.find((c) => c[0].name === name);
//   if (!call) {
//     return null;
//   }
//   return call[0];
// };

// const prepareSnap = (get: any, name): Pick<Configuration, 'module' | 'entry' | 'plugins'> => {
//   const config = getConfig(get(), name);
//   if (!config) {
//     return null;
//   }

//   const keys = Object.keys(config);
//   const { module, entry, plugins } = config;

//   return cleanRoots({ keys, module, entry, plugins: plugins.map((p) => p.constructor.name) });
// };

const snap = (name: string) => `__snapshots__/${name}`;

describe('cra-ts-essentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should eventually call the builders with correct config', async () => {
    if (packageJson === undefined) {
      throw new Error('packageJson is undefined');
    }

    const outputDir = path.resolve('./storybook-static');
    const options = {
      ...getBaseOptions(),
      configDir: path.resolve(`${__dirname}/../../../examples/cra-ts-essentials/.storybook`),
      outputDir,
      ignorePreview: false,
      packageJson,
    };

    await expect(buildStaticStandalone(options)).resolves.toBeUndefined();

    const managerBuilder = managerExecutor.get();
    expect(managerBuilder).toHaveBeenCalledTimes(1);

    // @ts-ignore
    const managerConfig = managerBuilder.mock.calls[0][0];
    expect(managerConfig).toMatchObject({
      entryPoints: [
        expect.stringContaining('addons/docs/manager'),
        expect.stringContaining('addons/controls/manager'),
        expect.stringContaining('addons/actions/manager'),
        expect.stringContaining('addons/backgrounds/manager'),
        expect.stringContaining('addons/toolbars/manager'),
        expect.stringContaining('addons/measure/manager'),
        expect.stringContaining('addons/outline/manager'),
      ],
      format: 'esm',
      bundle: true,
      outdir: expect.stringContaining(outputDir),
      define: expect.objectContaining({
        global: 'window',
        module: '{}',
        'process.env': '{}',
        'process.env.NODE_ENV': "'production'",
      }),
    });

    // @ts-ignore
    const previewBuilder = previewExecutor.get().webpack;
    expect(previewBuilder).toHaveBeenCalledTimes(1);

    const previewConfig = previewBuilder.mock.calls[0][0];
    expect(previewConfig).toMatchObject({
      name: 'preview',
      mode: 'production',
      entry: [
        expect.stringContaining('core-client/dist/esm/globals/globals'),
        expect.stringContaining('storybook-config-entry'),
      ],
      bail: true,
      output: expect.objectContaining({
        path: expect.stringContaining(outputDir),
      }),
      resolve: expect.objectContaining({
        extensions: expect.arrayContaining(['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']),
        alias: {
          global: expect.stringContaining('node_modules/global'),
          '@storybook/addons': expect.stringContaining('lib/addons'),
          '@storybook/api': expect.stringContaining('lib/api'),
          '@storybook/store': expect.stringContaining('lib/store'),
          '@storybook/channels': expect.stringContaining('lib/channels'),
          '@storybook/channel-postmessage': expect.stringContaining('lib/channel-postmessage'),
          '@storybook/channel-websocket': expect.stringContaining('lib/channel-websocket'),
          '@storybook/components': expect.stringContaining('lib/components'),
          '@storybook/core-events': expect.stringContaining('lib/core-events'),
          '@storybook/router': expect.stringContaining('lib/router'),
          '@storybook/theming': expect.stringContaining('lib/theming'),
          '@storybook/semver': expect.stringContaining('node_modules/@storybook/semver'),
          '@storybook/preview-web': expect.stringContaining('lib/preview-web'),
          '@storybook/client-api': expect.stringContaining('lib/client-api'),
          '@storybook/client-logger': expect.stringContaining('lib/client-logger'),
          '@storybook/react': expect.stringContaining('renderers/react'),
          react: expect.stringContaining('node_modules/react'),
          'react-dom': expect.stringContaining('node_modules/react-dom'),
        },
        fallback: {
          path: expect.stringContaining('path-browserify/index'),
          assert: expect.stringContaining('browser-assert/lib/assert'),
          util: expect.stringContaining('util'),
        },
      }),
      optimization: expect.objectContaining({
        moduleIds: 'named',
      }),
    });

    expect(cleanRoots(previewConfig.module.rules)).toMatchSpecificSnapshot(
      snap('cra-ts-essentials_build')
    );

    expect(findPlugin(previewConfig, 'ProgressPlugin')).toMatchObject({});
    expect(findPlugin(previewConfig, 'HtmlWebpackPlugin')).toMatchObject({
      userOptions: {
        filename: 'iframe.html',
        templateParameters: {
          bodyHtmlSnippet: expect.stringContaining('<div class="sb-previewBlock">'),
          headHtmlSnippet: expect.stringContaining('<base target="_parent" />'),
          globals: expect.objectContaining({
            CHANNEL_OPTIONS: {
              allowFunction: false,
              maxDepth: 10,
            },
            CONFIG_TYPE: 'PRODUCTION',
            FEATURES: expect.objectContaining({
              argTypeTargetsV7: true,
              babelModeV7: true,
              breakingChangesV7: true,
              buildStoriesJson: true,
              interactionsDebugger: false,
              postcss: true,
              previewMdx2: false,
              storyStoreV7: true,
              warnOnLegacyHierarchySeparator: true,
            }),
            FRAMEWORK_OPTIONS: {},
            LOGLEVEL: 'debug',
            PREVIEW_URL: undefined,
            SERVER_CHANNEL_URL: undefined,
            STORIES: [
              {
                directory: './examples/cra-ts-essentials/src',
                files: '**/*.stories.@(ts|tsx|js|jsx|mdx)',
                importPathMatcher:
                  '^\\.[\\\\/](?:examples\\/cra-ts-essentials\\/src(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)\\/|\\/|$)(?!\\.)(?=.)[^/]*?\\.stories\\.(ts|tsx|js|jsx|mdx))$',
                titlePrefix: '',
              },
            ],
          }),
        },
      },
    });
    expect(findPlugin(previewConfig, 'DefinePlugin')).toMatchObject({
      definitions: expect.objectContaining({
        'process.env.XSTORYBOOK_EXAMPLE_APP': '""',
        'process.env.NODE_ENV': '"test"',
        'process.env.NODE_PATH': '[]',
        'process.env.STORYBOOK': '"true"',
        'process.env.PUBLIC_URL': '"."',
        NODE_ENV: '"test"',
      }),
    });
    expect(findPlugin(previewConfig, 'ProvidePlugin')).toMatchObject({
      definitions: {
        process: expect.stringContaining('process/browser'),
      },
    });
  });
});

const findPlugin = (config, pluginName) =>
  config.plugins.find((p) => p.constructor.name === pluginName);
