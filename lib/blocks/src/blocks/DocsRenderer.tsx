import React, { ComponentType } from 'react';
import ReactDOM from 'react-dom';
import { AnyFramework, Parameters } from '@storybook/csf';
import { DocsRenderFunction } from '@storybook/preview-web';

import { DocsContainer } from './DocsContainer';
import { DocsPage } from './DocsPage';
import { DocsContextProps } from './DocsContext';

export class DocsRenderer<TFramework extends AnyFramework> {
  public render: DocsRenderFunction<TFramework>;

  public unmount: (element: HTMLElement) => void;

  constructor() {
    this.render = (
      docsContext: DocsContextProps<TFramework>,
      docsParameters: Parameters,
      element: HTMLElement,
      callback: () => void
    ): void => {
      renderDocsAsync(docsContext, docsParameters, element).then(callback);
    };

    this.unmount = (element: HTMLElement) => {
      ReactDOM.unmountComponentAtNode(element);
    };
  }
}

async function renderDocsAsync<TFramework extends AnyFramework>(
  docsContext: DocsContextProps<TFramework>,
  docsParameters: Parameters,
  element: HTMLElement
) {
  const Container: ComponentType<{ context: DocsContextProps<TFramework> }> =
    docsParameters.container || (await docsParameters.getContainer?.()) || DocsContainer;

  const Page: ComponentType = docsParameters.page || (await docsParameters.getPage?.()) || DocsPage;

  // Use a random key to force the container to re-render each time we call `renderDocs`
  //   TODO: do we still need this? It was needed for angular (legacy) inline rendering:
  //   https://github.com/storybookjs/storybook/pull/16149
  const docsElement = (
    <Container key={Math.random()} context={docsContext}>
      <Page />
    </Container>
  );

  await new Promise<void>((resolve) => {
    ReactDOM.render(docsElement, element, resolve);
  });
}
