import { FunctionComponent, ReactNode } from 'react';
import { State, API, DocsEntry, StoryEntry } from '@storybook/api';

export type ViewMode = State['viewMode'];

export interface PreviewProps {
  api: API;
  viewMode: ViewMode;
  refs: State['refs'];
  storyId: StoryEntry['id'];
  story: DocsEntry | StoryEntry;
  docsOnly: boolean;
  options: {
    isFullscreen: boolean;
    showTabs: boolean;
    showToolbar: boolean;
  };
  id: string;
  path: string;
  location: State['location'];
  queryParams: State['customQueryParams'];
  customCanvas?: CustomCanvasRenderer;
  description: string;
  baseUrl: string;
  withLoader: boolean;
}

export interface WrapperProps {
  index: number;
  children: ReactNode;
  id: string;
  storyId: string;
  active: boolean;
}

export interface Wrapper {
  render: FunctionComponent<WrapperProps>;
}

export interface ApplyWrappersProps {
  wrappers: Wrapper[];
  viewMode: State['viewMode'];
  id: string;
  storyId: string;
  active: boolean;
}

export type CustomCanvasRenderer = (
  storyId: string,
  viewMode: State['viewMode'],
  id: string,
  baseUrl: string,
  scale: number,
  queryParams: Record<string, any>
) => ReactNode;

export interface FramesRendererProps {
  story: DocsEntry | StoryEntry;
  storyId: string;
  refId: string;
  baseUrl: string;
  scale: number;
  viewMode: ViewMode;
  queryParams: State['customQueryParams'];
  refs: State['refs'];
}
