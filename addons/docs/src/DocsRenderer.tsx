import React from 'react';
import ReactDOM from 'react-dom';
import { AnyFramework, Parameters } from '@storybook/csf';
import { DocsContextProps, DocsRenderFunction } from '@storybook/preview-web';
import { components as htmlComponents } from '@storybook/components';
import { Docs, CodeOrSourceMdx, AnchorMdx, HeadersMdx } from '@storybook/blocks';
import { MDXProvider } from '@mdx-js/react';

const defaultComponents = {
  ...htmlComponents,
  code: CodeOrSourceMdx,
  a: AnchorMdx,
  ...HeadersMdx,
};

export class DocsRenderer<TFramework extends AnyFramework> {
  public render: DocsRenderFunction<TFramework>;

  public unmount: (element: HTMLElement) => void;

  constructor() {
    this.render = (
      context: DocsContextProps<TFramework>,
      parameters: Parameters,
      element: HTMLElement,
      callback: () => void
    ): void => {
      // Use a random key to force the container to re-render each time we call `renderDocs`
      //   TODO: do we still need this? It was needed for angular (legacy) inline rendering:
      //   https://github.com/storybookjs/storybook/pull/16149
      ReactDOM.render(
        <MDXProvider components={defaultComponents}>
          <Docs key={Math.random()} context={context} parameters={parameters} />
        </MDXProvider>,
        element,
        callback
      );
    };

    this.unmount = (element: HTMLElement) => {
      ReactDOM.unmountComponentAtNode(element);
    };
  }
}
