import fse from 'fs-extra';
import dedent from 'ts-dedent';
import { SupportedRenderers } from '../project_types';

interface ConfigureMainOptions {
  addons: string[];
  extensions?: string[];
  commonJs?: boolean;
  /**
   * Extra values for main.js
   *
   * In order to provide non-serializable data like functions, you can use
   * { value: '%%yourFunctionCall()%%' }
   *
   * '%% and %%' will be replace.
   *
   */
  [key: string]: any;
}

export async function configureMain({
  addons,
  extensions = ['js', 'jsx', 'ts', 'tsx'],
  commonJs = false,
  ...custom
}: ConfigureMainOptions) {
  const prefix = (await fse.pathExists('./src')) ? '../src' : '../stories';

  const config = {
    stories: [`${prefix}/**/*.stories.mdx`, `${prefix}/**/*.stories.@(${extensions.join('|')})`],
    addons,
    ...custom,
  };

  // replace escaped values and delimiters
  const stringified = `module.exports = ${JSON.stringify(config, null, 2)
    .replace(/\\"/g, '"')
    .replace(/['"]%%/g, '')
    .replace(/%%['"]/g, '')
    .replace(/\\n/g, '\r\n')}`;
  // main.js isn't actually JSON, but we used JSON.stringify to convert the runtime-object into code.
  // un-stringify the value for referencing packages by string
  // .replaceAll(/"(path\.dirname\(require\.resolve\(path\.join\('.*\))"/g, (_, a) => a)}`;

  await fse.writeFile(
    `./.storybook/main.${commonJs ? 'cjs' : 'js'}`,
    dedent`
      const path = require('path');
      ${stringified}
    `,
    { encoding: 'utf8' }
  );
}

const frameworkToPreviewParts: Partial<Record<SupportedRenderers, any>> = {
  angular: {
    prefix: dedent`
      import { setCompodocJson } from "@storybook/addon-docs/angular";
      import docJson from "../documentation.json";
      setCompodocJson(docJson);
      
      `.trimStart(),
    extraParameters: 'docs: { inlineStories: true },',
  },
};

export async function configurePreview(framework: SupportedRenderers, commonJs: boolean) {
  const { prefix = '', extraParameters = '' } = frameworkToPreviewParts[framework] || {};
  const previewPath = `./.storybook/preview.${commonJs ? 'cjs' : 'js'}`;

  // If the framework template included a preview then we have nothing to do
  if (await fse.pathExists(previewPath)) {
    return;
  }

  const preview = dedent`
    ${prefix}
    export const parameters = {
      actions: { argTypesRegex: "^on[A-Z].*" },
      controls: {
        matchers: {
          color: /(background|color)$/i,
          date: /Date$/,
        },
      },
      ${extraParameters}
    }`
    .replace('  \n', '')
    .trim();

  await fse.writeFile(previewPath, preview, { encoding: 'utf8' });
}
