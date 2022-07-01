import path from 'path';
import fs from 'fs';
import semver from '@storybook/semver';

import { baseGenerator } from '../baseGenerator';
import { Generator } from '../types';
import { CoreBuilder } from '../../project_types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  const monorepoRootPath = path.join(__dirname, '..', '..', '..', '..', '..', '..');
  const extraMain = options.linkable
    ? {
        webpackFinal: `%%(config) => {
      // add monorepo root as a valid directory to import modules from
      config.resolve.plugins.forEach((p) => {
        if (Array.isArray(p.appSrcs)) {
          p.appSrcs.push('${monorepoRootPath}');
              }
            });
          return config;
          }
    %%`,
      }
    : {};

  const craVersion = semver.coerce(
    packageManager.retrievePackageJson().dependencies['react-scripts']
  )?.version;
  const isCra5 = craVersion && semver.gte(craVersion, '5.0.0');
  const updatedOptions = isCra5 ? { ...options, builder: CoreBuilder.Webpack5 } : options;
  // `@storybook/preset-create-react-app` has `@storybook/node-logger` as peerDep
  const extraPackages = ['@storybook/node-logger'];
  if (isCra5) {
    extraPackages.push('webpack');
    // Miscellaneous dependency used in `babel-preset-react-app` but not listed as dep there
    extraPackages.push('babel-plugin-named-exports-order');
    // Miscellaneous dependency to add to be sure Storybook + CRA is working fine with Yarn PnP mode
    extraPackages.push('prop-types');
  }

  // preset v3 is compat with older versions of CRA, otherwise let version float
  const extraAddons = [`@storybook/preset-create-react-app${isCra5 ? '' : '@3'}`];

  await baseGenerator(packageManager, npmOptions, updatedOptions, 'react', {
    extraAddons,
    extraPackages,
    staticDir: fs.existsSync(path.resolve('./public')) ? 'public' : undefined,
    addBabel: false,
    addESLint: true,
    extraMain,
  });
};

export default generator;
