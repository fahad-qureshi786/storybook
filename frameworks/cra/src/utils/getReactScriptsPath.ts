import { readFile, realpath } from 'fs-extra';
import { join, dirname } from 'path';

import type { Options } from '@storybook/core-common';

export const getReactScriptsPath = async (scriptsPackageName?: string, options?: Options) => {
  const cwd = process.cwd();

  if (typeof scriptsPackageName === 'string') {
    return dirname(
      require.resolve(`${scriptsPackageName}/package.json`, {
        paths: [options?.configDir || process.cwd()],
      })
    );
  }

  const scriptsBinPath = join(cwd, '/node_modules/.bin/react-scripts');

  if (process.platform === 'win32') {
    /*
     * Try to find the scripts package on Windows by following the `react-scripts` CMD file.
     * https://github.com/storybookjs/storybook/issues/5801
     */
    try {
      const content = await readFile(scriptsBinPath, 'utf8');
      const packagePathMatch = content.match(
        /"\$basedir[\\/](\S+?)[\\/]bin[\\/]react-scripts\.js"/i
      );

      if (packagePathMatch && packagePathMatch.length > 1) {
        const scriptsPath = join(cwd, '/node_modules/.bin/', packagePathMatch[1]);
        return scriptsPath;
      }
    } catch (e) {
      // NOOP
    }
  } else {
    /*
     * Try to find the scripts package by following the `react-scripts` symlink.
     * This won't work for Windows users, unless within WSL.
     */
    try {
      const resolvedBinPath = await realpath(scriptsBinPath);
      const scriptsPath = join(resolvedBinPath, '..', '..');
      return scriptsPath;
    } catch (e) {
      // NOOP
    }
  }

  /*
   * Try to find the `react-scripts` package by name (won't catch forked scripts packages).
   */
  try {
    const scriptsPath = dirname(require.resolve('react-scripts/package.json'));
    return scriptsPath;
  } catch (e) {
    // NOOP
  }

  throw new Error('Could not find react-scripts package.');
};
