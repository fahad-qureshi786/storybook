import type { ReactElement } from 'react';
import type { RenderData } from '@storybook/router';
import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';

import { ModuleFn } from '../index';
import { Options } from '../store';

const warnDisabledDeprecated = deprecate(
  () => {},
  dedent`
    Use 'parameters.key.disable' instead of 'parameters.key.disabled'.
    
    https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-disabled-parameter
  `
);

export type ViewMode = 'story' | 'info' | 'settings' | 'page' | undefined | string;

export enum types {
  TAB = 'tab',
  PANEL = 'panel',
  TOOL = 'tool',
  PREVIEW = 'preview',
  NOTES_ELEMENT = 'notes-element',
}

export type Types = types | string;
export interface RenderOptions {
  active: boolean;
  key: string;
}

export interface RouteOptions {
  storyId: string;
  viewMode: ViewMode;
  location: RenderData['location'];
  path: string;
}
export interface MatchOptions {
  storyId: string;
  viewMode: ViewMode;
  location: RenderData['location'];
  path: string;
}

export interface Addon {
  title: string;
  type?: Types;
  id?: string;
  route?: (routeOptions: RouteOptions) => string;
  match?: (matchOptions: MatchOptions) => boolean;
  render: (renderOptions: RenderOptions) => ReactElement<any>;
  paramKey?: string;
  disabled?: boolean;
  hidden?: boolean;
}
export interface Collection<T = Addon> {
  [key: string]: T;
}

type Panels = Collection<Addon>;

type StateMerger<S> = (input: S) => S;

export interface SubState {
  selectedPanel: string;
  addons: Record<string, never>;
}

export interface SubAPI {
  getElements: <T>(type: Types) => Collection<T>;
  getPanels: () => Panels;
  getStoryPanels: () => Panels;
  getSelectedPanel: () => string;
  setSelectedPanel: (panelName: string) => void;
  setAddonState<S>(
    addonId: string,
    newStateOrMerger: S | StateMerger<S>,
    options?: Options
  ): Promise<S>;
  getAddonState<S>(addonId: string): S;
}

export function ensurePanel(panels: Panels, selectedPanel?: string, currentPanel?: string) {
  const keys = Object.keys(panels);

  if (keys.indexOf(selectedPanel) >= 0) {
    return selectedPanel;
  }

  if (keys.length) {
    return keys[0];
  }
  return currentPanel;
}

export const init: ModuleFn<SubAPI, SubState> = ({ provider, store, fullAPI }) => {
  const api: SubAPI = {
    getElements: (type) => provider.getElements(type),
    getPanels: () => api.getElements(types.PANEL),
    getStoryPanels: () => {
      const allPanels = api.getPanels();
      const { storyId } = store.getState();
      const story = fullAPI.getData(storyId);

      if (!allPanels || !story || story.type !== 'story') {
        return allPanels;
      }

      const { parameters } = story;

      const filteredPanels: Collection = {};
      Object.entries(allPanels).forEach(([id, panel]) => {
        const { paramKey } = panel;
        if (
          paramKey &&
          parameters &&
          parameters[paramKey] &&
          (parameters[paramKey].disabled || parameters[paramKey].disable)
        ) {
          if (parameters[paramKey].disabled) {
            warnDisabledDeprecated();
          }
          return;
        }
        filteredPanels[id] = panel;
      });

      return filteredPanels;
    },
    getSelectedPanel: () => {
      const { selectedPanel } = store.getState();
      return ensurePanel(api.getPanels(), selectedPanel, selectedPanel);
    },
    setSelectedPanel: (panelName) => {
      store.setState({ selectedPanel: panelName }, { persistence: 'session' });
    },
    setAddonState<S>(
      addonId: string,
      newStateOrMerger: S | StateMerger<S>,
      options?: Options
    ): Promise<S> {
      let nextState;
      const { addons: existing } = store.getState();
      if (typeof newStateOrMerger === 'function') {
        const merger = newStateOrMerger as StateMerger<S>;
        nextState = merger(api.getAddonState<S>(addonId));
      } else {
        nextState = newStateOrMerger;
      }
      return store
        .setState({ addons: { ...existing, [addonId]: nextState } }, options)
        .then(() => api.getAddonState(addonId));
    },
    getAddonState: (addonId) => {
      return store.getState().addons[addonId];
    },
  };

  return {
    api,
    state: {
      selectedPanel: ensurePanel(api.getPanels(), store.getState().selectedPanel),
      addons: {},
    },
  };
};
