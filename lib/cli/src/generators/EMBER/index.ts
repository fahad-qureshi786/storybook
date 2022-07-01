import { baseGenerator } from '../baseGenerator';
import { Generator } from '../types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  await baseGenerator(packageManager, npmOptions, options, 'ember', {
    extraPackages: [
      // babel-plugin-ember-modules-api-polyfill is a peerDep of @storybook/ember
      'babel-plugin-ember-modules-api-polyfill',
      // babel-plugin-htmlbars-inline-precompile is a peerDep of @storybook/ember
      'babel-plugin-htmlbars-inline-precompile',
    ],
    staticDir: 'dist',
  });
};

export default generator;
