import path, { dirname, join } from 'path';
import { readFile, pathExists } from 'fs-extra';

const interpolate = (string: string, data: Record<string, string> = {}) =>
  Object.entries(data).reduce((acc, [k, v]) => acc.replace(new RegExp(`%${k}%`, 'g'), v), string);

export const getTemplatePath = async (template: string) => {
  return join(
    dirname(require.resolve('@storybook/builder-manager/package.json')),
    'templates',
    template
  );
};

export const readTemplate = async (template: string) => {
  const path = await getTemplatePath(template);

  return readFile(path, 'utf8');
};

export async function getManagerHeadTemplate(
  configDirPath: string,
  interpolations: Record<string, string>
) {
  const head = await pathExists(path.resolve(configDirPath, 'manager-head.html')).then<
    Promise<string> | false
  >((exists) => {
    if (exists) {
      return readFile(path.resolve(configDirPath, 'manager-head.html'), 'utf8');
    }
    return false;
  });

  if (!head) {
    return '';
  }

  return interpolate(head, interpolations);
}

export async function getManagerMainTemplate() {
  return getTemplatePath(`manager.ejs`);
}

export { render } from 'ejs';
