import { readJSON } from 'fs-extra';
import { dirname, join } from 'path';
import findUp from 'find-up';

import resolveFrom from 'resolve-from';
import { logger } from '@storybook/node-logger';
import { Options, Ref } from '../types';

export const getAutoRefs = async (options: Options): Promise<Record<string, Ref>> => {
  const location = await findUp('package.json', { cwd: options.configDir });
  if (!location) {
    return {};
  }
  const directory = dirname(location);

  const { dependencies = [], devDependencies = [] } = (await readJSON(location)) || {};
  const deps = Object.keys({ ...dependencies, ...devDependencies });

  const list = await Promise.all(
    deps.map(async (d) => {
      try {
        const l = resolveFrom(directory, join(d, 'package.json'));

        const { storybook, name, version } = (await readJSON(l)) || {};

        if (storybook?.url) {
          return { id: name, ...storybook, version };
        }
      } catch {
        logger.warn(`unable to find package.json for ${d}`);
        return undefined;
      }
      return undefined;
    })
  );

  return list.filter(Boolean).reduce(
    (acc, cur) => ({
      ...acc,
      [cur.id]: {
        id: cur.id.toLowerCase(),
        url: stripTrailingSlash(cur.url),
        title: cur.title,
        version: cur.version,
      },
    }),
    {}
  );
};

const checkRef = (url: string) =>
  fetch(`${url}/iframe.html`).then(
    ({ ok }) => ok,
    () => false
  );

const stripTrailingSlash = (url: string) => url.replace(/\/$/, '');

const toTitle = (input: string) => {
  const result = input
    .replace(/[A-Z]/g, (f) => ` ${f}`)
    .replace(/[-_][A-Z]/gi, (f) => ` ${f.toUpperCase()}`)
    .replace(/-/g, ' ')
    .replace(/_/g, ' ');

  return `${result.substring(0, 1).toUpperCase()}${result.substring(1)}`.trim();
};

export async function getRefs(options: Options) {
  const refs = await options.presets.apply<Record<string, Ref>>('refs', await getAutoRefs(options));

  Object.entries(refs).forEach(([key, value]: [string, Ref]) => {
    if (value.disable) {
      // Also delete the ref that is disabled in definedRefs
      delete refs[key];

      return;
    }

    refs[key.toLowerCase()] = {
      ...value,
      id: key.toLowerCase(),
      title: value.title || toTitle(value.id || key),
      url: stripTrailingSlash(value.url),
    };
  });

  // verify the refs are publicly reachable, if they are not we'll require stories.json at runtime, otherwise the ref won't work
  await Promise.all(
    Object.entries(refs).map(async ([k, value]) => {
      const ok = await checkRef(value.url);

      refs[k] = { ...value, type: ok ? 'server-checked' : 'unknown' };
    })
  );

  return refs;
}
