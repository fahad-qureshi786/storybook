import { baseGenerator } from '../baseGenerator';
import { Generator } from '../types';
import { copyTemplate } from '../../helpers';

const generator: Generator = async (packageManager, npmOptions, options) => {
  await baseGenerator(packageManager, npmOptions, options, 'server', {
    extensions: ['json'],
  });

  copyTemplate(__dirname);
};

export default generator;
