import React from 'react';
import type { FunctionComponent, ComponentType } from 'react';
import type { AnyFramework, Parameters } from '@storybook/csf';
import type { Theme } from '@storybook/theming';

import type { DocsContextProps } from './DocsContext';
import { DocsContainer } from './DocsContainer';
import { DocsPage } from './DocsPage';

export type DocsProps<TFramework extends AnyFramework = AnyFramework> = {
  parameters: Parameters;
  context: DocsContextProps<TFramework>;
};

export const Docs: FunctionComponent<DocsProps> = ({ parameters, context }) => {
  const Container: ComponentType<{ context: DocsContextProps; theme: Theme }> =
    parameters.container || DocsContainer;

  const Page = parameters.page || DocsPage;

  return (
    <Container context={context} theme={parameters.theme}>
      <Page />
    </Container>
  );
};
