import type { Options as TelejsonOptions } from 'telejson';

interface Options {
  clearOnStoryChange: boolean;
  limit: number;
}

export type ActionOptions = Partial<Options> & Partial<TelejsonOptions>;
