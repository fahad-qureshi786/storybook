import type { Options, Builder } from '@storybook/core-common';
import { getBuilder } from '@storybook/core-common';

export async function getBuilders(options: Options): Promise<Builder<unknown>[]> {
  return Promise.all([getBuilder(options), import('@storybook/builder-manager')]);
}
