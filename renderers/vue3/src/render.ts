import { dedent } from 'ts-dedent';
import { createApp, h } from 'vue';
import type { RenderContext } from '@storybook/store';
import type { ArgsStoryFn } from '@storybook/csf';

import { StoryFnVueReturnType, VueFramework } from './types';

export const render: ArgsStoryFn<VueFramework> = (props, context) => {
  const { id, component: Component } = context;
  if (!Component) {
    throw new Error(
      `Unable to render story ${id} as the component annotation is missing from the default export`
    );
  }

  // TODO remove this hack
  return h(Component as Parameters<typeof h>[0], props);
};

let setupFunction = (app: any) => {};
export const setup = (fn: (app: any) => void) => {
  setupFunction = fn;
};

const map = new Map<Element, ReturnType<typeof createApp>>();

export function renderToDOM(
  { title, name, storyFn, showMain, showError, showException }: RenderContext<VueFramework>,
  domElement: Element
) {
  // TODO: explain cyclical nature of these app => story => mount
  let element: StoryFnVueReturnType;
  const storybookApp = createApp({
    unmounted() {
      map.delete(domElement);
    },
    render() {
      map.set(domElement, storybookApp);
      setupFunction(storybookApp);
      return h(element);
    },
  });
  storybookApp.config.errorHandler = showException;
  element = storyFn();

  if (!element) {
    showError({
      title: `Expecting a Vue component from the story: "${name}" of "${title}".`,
      description: dedent`
      Did you forget to return the Vue component from the story?
      Use "() => ({ template: '<my-comp></my-comp>' })" or "() => ({ components: MyComp, template: '<my-comp></my-comp>' })" when defining the story.
      `,
    });
    return;
  }

  showMain();

  if (map.has(domElement)) {
    map.get(domElement).unmount(domElement);
  }

  storybookApp.mount(domElement);
}
