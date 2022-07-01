import { start } from '@storybook/core-client';

import './globals';
import { renderToDOM } from './render';

const { configure: coreConfigure, clientApi, forceReRender } = start(renderToDOM);

export const { setAddon, addDecorator, addParameters, clearDecorators, getStorybook, raw } =
  clientApi;

const FRAMEWORK = 'ember';
export const storiesOf = (kind: string, m: any) =>
  clientApi.storiesOf(kind, m).addParameters({ framework: FRAMEWORK });
export const configure = (loadable: any, m: any) => coreConfigure(FRAMEWORK, loadable, m);

export { forceReRender };
