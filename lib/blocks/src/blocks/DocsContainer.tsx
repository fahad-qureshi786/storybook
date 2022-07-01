import React, { FunctionComponent, useEffect } from 'react';
import global from 'global';
import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import { MDXProvider } from '@mdx-js/react';
import { ThemeProvider, ensure as ensureTheme } from '@storybook/theming';
import { components as htmlComponents } from '@storybook/components';
import { AnyFramework } from '@storybook/csf';
import { DocsWrapper, DocsContent } from '../components';
import { DocsContextProps, DocsContext } from './DocsContext';
import { anchorBlockIdFromId } from './Anchor';
import { storyBlockIdFromId } from './Story';
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
  const { id: storyId, type, storyById } = context;
  const allComponents = { ...defaultComponents };
  let theme = ensureTheme(null);
  if (type === 'legacy') {
    const {
      parameters: { options = {}, docs = {} },
    } = storyById(storyId);
    let themeVars = docs.theme;
    if (!themeVars && options.theme) {
      warnOptionsTheme();
      themeVars = options.theme;
    }
    theme = ensureTheme(themeVars);
    Object.assign(allComponents, docs.components);
  }

  useEffect(() => {
    let url;
    try {
      url = new URL(globalWindow.parent.location);
    } catch (err) {
      return;
    }
    if (url.hash) {
      const element = document.getElementById(url.hash.substring(1));
      if (element) {
        // Introducing a delay to ensure scrolling works when it's a full refresh.
        setTimeout(() => {
          scrollToElement(element);
        }, 200);
      }
    } else {
      const element =
        document.getElementById(anchorBlockIdFromId(storyId)) ||
        document.getElementById(storyBlockIdFromId(storyId));
      if (element) {
        const allStories = element.parentElement.querySelectorAll('[id|="anchor-"]');
        let scrollTarget = element;
        if (allStories && allStories[0] === element) {
          // Include content above first story
          scrollTarget = document.getElementById('docs-root');
        }
        // Introducing a delay to ensure scrolling works when it's a full refresh.
        setTimeout(() => {
          scrollToElement(scrollTarget, 'start');
        }, 200);
      }
    }
  }, [storyId]);

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
