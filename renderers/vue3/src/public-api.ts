import type { App } from 'vue';
import { start } from '@storybook/core-client';
import type { ClientStoryApi, Loadable } from '@storybook/addons';

import type { IStorybookSection, VueFramework } from './types';
import { decorateStory } from './decorateStory';

import { render, renderToDOM } from './render';

const FRAMEWORK = 'vue3';

interface ClientApi extends ClientStoryApi<VueFramework['storyResult']> {
  setAddon(addon: any): void;
  configure(loader: Loadable, module: NodeModule): void;
  getStorybook(): IStorybookSection[];
  clearDecorators(): void;
  forceReRender(): void;
  raw: () => any; // todo add type
  load: (...args: any[]) => void;
  app: App;
}

const api = start(renderToDOM, { decorateStory, render });

export const storiesOf: ClientApi['storiesOf'] = (kind, m) => {
  return (api.clientApi.storiesOf(kind, m) as ReturnType<ClientApi['storiesOf']>).addParameters({
    framework: FRAMEWORK,
  });
};

export const configure: ClientApi['configure'] = (...args) => api.configure(FRAMEWORK, ...args);
export const { addDecorator } = api.clientApi;
export const { addParameters } = api.clientApi;
export const { clearDecorators } = api.clientApi;
export const { setAddon } = api.clientApi;
export const { forceReRender } = api;
export const { getStorybook } = api.clientApi;
export const { raw } = api.clientApi;
export { setup } from './render';
