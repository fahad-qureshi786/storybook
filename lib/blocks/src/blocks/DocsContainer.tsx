import React, { FunctionComponent, useEffect } from 'react';
import global from 'global';
import deprecate from 'util-deprecate';
import { dedent } from 'ts-dedent';
import { MDXProvider } from '@mdx-js/react';
import { ThemeProvider, ensure as ensureTheme } from '@storybook/theming';
import { components as htmlComponents } from '@storybook/components';
import { AnyFramework } from '@storybook/csf';
import { DocsWrapper, DocsContent } from '../components';
import { DocsContextProps, DocsContext } from './DocsContext';
import { SourceContainer } from './SourceContainer';
import { CodeOrSourceMdx, AnchorMdx, HeadersMdx } from './mdx';
import { scrollToElement } from './utils';

const { document, window: globalWindow } = global;

export interface DocsContainerProps<TFramework extends AnyFramework = AnyFramework> {
  context: DocsContextProps<TFramework>;
}

const defaultComponents = {
  ...htmlComponents,
  code: CodeOrSourceMdx,
  a: AnchorMdx,
  ...HeadersMdx,
};

const warnOptionsTheme = deprecate(
  () => {},
  dedent`
    Deprecated parameter: options.theme => docs.theme

    https://github.com/storybookjs/storybook/blob/next/addons/docs/docs/theming.md#storybook-theming
`
);

export const DocsContainer: FunctionComponent<DocsContainerProps> = ({ context, children }) => {
  const { storyById } = context;
  const allComponents = { ...defaultComponents };
  let theme = ensureTheme(null);
  try {
    const {
      parameters: { options = {}, docs = {} },
    } = storyById();
    let themeVars = docs.theme;
    if (!themeVars && options.theme) {
      warnOptionsTheme();
      themeVars = options.theme;
    }
    theme = ensureTheme(themeVars);
    Object.assign(allComponents, docs.components);
  } catch (err) {
    // No primary story, ie. standalone docs
  }

  useEffect(() => {
    let url;
    try {
      url = new URL(globalWindow.parent.location);
      if (url.hash) {
        const element = document.getElementById(url.hash.substring(1));
        if (element) {
          // Introducing a delay to ensure scrolling works when it's a full refresh.
          setTimeout(() => {
            scrollToElement(element);
          }, 200);
        }
      }
    } catch (err) {
      // pass
    }
  });

  return (
    <DocsContext.Provider value={context}>
      <SourceContainer>
        <ThemeProvider theme={theme}>
          <MDXProvider components={allComponents}>
            <DocsWrapper className="sbdocs sbdocs-wrapper">
              <DocsContent className="sbdocs sbdocs-content">{children}</DocsContent>
            </DocsWrapper>
          </MDXProvider>
        </ThemeProvider>
      </SourceContainer>
    </DocsContext.Provider>
  );
};
