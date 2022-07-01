import readdirp, { ReaddirpOptions } from 'readdirp';

const defaults = {
  fileFilter: '*.mjs',
  lstat: false,
  type: 'files',
  depth: 10,
} as ReaddirpOptions;

export const readDeep = async (dir: string, options: ReaddirpOptions = {}) => {
  return readdirp.promise(dir, { ...defaults, ...options });
};
