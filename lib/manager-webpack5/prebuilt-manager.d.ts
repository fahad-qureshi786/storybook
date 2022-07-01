import type { Options } from '@storybook/core-common';

export function getPrebuiltDir(options: Options): Promise<string | false>;

export type DEFAULT_ADDONS = string[];
export type IGNORED_ADDONS = string[];