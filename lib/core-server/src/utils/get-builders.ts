import type { Builder, Stats } from '@storybook/core-common';
import { dirname } from 'path';
import findUp from 'find-up';

export async function getManagerBuilder(): Promise<Builder<unknown, Stats>> {
  return import('@storybook/builder-manager');
}

export async function getPreviewBuilder(
  builderName: string,
  configDir: string
): Promise<Builder<unknown, Stats>> {
  const builderPackage = await getPreviewBuilderPath(builderName, configDir);

  const previewBuilder = await import(builderPackage);
  return previewBuilder;
}

export async function getPreviewBuilderPath(builderName: string, configDir: string) {
  if (builderName) {
    const location = await findUp('package.json', {
      cwd: require.resolve(
        ['webpack5'].includes(builderName) ? `@storybook/builder-${builderName}` : builderName,
        { paths: [configDir] }
      ),
    });

    return dirname(location);
  }
  throw new Error('no builder configured!');
}
