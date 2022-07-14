import { join } from 'path';
import type { Options } from '@storybook/core-common';
import { getRefs } from '@storybook/core-common';

import { readTemplate } from './template';
import { executor, getConfig } from '../index';
import { safeResolve } from './safeResolve';

export const getData = async (options: Options) => {
  const refs = getRefs(options);
  const features = options.presets.apply<Record<string, string | boolean>>('features');
  const logLevel = options.presets.apply<string>('logLevel');
  const title = options.presets.apply<string>('title');
  const template = readTemplate('template.ejs');
  const customHead = safeResolve(join(options.configDir, 'manager-head.html'));

  // we await these, because crucially if these fail, we want to bail out asap
  const [instance, config] = await Promise.all([
    //
    executor.get(),
    getConfig(options),
  ]);

  return {
    refs,
    features,
    title,
    template,
    customHead,
    instance,
    config,
    logLevel,
  };
};
