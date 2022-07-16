import { logger } from '@storybook/node-logger';
import type { Options } from '@storybook/core-common';

const incompatiblePresets = ['@storybook/preset-scss', '@storybook/preset-typescript'];

export const checkForIncompatiblePresets = (options: Options): void => {
  const { presetsList } = options;

  incompatiblePresets
    .filter((searchvalue) => {
      return !!presetsList?.find((value) => value.name.includes(searchvalue));
    })
    .forEach((value) => {
      logger.warn(`\`${value}\` may not be compatible with \`@storybook/cra\``);
    });
};
