import * as webpackReal from 'webpack';
import { logger } from '@storybook/node-logger';
import type { Options, CoreConfig } from '@storybook/core-common';
import type { Configuration } from 'webpack';
import { loadCustomWebpackConfig } from '@storybook/core-webpack';
import { createDefaultWebpackConfig } from '../preview/base-webpack.config';

export async function webpack(config: Configuration, options: Options) {
  // @ts-ignore
  const { configDir, configType, presets } = options;

  const coreOptions = await presets.apply<CoreConfig>('core');

  let defaultConfig = config;
  if (!coreOptions?.disableWebpackDefaults) {
    defaultConfig = await createDefaultWebpackConfig(config, options);
  }

  const finalDefaultConfig = await presets.apply('webpackFinal', defaultConfig, options);

  // Check whether user has a custom webpack config file and
  // return the (extended) base configuration if it's not available.
  const customConfig = loadCustomWebpackConfig(configDir);

  if (typeof customConfig === 'function') {
    logger.info('=> Loading custom Webpack config (full-control mode).');
    return customConfig({ config: finalDefaultConfig, mode: configType });
  }

  logger.info('=> Using default Webpack5 setup');
  return finalDefaultConfig;
}

export const webpackInstance = async () => webpackReal;
export const webpackVersion = async () => '5';
