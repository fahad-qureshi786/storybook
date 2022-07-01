import React from 'react';

import { ThemeProvider, themes, ensure } from '@storybook/theming';
import { DocsContextProps } from '@storybook/preview-web';
import { ModuleExport, ModuleExports, Story } from '@storybook/store';
import { AnyFramework, StoryId } from '@storybook/csf';

import { DocsContext } from './DocsContext';
import { ExternalPreview } from './ExternalPreview';

let preview: ExternalPreview<AnyFramework>;

export const ExternalDocsContainer: React.FC<{ projectAnnotations: any }> = ({
  projectAnnotations,
  children,
}) => {
  if (!preview) preview = new ExternalPreview(projectAnnotations);

  let pageMeta: ModuleExport;
  const setMeta = (m: ModuleExport) => {
    pageMeta = m;
  };

  const docsContext: DocsContextProps = {
    type: 'external',

    id: 'external-docs',
    title: 'External',
    name: 'Docs',

    storyIdByModuleExport: (storyExport: ModuleExport, metaExport: ModuleExports) => {
      return preview.storyIdByModuleExport(storyExport, metaExport || pageMeta);
    },

    storyById: (id: StoryId) => {
      return preview.storyById(id);
    },

    getStoryContext: () => {
      throw new Error('not implemented');
    },

    componentStories: () => {
      // TODO: could implement in a very similar way to in DocsRender. (TODO: How to share code?)
      throw new Error('not implemented');
    },

    loadStory: async (id: StoryId) => {
      return preview.storyById(id);
    },

    renderStoryToElement: (story: Story<AnyFramework>, element: HTMLElement) => {
      return preview.renderStoryToElement(story, element);
    },

    setMeta,
  };

  return (
    <DocsContext.Provider value={docsContext}>
      <ThemeProvider theme={ensure(themes.light)}>{children}</ThemeProvider>
    </DocsContext.Provider>
  );
};
