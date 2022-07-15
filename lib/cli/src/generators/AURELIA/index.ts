import { writeFileAsJson, readFileAsJson, copyTemplate } from '../../helpers';
import { baseGenerator } from '../baseGenerator';
import { Generator } from '../types';

function addStorybookExcludeGlobToTsConfig() {
  const tsConfigJson = readFileAsJson('tsconfig.json', true);
  const glob = '**/*.stories.ts';
  if (!tsConfigJson) {
    return;
  }

  const { exclude = [] } = tsConfigJson;
  if (exclude.includes(glob)) {
    return;
  }

  tsConfigJson.exclude = [...exclude, glob];
  writeFileAsJson('tsconfig.json', tsConfigJson);
}

const generator: Generator = async (packageManager, npmOptions, options) => {
  addStorybookExcludeGlobToTsConfig();
  await baseGenerator(packageManager, npmOptions, options, 'aurelia', {
    extraPackages: ['aurelia'],
  });
  copyTemplate(__dirname);
};

export default generator;
