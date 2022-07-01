import { baseGenerator } from '../baseGenerator';
import { Generator } from '../types';

const generator: Generator = async (packageManager, npmOptions, options) => {
  return baseGenerator(packageManager, npmOptions, options, 'web-components', {
    extraPackages: ['lit-html'],
  });
};

export default generator;
