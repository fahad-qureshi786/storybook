import { dedent } from 'ts-dedent';
import glob from 'glob';
import path from 'path';

import { boost } from './interpret-files';

export function validateConfigurationFiles(configDir: string) {
  const extensionsPattern = `{${Array.from(boost).join(',')}}`;
  const exists = (file: string) =>
    !!glob.sync(path.resolve(configDir, `${file}${extensionsPattern}`)).length;

  const main = exists('main');

  if (!main) {
    throw new Error(dedent`
      No configuration files have been found in your configDir (${path.resolve(configDir)}).
      Storybook needs a "main" file.
    `);
  }
}
