import { types, Addon } from '@storybook/addons';
import { API, State } from '@storybook/api';
import { PreviewProps } from './utils/types';

export const previewProps: PreviewProps = {
  id: 'string',
  storyId: 'story--id',
  api: {
    on: () => {},
    emit: () => {},
    off: () => {},
    getElements: ((type) =>
      type === types.TAB
        ? [
            {
              id: 'notes',
              type: types.TAB,
              title: 'Notes',
              route: ({ storyId }) => `/info/${storyId}`,
              match: ({ viewMode }) => viewMode === 'info',
              render: () => null,
            } as Addon,
          ]
        : []) as API['getElements'],
  } as any as API,
  story: {
    type: 'story',
    id: 'story--id',
    parent: 'root',
    depth: 1,
    title: 'kind',
    name: 'story name',
    importPath: './story.stories.tsx',
    prepared: true,
    parameters: {
      fileName: '',
      options: {},
      docsOnly: false,
    },
    args: {},
  },
  path: 'string',
  viewMode: 'story',
  location: {} as any as State['location'],
  baseUrl: 'http://example.com',
  queryParams: {},
  options: {
    isFullscreen: false,
    showTabs: true,
    showToolbar: true,
  },
  withLoader: false,
  docsOnly: false,
  description: '',
  refs: {},
};
