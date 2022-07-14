import { sync as readUpSync } from 'read-pkg-up';
import { logger } from '@storybook/node-logger';
import { buildStaticStandalone } from '@storybook/core-server';
import { cache } from '@storybook/core-common';

export const build = async (cliOptions: any) => {
  try {
    await buildStaticStandalone({
      ...cliOptions,
      configDir: cliOptions.configDir || './.storybook',
      outputDir: cliOptions.outputDir || './storybook-static',
      ignorePreview: !!cliOptions.previewUrl && !cliOptions.forceBuildPreview,
      docsMode: !!cliOptions.docs,
      configType: 'PRODUCTION',
      cache,
      packageJson: readUpSync({ cwd: __dirname }).packageJson,
    });
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
};
