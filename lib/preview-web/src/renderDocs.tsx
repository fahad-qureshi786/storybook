import React, { ComponentType } from 'react';
import ReactDOM from 'react-dom';
import { AnyFramework } from '@storybook/csf';
import { Story } from '@storybook/store';
import { CacheProvider, createCache } from '@storybook/theming';

import { DocsContextProps } from './types';
import { NoDocs } from './NoDocs';

const emotionCache = createCache({ key: 'pr' });
emotionCache.compat = true;

export function renderDocs<TFramework extends AnyFramework>(
  story: Story<TFramework>,
  docsContext: DocsContextProps<TFramework>,
  element: HTMLElement,
  callback: () => void
) {
  return renderDocsAsync(story, docsContext, element).then(callback);
}

async function renderDocsAsync<TFramework extends AnyFramework>(
  story: Story<TFramework>,
  docsContext: DocsContextProps<TFramework>,
  element: HTMLElement
) {
  const { docs } = story.parameters;
  if ((docs?.getPage || docs?.page) && !(docs?.getContainer || docs?.container)) {
    throw new Error('No `docs.container` set, did you run `addon-docs/preset`?');
  }

  const DocsContainer: ComponentType<{ context: DocsContextProps<TFramework> }> =
    docs.container ||
    (await docs.getContainer?.()) ||
    (({ children }: { children: Element }) => <>{children}</>);

  const Page: ComponentType = docs.page || (await docs.getPage?.()) || NoDocs;

  // Use `componentId` as a key so that we force a re-render every time
  // we switch components
  const docsElement = (
    <CacheProvider value={emotionCache}>
      <DocsContainer key={story.componentId} context={docsContext}>
        <Page />
      </DocsContainer>
    </CacheProvider>
  );

  await new Promise<void>((resolve) => {
    ReactDOM.render(docsElement, element, resolve);
  });
}

export function unmountDocs(element: HTMLElement) {
  ReactDOM.unmountComponentAtNode(element);
}
