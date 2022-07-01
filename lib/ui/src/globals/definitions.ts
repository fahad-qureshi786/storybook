import type { ModuleInfo } from '@fal-works/esbuild-plugin-global-externals';
import x from './exports';
import { Keys, Definitions } from './types';

const createModuleInfo = (m: keyof typeof Keys): Required<ModuleInfo> => ({
  type: 'esm',
  varName: Keys[m],
  namedExports: x[m],
  defaultExport: true,
});

export const definitions: Definitions = Object.keys(Keys).reduce<Definitions>((acc, key) => {
  acc[key as keyof typeof Keys] = createModuleInfo(key as keyof typeof Keys);
  return acc;
}, {} as Definitions);
