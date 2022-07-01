import dedent from 'ts-dedent';
import { sync as readUpSync } from 'read-pkg-up';
import { logger, instance as npmLog } from '@storybook/node-logger';
import { buildDevStandalone } from '@storybook/core-server';
import { cache } from '@storybook/core-common';

export const dev = async (cliOptions: any) => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  try {
    await buildDevStandalone({
      ...cliOptions,
      configDir: cliOptions.configDir || './.storybook',
      configType: 'DEVELOPMENT',
      ignorePreview: !!cliOptions.previewUrl && !cliOptions.forceBuildPreview,
      docsMode: !!cliOptions.docs,
      cache,
      packageJson: readUpSync({ cwd: __dirname }).packageJson,
    });
  } catch (error) {
    // this is a weird bugfix, somehow 'node-pre-gyp' is polluting the npmLog header
    npmLog.heading = '';

    if (error instanceof Error) {
      if ((error as any).error) {
        logger.error((error as any).error);
      } else if ((error as any).stats && (error as any).stats.compilation.errors) {
        (error as any).stats.compilation.errors.forEach((e: any) => logger.plain(e));
      } else {
        logger.error(error as any);
      }
    } else if (error.compilation?.errors) {
      error.compilation.errors.forEach((e: any) => logger.plain(e));
    }

    logger.line();
    logger.warn(
      error.close
        ? dedent`
          FATAL broken build!, will close the process,
          Fix the error below and restart storybook.
        `
        : dedent`
          Broken build, fix the error above.
          You may need to refresh the browser.
        `
    );
    logger.line();

    process.exit(1);
  }
};
