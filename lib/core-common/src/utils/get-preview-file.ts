import path from 'path';
import type { Options } from '../types';

import { getInterpretedFile } from './interpret-files';

export function getPreviewFile({ configDir }: Options) {
  const storybookPreviewPath = getInterpretedFile(path.resolve(configDir, 'preview'));

  return storybookPreviewPath;
}
