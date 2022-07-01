import fse from 'fs-extra';
import { logger } from '@storybook/node-logger';

import { baseGenerator } from '../baseGenerator';
import { Generator } from '../types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  let svelteOptions;
  let commonJs = false;
  // svelte.config.js ?
  if (fse.existsSync('./svelte.config.js')) {
    logger.info("Configuring preprocessor from 'svelte.config.js'");

    svelteOptions = { preprocess: '%%require("../svelte.config.js").preprocess%%' };
  } else if (fse.existsSync('./svelte.config.cjs')) {
    logger.info("Configuring preprocessor from 'svelte.config.cjs'");

    commonJs = true;

    svelteOptions = { preprocess: '%%require("../svelte.config.cjs").preprocess%%' };
  } else {
    // svelte-preprocess dependencies ?
    const packageJson = packageManager.retrievePackageJson();
    if (packageJson.devDependencies && packageJson.devDependencies['svelte-preprocess']) {
      logger.info("Configuring preprocessor with 'svelte-preprocess'");

      svelteOptions = { preprocess: '%%require("svelte-preprocess")()%%' };
    }
  }

  await baseGenerator(packageManager, npmOptions, options, 'svelte', {
    extraPackages: ['svelte', 'svelte-loader'],
    extensions: ['js', 'jsx', 'ts', 'tsx', 'svelte'],
    framework: svelteOptions,
    commonJs,
  });
};

export default generator;
