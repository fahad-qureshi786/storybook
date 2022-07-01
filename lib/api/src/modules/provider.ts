import type { ReactNode } from 'react';
import { Channel } from '@storybook/channels';
import type { ThemeVars } from '@storybook/theming';

import type { API, State, ModuleFn, HashEntry } from '../index';
import type { StoryMapper, Refs } from './refs';
import type { UIOptions } from './layout';

interface SidebarOptions {
  showRoots?: boolean;
  collapsedRoots?: string[];
  renderLabel?: (item: HashEntry) => ReactNode;
}

type IframeRenderer = (
  storyId: string,
  viewMode: State['viewMode'],
  id: string,
  baseUrl: string,
  scale: number,
  queryParams: Record<string, any>
) => ReactNode;

export interface Provider {
  channel?: Channel;
  serverChannel?: Channel;
  renderPreview?: IframeRenderer;
  handleAPI(api: API): void;
  getConfig(): {
    sidebar?: SidebarOptions;
    theme?: ThemeVars;
    refs?: Refs;
    StoryMapper?: StoryMapper;
    [k: string]: any;
  } & Partial<UIOptions>;
  [key: string]: any;
}

export interface SubAPI {
  renderPreview?: Provider['renderPreview'];
}

export const init: ModuleFn<SubAPI, {}, true> = ({ provider, fullAPI }) => {
  return {
    api: provider.renderPreview ? { renderPreview: provider.renderPreview } : {},
    state: {},
    init: () => {
      provider.handleAPI(fullAPI);
    },
  };
};
