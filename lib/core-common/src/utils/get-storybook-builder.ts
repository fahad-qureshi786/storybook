import type { Builder, CoreConfig, Options } from '../types';

export async function getBuilder({ presets, configDir }: Options): Promise<Builder<any, any>> {
  const core = await presets.apply<CoreConfig>('core', undefined);
  const builderName = typeof core?.builder === 'string' ? core.builder : core?.builder?.name;

  let builderPackage: string;
  if (builderName) {
    builderPackage = require.resolve(
      ['webpack5'].includes(builderName) ? `@storybook/builder-${builderName}` : builderName,
      { paths: [configDir] }
    );
  } else {
    throw new Error('no builder configured!');
  }
  const previewBuilder = await import(builderPackage);
  return previewBuilder;
}
