import chalk from 'chalk';
import { copy, emptyDir, ensureDir } from 'fs-extra';
import path, { dirname, join } from 'path';
import { dedent } from 'ts-dedent';
import global from 'global';

import { logger } from '@storybook/node-logger';
import { telemetry } from '@storybook/telemetry';
import type {
  LoadOptions,
  CLIOptions,
  BuilderOptions,
  Options,
  StorybookConfig,
  CoreConfig,
} from '@storybook/core-common';
import {
  loadAllPresets,
  normalizeStories,
  logConfig,
  loadMainConfig,
} from '@storybook/core-common';

import { outputStats } from './utils/output-stats';
import {
  copyAllStaticFiles,
  copyAllStaticFilesRelativeToMain,
} from './utils/copy-all-static-files';
import { getBuilders } from './utils/get-builders';
import { extractStoriesJson, convertToIndexV3 } from './utils/stories-json';
import { extractStorybookMetadata } from './utils/metadata';
import { StoryIndexGenerator } from './utils/StoryIndexGenerator';

export async function buildStaticStandalone(
  options: CLIOptions & LoadOptions & BuilderOptions & { outputDir: string }
) {
  /* eslint-disable no-param-reassign */
  options.configType = 'PRODUCTION';

  if (options.outputDir === '') {
    throw new Error("Won't remove current directory. Check your outputDir!");
  }

  if (options.staticDir?.includes('/')) {
    throw new Error("Won't copy root directory. Check your staticDirs!");
  }

  options.outputDir = path.isAbsolute(options.outputDir)
    ? options.outputDir
    : path.join(process.cwd(), options.outputDir);
  options.configDir = path.resolve(options.configDir);
  /* eslint-enable no-param-reassign */

  logger.info(chalk`=> Cleaning outputDir: {cyan ${options.outputDir.replace(process.cwd(), '')}}`);
  if (options.outputDir === '/') {
    throw new Error("Won't remove directory '/'. Check your outputDir!");
  }
  await emptyDir(options.outputDir);
  await ensureDir(options.outputDir);

  const { framework } = loadMainConfig(options);
  const corePresets = [];

  const frameworkName = typeof framework === 'string' ? framework : framework?.name;
  if (frameworkName) {
    corePresets.push(join(frameworkName, 'preset'));
  } else {
    logger.warn(`you have not specified a framework in your ${options.configDir}/main.js`);
  }

  logger.info('=> Loading presets');
  let presets = loadAllPresets({
    corePresets: [require.resolve('./presets/common-preset'), ...corePresets],
    overridePresets: [],
    ...options,
  });

  const [previewBuilder, managerBuilder] = await getBuilders({ ...options, presets });

  presets = loadAllPresets({
    corePresets: [
      require.resolve('./presets/common-preset'),
      ...(managerBuilder.corePresets || []),
      ...(previewBuilder.corePresets || []),
      ...corePresets,
      require.resolve('./presets/babel-cache-preset'),
    ],
    overridePresets: previewBuilder.overridePresets || [],
    ...options,
  });

  const [features, core, staticDirs, storyIndexers, stories] = await Promise.all([
    presets.apply<StorybookConfig['features']>('features'),
    presets.apply<CoreConfig>('core'),
    presets.apply<StorybookConfig['staticDirs']>('staticDirs'),
    presets.apply('storyIndexers', []),
    presets.apply('stories'),
  ]);

  const fullOptions: Options = {
    ...options,
    presets,
    features,
  };

  if (staticDirs && options.staticDir) {
    throw new Error(dedent`
      Conflict when trying to read staticDirs:
      * Storybook's configuration option: 'staticDirs'
      * Storybook's CLI flag: '--staticDir' or '-s'
      
      Choose one of them, but not both.
    `);
  }

  const effects: Promise<void>[] = [];

  global.FEATURES = features;

  await managerBuilder.build({ startTime: process.hrtime(), options: fullOptions });

  if (staticDirs) {
    effects.push(
      copyAllStaticFilesRelativeToMain(staticDirs, options.outputDir, options.configDir)
    );
  }
  if (options.staticDir) {
    effects.push(copyAllStaticFiles(options.staticDir, options.outputDir));
  }

  const coreServerPublicDir = join(
    dirname(require.resolve('@storybook/core-server/package.json')),
    'public'
  );
  effects.push(copy(coreServerPublicDir, options.outputDir));

  let initializedStoryIndexGenerator: Promise<StoryIndexGenerator> = Promise.resolve(undefined);
  if ((features?.buildStoriesJson || features?.storyStoreV7) && !options.ignorePreview) {
    const workingDir = process.cwd();
    const directories = {
      configDir: options.configDir,
      workingDir,
    };
    const normalizedStories = normalizeStories(stories, directories);

    const generator = new StoryIndexGenerator(normalizedStories, {
      ...directories,
      storyIndexers,
      storiesV2Compatibility: !features?.breakingChangesV7 && !features?.storyStoreV7,
      storyStoreV7: !!features?.storyStoreV7,
    });

    initializedStoryIndexGenerator = generator.initialize().then(() => generator);
    effects.push(
      extractStoriesJson(
        path.join(options.outputDir, 'stories.json'),
        initializedStoryIndexGenerator,
        convertToIndexV3
      )
    );
    effects.push(
      extractStoriesJson(path.join(options.outputDir, 'index.json'), initializedStoryIndexGenerator)
    );
  }

  if (!core?.disableTelemetry) {
    effects.push(
      initializedStoryIndexGenerator.then(async (generator) => {
        if (!generator) {
          return;
        }

        const storyIndex = await generator.getIndex();
        const payload = storyIndex
          ? {
              storyIndex: {
                storyCount: Object.keys(storyIndex.entries).length,
                version: storyIndex.v,
              },
            }
          : undefined;
        await telemetry('build', payload, { configDir: options.configDir });
      })
    );
  }

  if (!core?.disableProjectJson) {
    effects.push(
      extractStorybookMetadata(path.join(options.outputDir, 'project.json'), options.configDir)
    );
  }

  if (options.debugWebpack) {
    logConfig('Preview webpack config', await previewBuilder.getConfig(fullOptions));
  }

  if (options.ignorePreview) {
    logger.info(`=> Not building preview`);
  }

  await Promise.all([
    ...(options.ignorePreview
      ? []
      : [
          previewBuilder
            .build({
              startTime: process.hrtime(),
              options: fullOptions,
            })
            .then(async (previewStats) => {
              if (options.webpackStatsJson) {
                const target =
                  options.webpackStatsJson === true ? options.outputDir : options.webpackStatsJson;
                await outputStats(target, previewStats);
              }
            }),
        ]),
    ...effects,
  ]);

  logger.info(`=> Output directory: ${options.outputDir}`);
}
