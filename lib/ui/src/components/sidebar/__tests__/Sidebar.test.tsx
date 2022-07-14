import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, ensure, themes } from '@storybook/theming';

import type { HashEntry, StoriesHash, Refs } from '@storybook/api';
import type { Theme } from '@storybook/theming';
import type { RenderResult } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import type { SidebarProps } from '../Sidebar';

global.DOCS_MODE = false;

const DOCS_NAME = 'Docs';

const factory = (props: Partial<SidebarProps>): RenderResult => {
  const theme: Theme = ensure(themes.light);

  return render(
    <ThemeProvider theme={theme}>
      <Sidebar storiesConfigured menu={[]} stories={{}} refs={{}} {...props} />
    </ThemeProvider>
  );
};

const generateStories = ({ title, refId }: { title: string; refId?: string }): StoriesHash => {
  const [root, componentName]: [string, string] = title.split('/') as any;
  const rootId: string = root.toLowerCase().replace(/\s+/g, '-');
  const hypenatedComponentName: string = componentName.toLowerCase().replace(/\s+/g, '-');
  const componentId = `${rootId}-${hypenatedComponentName}`;
  const docsId = `${rootId}-${hypenatedComponentName}--docs`;

  const storyBase: HashEntry[] = [
    {
      type: 'root',
      id: rootId,
      depth: 0,
      refId,
      name: root,
      children: [componentId],
      startCollapsed: false,
    },
    {
      type: 'component',
      id: componentId,
      depth: 1,
      refId,
      name: componentName,
      children: [docsId],
      parent: rootId,
    },
    {
      type: 'docs',
      id: docsId,
      depth: 2,
      refId,
      name: DOCS_NAME,
      title,
      parent: componentId,
      importPath: './docs.js',
    },
  ];

  return storyBase.reduce((accumulator: StoriesHash, current: HashEntry): StoriesHash => {
    accumulator[current.id] = current;
    return accumulator;
  }, {});
};

describe('Sidebar', () => {
  test.skip("should not render an extra nested 'Page'", async () => {
    const refId = 'next';
    const title = 'Getting Started/Install';
    const refStories: StoriesHash = generateStories({ refId, title });
    const internalStories: StoriesHash = generateStories({ title: 'Welcome/Example' });

    const refs: Refs = {
      [refId]: {
        stories: refStories,
        id: refId,
        ready: true,
        title: refId,
        url: 'https://ref.url',
      },
    };

    factory({
      refs,
      refId,
      stories: internalStories,
    });

    fireEvent.click(screen.getByText('Install'));
    fireEvent.click(screen.getByText('Example'));

    const pageItems: HTMLElement[] = await screen.queryAllByText('Page');

    expect(pageItems).toHaveLength(0);
  });
});
