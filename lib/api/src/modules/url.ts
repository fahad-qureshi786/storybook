import {
  NAVIGATE_URL,
  STORY_ARGS_UPDATED,
  SET_CURRENT_STORY,
  GLOBALS_UPDATED,
  UPDATE_QUERY_PARAMS,
} from '@storybook/core-events';
import type { NavigateOptions } from '@storybook/router';
import { queryFromLocation, buildArgsParam } from '@storybook/router';
import deepEqual from 'fast-deep-equal';
import global from 'global';

import { ModuleArgs, ModuleFn } from '../index';
import { Layout, UI } from './layout';

const { window: globalWindow } = global;

export interface SubState {
  customQueryParams: QueryParams;
}

const parseBoolean = (value: string) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
};

// Initialize the state based on the URL.
// NOTE:
//   Although we don't change the URL when you change the state, we do support setting initial state
//   via the following URL parameters:
//     - full: 0/1 -- show fullscreen
//     - panel: bottom/right/0 -- set addons panel position (or hide)
//     - nav: 0/1 -- show or hide the story list
//
//   We also support legacy URLs from storybook <5
let prevParams: ReturnType<typeof queryFromLocation>;
const initialUrlSupport = ({
  state: { location, path, viewMode, storyId },
  singleStory,
}: ModuleArgs) => {
  const {
    full,
    panel,
    nav,
    shortcuts,
    addonPanel,
    tabs,
    addons, // deprecated
    panelRight, // deprecated
    stories, // deprecated
    selectedKind, // deprecated
    selectedStory, // deprecated
    path: queryPath,
    ...otherParams // the rest gets passed to the iframe
  } = queryFromLocation(location);

  const layout: Partial<Layout> = {
    isFullscreen: parseBoolean(full),
    showNav: !singleStory && parseBoolean(nav),
    showPanel: parseBoolean(panel),
    panelPosition: ['right', 'bottom'].includes(panel) ? panel : undefined,
    showTabs: parseBoolean(tabs),
  };
  const ui: Partial<UI> = {
    enableShortcuts: parseBoolean(shortcuts),
  };
  const selectedPanel = addonPanel || undefined;

  // Avoid returning a new object each time if no params actually changed.
  const customQueryParams = deepEqual(prevParams, otherParams) ? prevParams : otherParams;
  prevParams = customQueryParams;

  return { viewMode, layout, ui, selectedPanel, location, path, customQueryParams, storyId };
};

export interface QueryParams {
  [key: string]: string | null;
}

export interface SubAPI {
  navigateUrl: (url: string, options: NavigateOptions) => void;
  getQueryParam: (key: string) => string | undefined;
  getUrlState: () => {
    queryParams: QueryParams;
    path: string;
    viewMode?: string;
    storyId?: string;
    url: string;
  };
  setQueryParams: (input: QueryParams) => void;
}

export const init: ModuleFn = ({ store, navigate, state, provider, fullAPI, ...rest }) => {
  const navigateTo = (path: string, queryParams: Record<string, string> = {}, options = {}) => {
    const params = Object.entries(queryParams)
      .filter(([, v]) => v)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => `${k}=${v}`);
    const to = [path, ...params].join('&');
    return navigate(to, options);
  };

  const api: SubAPI = {
    getQueryParam(key) {
      const { customQueryParams } = store.getState();
      return customQueryParams ? customQueryParams[key] : undefined;
    },
    getUrlState() {
      const { path, customQueryParams, storyId, url, viewMode } = store.getState();
      return { path, queryParams: customQueryParams, storyId, url, viewMode };
    },
    setQueryParams(input) {
      const { customQueryParams } = store.getState();
      const queryParams: QueryParams = {};
      const update = {
        ...customQueryParams,
        ...Object.entries(input).reduce((acc, [key, value]) => {
          if (value !== null) {
            acc[key] = value;
          }
          return acc;
        }, queryParams),
      };
      if (!deepEqual(customQueryParams, update)) {
        store.setState({ customQueryParams: update });
        fullAPI.emit(UPDATE_QUERY_PARAMS, update);
      }
    },
    navigateUrl(url, options) {
      navigate(url, { ...options, plain: true });
    },
  };

  const initModule = () => {
    // Sets `args` parameter in URL, omitting any args that have their initial value or cannot be unserialized safely.
    const updateArgsParam = () => {
      const { path, queryParams, viewMode } = fullAPI.getUrlState();
      if (viewMode !== 'story') return;

      const currentStory = fullAPI.getCurrentStoryData();
      if (currentStory?.type !== 'story') return;

      const { args, initialArgs } = currentStory;
      const argsString = buildArgsParam(initialArgs, args);
      navigateTo(path, { ...queryParams, args: argsString }, { replace: true });
      api.setQueryParams({ args: argsString });
    };

    fullAPI.on(SET_CURRENT_STORY, () => updateArgsParam());

    let handleOrId: any;
    fullAPI.on(STORY_ARGS_UPDATED, () => {
      if ('requestIdleCallback' in globalWindow) {
        if (handleOrId) globalWindow.cancelIdleCallback(handleOrId);
        handleOrId = globalWindow.requestIdleCallback(updateArgsParam, { timeout: 1000 });
      } else {
        if (handleOrId) clearTimeout(handleOrId);
        setTimeout(updateArgsParam, 100);
      }
    });

    fullAPI.on(GLOBALS_UPDATED, ({ globals, initialGlobals }) => {
      const { path, queryParams } = fullAPI.getUrlState();
      const globalsString = buildArgsParam(initialGlobals, globals);
      navigateTo(path, { ...queryParams, globals: globalsString }, { replace: true });
      api.setQueryParams({ globals: globalsString });
    });

    fullAPI.on(NAVIGATE_URL, (url: string, options: NavigateOptions) => {
      fullAPI.navigateUrl(url, options);
    });

    if (fullAPI.showReleaseNotesOnLaunch()) {
      navigate('/settings/release-notes');
    }
  };

  return {
    api,
    state: initialUrlSupport({ store, navigate, state, provider, fullAPI, ...rest }),
    init: initModule,
  };
};
