import type { Configuration, Stats, StatsOptions } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { logger } from '@storybook/node-logger';
import { useProgressReporting } from '@storybook/core-common';
import type { Builder } from '@storybook/core-common';

export * from './types';

let compilation: ReturnType<typeof webpackDevMiddleware>;
let reject: (reason?: any) => void;

type WebpackBuilder = Builder<Configuration, Stats>;
type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

type BuilderStartOptions = Parameters<WebpackBuilder['start']>['0'];
type BuilderStartResult = Unpromise<ReturnType<WebpackBuilder['start']>>;
type StarterFunction = (
  options: BuilderStartOptions
) => AsyncGenerator<unknown, BuilderStartResult, void>;

type BuilderBuildOptions = Parameters<WebpackBuilder['build']>['0'];
type BuilderBuildResult = Unpromise<ReturnType<WebpackBuilder['build']>>;
type BuilderFunction = (
  options: BuilderBuildOptions
) => AsyncGenerator<Stats | undefined, BuilderBuildResult, void>;

export const executor = {
  get: async () => {
    return (await import('webpack')).default;
  },
};

export const getConfig: WebpackBuilder['getConfig'] = async (options) => {
  const { presets } = options;
  const typescriptOptions = await presets.apply('typescript', {}, options);
  const babelOptions = await presets.apply('babel', {}, { ...options, typescriptOptions });
  const framework = await presets.apply<any>('framework', {}, options);

  return presets.apply(
    'webpack',
    {},
    {
      ...options,
      babelOptions,
      typescriptOptions,
      frameworkOptions: typeof framework === 'string' ? {} : framework?.options,
    }
  ) as any;
};

let asyncIterator: ReturnType<StarterFunction> | ReturnType<BuilderFunction>;

export const bail: WebpackBuilder['bail'] = async () => {
  if (asyncIterator) {
    try {
      // we tell the builder (that started) to stop ASAP and wait
      await asyncIterator.throw(new Error());
    } catch (e) {
      //
    }
  }

  if (reject) {
    reject();
  }
  // we wait for the compiler to finish it's work, so it's command-line output doesn't interfere
  return new Promise((res, rej) => {
    // @ts-ignore
    if (process && compilation) {
      try {
        compilation.close(() => res());
        logger.warn('Force closed preview build');
      } catch (err) {
        logger.warn('Unable to close preview build!');
        res();
      }
    } else {
      res();
    }
  });
};

/**
 * This function is a generator so that we can abort it mid process
 * in case of failure coming from other processes e.g. preview builder
 *
 * I am sorry for making you read about generators today :')
 */
const starter: StarterFunction = async function* starterGeneratorFn({
  startTime,
  options,
  router,
}) {
  const webpackInstance = await executor.get();
  yield;

  const config = await getConfig(options);
  yield;
  const compiler = webpackInstance.webpack(config);

  if (!compiler) {
    const err = `${config.name}: missing webpack compiler at runtime!`;
    logger.error(err);
    return {
      bail,
      totalTime: process.hrtime(startTime),
      stats: {
        hasErrors: () => true,
        hasWarnings: () => false,
        toJson: () => ({ warnings: [] as any[], errors: [err] }),
      } as any as Stats,
    };
  }

  const { handler, modulesCount } = await useProgressReporting(router, startTime, options);
  yield;
  new webpackInstance.ProgressPlugin({ handler, modulesCount }).apply(compiler);

  const middlewareOptions: Parameters<typeof webpackDevMiddleware>[1] = {
    publicPath: config.output?.publicPath as string,
    writeToDisk: true,
  };

  compilation = webpackDevMiddleware(compiler, middlewareOptions);

  router.use(compilation);
  router.use(webpackHotMiddleware(compiler as any));

  const stats = await new Promise<Stats>((ready, stop) => {
    compilation.waitUntilValid(ready as any);
    reject = stop;
  });
  yield;

  if (!stats) {
    throw new Error('no stats after building preview');
  }

  if (stats.hasErrors()) {
    throw stats;
  }

  return {
    bail,
    stats,
    totalTime: process.hrtime(startTime),
  };
};

/**
 * This function is a generator so that we can abort it mid process
 * in case of failure coming from other processes e.g. manager builder
 *
 * I am sorry for making you read about generators today :')
 */
const builder: BuilderFunction = async function* builderGeneratorFn({ startTime, options }) {
  const webpackInstance = await executor.get();
  yield;
  logger.info('=> Compiling preview..');
  const config = await getConfig(options);
  yield;

  const compiler = webpackInstance.webpack(config);

  if (!compiler) {
    const err = `${config.name}: missing webpack compiler at runtime!`;
    logger.error(err);
    return {
      hasErrors: () => true,
      hasWarnings: () => false,
      toJson: () => ({ warnings: [] as any[], errors: [err] }),
    } as any as Stats;
  }

  return new Promise<Stats>((succeed, fail) => {
    compiler.run((error, stats) => {
      if (error || !stats || stats.hasErrors()) {
        logger.error('=> Failed to build the preview');
        process.exitCode = 1;

        if (error) {
          logger.error(error.message);

          compiler.close(() => fail(error));

          return;
        }

        if (stats && (stats.hasErrors() || stats.hasWarnings())) {
          const { warnings = [], errors = [] } = stats.toJson(
            typeof config.stats === 'string'
              ? config.stats
              : {
                  warnings: true,
                  errors: true,
                  ...(config.stats as StatsOptions),
                }
          );

          errors.forEach((e) => logger.error(e.message));
          warnings.forEach((e) => logger.error(e.message));

          compiler.close(() =>
            options.debugWebpack
              ? fail(stats)
              : fail(new Error('=> Webpack failed, learn more with --debug-webpack'))
          );

          return;
        }
      }

      logger.trace({ message: '=> Preview built', time: process.hrtime(startTime) });
      if (stats && stats.hasWarnings()) {
        // @ts-ignore
        stats
          .toJson({ warnings: true } as StatsOptions)
          .warnings.forEach((e) => logger.warn(e.message));
      }

      // https://js.org/api/node/#run
      // #15227
      compiler.close((closeErr) => {
        if (closeErr) {
          return fail(closeErr);
        }

        return succeed(stats as Stats);
      });
    });
  });
};

export const start = async (options: BuilderStartOptions) => {
  asyncIterator = starter(options);
  let result;

  do {
    // eslint-disable-next-line no-await-in-loop
    result = await asyncIterator.next();
  } while (!result.done);

  return result.value;
};

export const build = async (options: BuilderStartOptions) => {
  asyncIterator = builder(options);
  let result;

  do {
    // eslint-disable-next-line no-await-in-loop
    result = await asyncIterator.next();
  } while (!result.done);

  return result.value;
};

export const corePresets = [require.resolve('@storybook/builder-webpack5/dist/preview-preset')];
export const overridePresets = [
  require.resolve('@storybook/builder-webpack5/dist/custom-webpack-preset'),
];
