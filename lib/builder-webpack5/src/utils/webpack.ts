import path from 'path';
import { dedent } from 'ts-dedent';
import { DefinePlugin, HotModuleReplacementPlugin, ProgressPlugin, ProvidePlugin } from 'webpack';
import type { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// @ts-ignore // -- this has typings for webpack4 in it, won't work
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import TerserWebpackPlugin from 'terser-webpack-plugin';
import VirtualModulePlugin from 'webpack-virtual-modules';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

import type { Options, CoreConfig, StorybookConfig } from '@storybook/core-common';
import {
  getProjectRoot,
  stringifyProcessEnvs,
  normalizeStories,
  getPreviewFile,
} from '@storybook/core-common';
import type { BuilderOptions, TypescriptOptions } from '../types';
import { getLegacyVirtualEntries, getModernVirtualEntries } from './entries';
import { getAliasPaths } from './alias';

export const createWebpackConfig = async (options: Options): Promise<Configuration> => {
  const {
    outputDir = path.join('.', 'public'),
    quiet,
    packageJson,
    configType,
    presets,
    previewUrl,
    serverChannelUrl,
    configDir,
  } = options;

  const framework = await presets.apply('framework', undefined);
  if (!framework) {
    throw new Error(dedent`
      You must to specify a framework in '.storybook/main.js' config.

      https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#framework-field-mandatory
    `);
  }
  const frameworkName = typeof framework === 'string' ? framework : framework.name;
  const frameworkOptions = presets.apply('frameworkOptions');

  const { channelOptions, builder } = await presets.apply<CoreConfig>('core');

  const isProd = configType === 'PRODUCTION';
  const workingDir = process.cwd();

  const envs = presets.apply<Record<string, string>>('env');
  const logLevel = presets.apply<string>('logLevel');
  const features = options.presets.apply<StorybookConfig['features']>('features');
  const headHtmlSnippet = presets.apply<string>('previewHead');
  const bodyHtmlSnippet = presets.apply<string>('previewBody');
  const template = presets.apply<string>('previewMainTemplate');
  const configs = presets.apply<string[]>('config', []);
  const entriesP = presets.apply<string[]>('entries', []);
  const stories = presets.apply('stories', []);

  const babelOptions = presets.apply('babel', {});
  const builderOptions: BuilderOptions = typeof builder === 'string' ? {} : builder?.options || {};
  const typescriptOptions = options.presets.apply<TypescriptOptions>('typescript');

  const configsFinal = [...(await configs), getPreviewFile(options)].filter(Boolean);
  const entriesFinal = await entriesP;
  const typescriptOptionsFinal = await typescriptOptions;
  const storiesFinal = normalizeStories(await stories, { configDir, workingDir: process.cwd() });
  const featuresFinal = await features;

  const { mapping, entries } = featuresFinal?.storyStoreV7
    ? await getModernVirtualEntries({
        workingDir,
        stories: storiesFinal,
        configs: configsFinal,
        entries: entriesFinal,
        isProd,
        builderOptions,
      })
    : await getLegacyVirtualEntries({
        workingDir,
        stories: storiesFinal,
        configs: configsFinal,
        entries: entriesFinal,
        frameworkName,
      });

  const shouldCheckTs = typescriptOptionsFinal.check && !typescriptOptionsFinal.skipBabel;
  const tsCheckOptions = typescriptOptionsFinal.checkOptions || {};

  return {
    name: 'preview',
    mode: isProd ? 'production' : 'development',
    bail: isProd,
    devtool: 'cheap-module-source-map',
    entry: entries,
    output: {
      path: path.resolve(process.cwd(), outputDir),
      filename: isProd ? '[name].[contenthash:8].iframe.bundle.js' : '[name].iframe.bundle.js',
      publicPath: '',
    },
    stats: {
      preset: 'none',
      logging: 'error',
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    ignoreWarnings: [
      { message: /export '\S+' was not found in 'global'/ },
      { message: /Failed to parse source map/ },
      { message: /was not found in 'react'/ },
    ],
    plugins: [
      ...(Object.keys(mapping).length > 0 ? [new VirtualModulePlugin(mapping)] : []),
      new HtmlWebpackPlugin({
        filename: `iframe.html`,
        // FIXME: `none` isn't a known option
        chunksSortMode: 'none' as any,
        alwaysWriteToDisk: true,
        inject: false,
        template: await template,
        templateParameters: {
          version: packageJson.version,
          globals: {
            CONFIG_TYPE: configType,
            LOGLEVEL: await logLevel,
            FRAMEWORK_OPTIONS: await frameworkOptions,
            CHANNEL_OPTIONS: channelOptions,
            FEATURES: await features,
            PREVIEW_URL: previewUrl,
            STORIES: storiesFinal.map((specifier) => ({
              ...specifier,
              importPathMatcher: specifier.importPathMatcher.source,
            })),
            SERVER_CHANNEL_URL: serverChannelUrl,
          },
          headHtmlSnippet: await headHtmlSnippet,
          bodyHtmlSnippet: await bodyHtmlSnippet,
        },
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: false,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
        },
      }),
      new DefinePlugin({
        ...stringifyProcessEnvs(await envs),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      }),
      new ProvidePlugin({ process: require.resolve('process/browser.js') }),
      ...(isProd ? [] : [new HotModuleReplacementPlugin()]),
      new CaseSensitivePathsPlugin(),
      ...(quiet ? [] : [new ProgressPlugin({})]),
      ...(shouldCheckTs ? [new ForkTsCheckerWebpackPlugin(tsCheckOptions)] : []),
    ],
    module: {
      rules: [
        Object.defineProperty(
          {
            test: /\.css$/,
            sideEffects: true,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                },
              },
            ],
          },
          'custom_id',
          { enumerable: false, value: 'storybook_css' }
        ),
        Object.defineProperty(
          {
            test: /\.(svg|ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
            type: 'asset/resource',
            generator: {
              filename: isProd
                ? 'static/media/[name].[contenthash:8][ext]'
                : 'static/media/[path][name][ext]',
            },
          },
          'custom_id',
          { enumerable: false, value: 'storybook_media' }
        ),
        Object.defineProperty(
          {
            test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 10000,
              },
            },
            generator: {
              filename: isProd
                ? 'static/media/[name].[contenthash:8][ext]'
                : 'static/media/[path][name][ext]',
            },
          },
          'custom_id',
          { enumerable: false, value: 'storybook_media' }
        ),
        Object.defineProperty(
          {
            test: /\.m?js$/,
            type: 'javascript/auto',
            resolve: {
              fullySpecified: false,
            },
          },
          'custom_id',
          { enumerable: false, value: 'storybook_esm' }
        ),
        {
          test: /\.md$/,
          type: 'asset/source',
        },
        Object.defineProperty(
          {
            test: typescriptOptionsFinal.skipBabel ? /\.(mjs|jsx?)$/ : /\.(mjs|tsx?|jsx?)$/,
            use: [
              {
                loader: require.resolve('babel-loader'),
                options: await babelOptions,
              },
            ],
            include: [getProjectRoot()],
            exclude: /node_modules/,
          },
          'custom_id',
          { enumerable: false, value: 'storybook_babel' }
        ),
      ],
    },
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.cjs'],
      modules: ['node_modules'].concat((await envs).NODE_PATH || []),
      mainFields: ['browser', 'module', 'main'],
      alias: getAliasPaths(),
      fallback: {
        path: require.resolve('path-browserify'),
        assert: require.resolve('browser-assert'),
        util: require.resolve('util'),
        crypto: false,
      },
    },
    ...(builderOptions.fsCache ? { cache: { type: 'filesystem' as const } } : {}),
    experiments: {
      ...(builderOptions.lazyCompilation && !isProd ? { lazyCompilation: { entries: false } } : {}),
    },

    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      runtimeChunk: true,
      sideEffects: true,
      usedExports: isProd,
      moduleIds: 'named',
      minimizer: isProd
        ? [
            new TerserWebpackPlugin({
              parallel: true,
              terserOptions: {
                sourceMap: true,
                mangle: false,
                keep_fnames: true,
              },
            }),
          ]
        : [],
    },
    performance: {
      hints: isProd ? 'warning' : false,
    },
  };
};
