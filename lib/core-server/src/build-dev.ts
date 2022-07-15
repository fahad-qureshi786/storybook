import type {
  CLIOptions,
  LoadOptions,
  BuilderOptions,
  Options,
  StorybookConfig,
} from '@storybook/core-common';
import {
  resolvePathInStorybookCache,
  loadAllPresets,
  cache,
  loadMainConfig,
} from '@storybook/core-common';
import prompts from 'prompts';
import global from 'global';

import { join, resolve } from 'path';
import { logger } from '@storybook/node-logger';
import { storybookDevServer } from './dev-server';
import { getReleaseNotesData, getReleaseNotesFailedState } from './utils/release-notes';
import { outputStats } from './utils/output-stats';
import { outputStartupInformation } from './utils/output-startup-information';
import { updateCheck } from './utils/update-check';
import { getServerPort, getServerChannelUrl } from './utils/server-address';
import { getPreviewBuilderPath } from './utils/get-builders';

export async function buildDevStandalone(options: CLIOptions & LoadOptions & BuilderOptions) {
  const { packageJson, versionUpdates, releaseNotes } = options;
  const { version } = packageJson;

  // updateInfo and releaseNotesData are cached, so this is typically pretty fast
  const [port, versionCheck, releaseNotesData] = await Promise.all([
    getServerPort(options.port),
    versionUpdates
      ? updateCheck(version)
      : Promise.resolve({ success: false, data: {}, time: Date.now() }),
    releaseNotes
      ? getReleaseNotesData(version, cache)
      : Promise.resolve(getReleaseNotesFailedState(version)),
  ]);

  if (!options.ci && !options.smokeTest && options.port != null && port !== options.port) {
    const { shouldChangePort } = await prompts({
      type: 'confirm',
      initial: true,
      name: 'shouldChangePort',
      message: `Port ${options.port} is not available. Would you like to run Storybook on port ${port} instead?`,
    });
    if (!shouldChangePort) process.exit(1);
  }

  /* eslint-disable no-param-reassign */
  options.port = port;
  options.versionCheck = versionCheck;
  options.releaseNotesData = releaseNotesData;
  options.configType = 'DEVELOPMENT';
  options.configDir = resolve(options.configDir);
  options.outputDir = options.smokeTest
    ? resolvePathInStorybookCache('public')
    : resolve(options.outputDir || resolvePathInStorybookCache('public'));
  options.serverChannelUrl = getServerChannelUrl(port, options);
  /* eslint-enable no-param-reassign */

  const { framework, core } = loadMainConfig(options);
  const corePresets = [];

  const frameworkName = typeof framework === 'string' ? framework : framework?.name;
  if (frameworkName) {
    corePresets.push(join(frameworkName, 'preset'));
  } else {
    logger.warn(`you have not specified a framework in your ${options.configDir}/main.js`);
  }

  if (core?.builder) {
    if (framework) {
      logger.warn(
        `You have specified both a framework and a builder. This might conflict, and could be unstable! Configure the builder thru the framework-options instead.`
      );
    }

    const builderName = typeof core?.builder === 'string' ? core.builder : core?.builder?.name;
    const builderPath = await getPreviewBuilderPath(builderName, options.configDir);

    corePresets.push(join(builderPath, 'preset'));
  }

  const startTime = process.hrtime();
  const presets = await loadAllPresets({
    corePresets: [
      require.resolve('./presets/common-preset'),
      ...corePresets,
      require.resolve('./presets/babel-cache-preset'),
    ],
    ...options,
  });
  logger.trace({ message: '=> Loaded presets', time: process.hrtime(startTime) });

  const features = await presets.apply<StorybookConfig['features']>('features');
  global.FEATURES = features;

  const fullOptions: Options = {
    ...options,
    presets,
    features,
  };

  const { address, networkAddress, managerResult, previewResult } = await storybookDevServer(
    fullOptions
  );

  const previewTotalTime = previewResult && previewResult.totalTime;
  const managerTotalTime = managerResult && managerResult.totalTime;

  const previewStats = previewResult && previewResult.stats;
  const managerStats = managerResult && managerResult.stats;

  if (options.webpackStatsJson) {
    const target = options.webpackStatsJson === true ? options.outputDir : options.webpackStatsJson;
    await outputStats(target, previewStats);
  }

  if (options.smokeTest) {
    const warnings: Error[] = [];
    warnings.push(...((managerStats && managerStats.toJson().warnings) || []));
    warnings.push(...((managerStats && previewStats.toJson().warnings) || []));

    const problems = warnings
      .filter((warning) => !warning.message.includes(`export 'useInsertionEffect'`))
      .filter((warning) => !warning.message.includes(`compilation but it's unused`))
      .filter(
        (warning) => !warning.message.includes(`Conflicting values for 'process.env.NODE_ENV'`)
      );

    console.log(problems.map((p) => p.stack));
    process.exit(problems.length > 0 ? 1 : 0);
    return;
  }

  const name =
    frameworkName.split('@storybook/').length > 1
      ? frameworkName.split('@storybook/')[1]
      : frameworkName;

  outputStartupInformation({
    updateInfo: versionCheck,
    version,
    name,
    address,
    networkAddress,
    managerTotalTime,
    previewTotalTime,
  });
}
