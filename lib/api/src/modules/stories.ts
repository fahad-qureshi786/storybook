import global from 'global';
import { toId, sanitize } from '@storybook/csf';
import {
  PRELOAD_STORIES,
  STORY_PREPARED,
  UPDATE_STORY_ARGS,
  RESET_STORY_ARGS,
  STORY_ARGS_UPDATED,
  STORY_CHANGED,
  SELECT_STORY,
  SET_STORIES,
  STORY_SPECIFIED,
  STORY_INDEX_INVALIDATED,
  CONFIG_ERROR,
} from '@storybook/core-events';
import deprecate from 'util-deprecate';
import { logger } from '@storybook/client-logger';

import { getEventMetadata } from '../lib/events';
import {
  denormalizeStoryParameters,
  transformSetStoriesStoryDataToStoriesHash,
  transformStoryIndexToStoriesHash,
  getComponentLookupList,
  getStoriesLookupList,
  HashEntry,
  DocsEntry,
} from '../lib/stories';

import type {
  StoriesHash,
  StoryEntry,
  StoryId,
  SetStoriesStoryData,
  SetStoriesPayload,
  StoryIndex,
} from '../lib/stories';

import type { Args, ModuleFn } from '../index';
import type { ComposedRef } from './refs';

const { DOCS_MODE, FEATURES, fetch } = global;
const STORY_INDEX_PATH = './index.json';

type Direction = -1 | 1;
type ParameterName = string;

type ViewMode = 'story' | 'info' | 'settings' | string | undefined;
type StoryUpdate = Pick<StoryEntry, 'parameters' | 'initialArgs' | 'argTypes' | 'args'>;

export interface SubState {
  storiesHash: StoriesHash;
  storyId: StoryId;
  viewMode: ViewMode;
  storiesConfigured: boolean;
  storiesFailed?: Error;
}

export interface SubAPI {
  storyId: typeof toId;
  resolveStory: (storyId: StoryId, refsId?: string) => HashEntry;
  selectFirstStory: () => void;
  selectStory: (
    kindOrId?: string,
    story?: string,
    obj?: { ref?: string; viewMode?: ViewMode }
  ) => void;
  getCurrentStoryData: () => DocsEntry | StoryEntry;
  setStories: (stories: SetStoriesStoryData, failed?: Error) => Promise<void>;
  jumpToComponent: (direction: Direction) => void;
  jumpToStory: (direction: Direction) => void;
  getData: (storyId: StoryId, refId?: string) => DocsEntry | StoryEntry;
  isPrepared: (storyId: StoryId, refId?: string) => boolean;
  getParameters: (
    storyId: StoryId | { storyId: StoryId; refId: string },
    parameterName?: ParameterName
  ) => StoryEntry['parameters'] | any;
  getCurrentParameter<S>(parameterName?: ParameterName): S;
  updateStoryArgs(story: StoryEntry, newArgs: Args): void;
  resetStoryArgs: (story: StoryEntry, argNames?: string[]) => void;
  findLeafEntry(StoriesHash: StoriesHash, storyId: StoryId): DocsEntry | StoryEntry;
  findLeafStoryId(StoriesHash: StoriesHash, storyId: StoryId): StoryId;
  findSiblingStoryId(
    storyId: StoryId,
    hash: StoriesHash,
    direction: Direction,
    toSiblingGroup: boolean // when true, skip over leafs within the same group
  ): StoryId;
  fetchStoryList: () => Promise<void>;
  setStoryList: (storyList: StoryIndex) => Promise<void>;
  updateStory: (storyId: StoryId, update: StoryUpdate, ref?: ComposedRef) => Promise<void>;
}

const deprecatedOptionsParameterWarnings: Record<string, () => void> = [
  'enableShortcuts',
  'theme',
  'showRoots',
].reduce((acc, option: string) => {
  acc[option] = deprecate(
    () => {},
    `parameters.options.${option} is deprecated and will be removed in Storybook 7.0.
To change this setting, use \`addons.setConfig\`. See https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#deprecated-immutable-options-parameters
  `
  );
  return acc;
}, {} as Record<string, () => void>);
function checkDeprecatedOptionParameters(options?: Record<string, any>) {
  if (!options) {
    return;
  }
  Object.keys(options).forEach((option: string) => {
    if (deprecatedOptionsParameterWarnings[option]) {
      deprecatedOptionsParameterWarnings[option]();
    }
  });
}

export const init: ModuleFn<SubAPI, SubState, true> = ({
  fullAPI,
  store,
  navigate,
  provider,
  storyId: initialStoryId,
  viewMode: initialViewMode,
}) => {
  const api: SubAPI = {
    storyId: toId,
    getData: (storyId, refId) => {
      const result = api.resolveStory(storyId, refId);
      if (result?.type === 'story' || result?.type === 'docs') {
        return result;
      }
      return undefined;
    },
    isPrepared: (storyId, refId) => {
      const data = api.getData(storyId, refId);
      return data.type === 'story' ? data.prepared : true;
    },
    resolveStory: (storyId, refId) => {
      const { refs, storiesHash } = store.getState();
      if (refId) {
        return refs[refId].stories ? refs[refId].stories[storyId] : undefined;
      }
      return storiesHash ? storiesHash[storyId] : undefined;
    },
    getCurrentStoryData: () => {
      const { storyId, refId } = store.getState();

      return api.getData(storyId, refId);
    },
    getParameters: (storyIdOrCombo, parameterName) => {
      const { storyId, refId } =
        typeof storyIdOrCombo === 'string'
          ? { storyId: storyIdOrCombo, refId: undefined }
          : storyIdOrCombo;
      const data = api.getData(storyId, refId);

      if (data?.type === 'story') {
        const { parameters } = data;

        if (parameters) {
          return parameterName ? parameters[parameterName] : parameters;
        }

        return {};
      }

      return null;
    },
    getCurrentParameter: (parameterName) => {
      const { storyId, refId } = store.getState();
      const parameters = api.getParameters({ storyId, refId }, parameterName);
      // FIXME Returning falsey parameters breaks a bunch of toolbars code,
      // so this strange logic needs to be here until various client code is updated.
      return parameters || undefined;
    },
    jumpToComponent: (direction) => {
      const { storiesHash, storyId, refs, refId } = store.getState();
      const story = api.getData(storyId, refId);

      // cannot navigate when there's no current selection
      if (!story) {
        return;
      }

      const hash = refId ? refs[refId].stories || {} : storiesHash;
      const result = api.findSiblingStoryId(storyId, hash, direction, true);

      if (result) {
        api.selectStory(result, undefined, { ref: refId });
      }
    },
    jumpToStory: (direction) => {
      const { storiesHash, storyId, refs, refId } = store.getState();
      const story = api.getData(storyId, refId);

      if (DOCS_MODE) {
        api.jumpToComponent(direction);
        return;
      }

      // cannot navigate when there's no current selection
      if (!story) {
        return;
      }

      const hash = story.refId ? refs[story.refId].stories : storiesHash;
      const result = api.findSiblingStoryId(storyId, hash, direction, false);

      if (result) {
        api.selectStory(result, undefined, { ref: refId });
      }
    },
    setStories: async (input, error) => {
      // Now create storiesHash by reordering the above by group
      const hash = transformSetStoriesStoryDataToStoriesHash(input, {
        provider,
      });

      await store.setState({
        storiesHash: hash,
        storiesConfigured: true,
        storiesFailed: error,
      });
    },
    selectFirstStory: () => {
      const { storiesHash } = store.getState();
      const firstStory = Object.keys(storiesHash).find((id) => storiesHash[id].type === 'story');

      if (firstStory) {
        api.selectStory(firstStory);
        return;
      }

      navigate('/');
    },
    selectStory: (titleOrId = undefined, name = undefined, options = {}) => {
      const { ref, viewMode: viewModeFromArgs } = options;
      const {
        viewMode: viewModeFromState = 'story',
        storyId,
        storiesHash,
        refs,
      } = store.getState();

      const hash = ref ? refs[ref].stories : storiesHash;

      const kindSlug = storyId?.split('--', 2)[0];

      if (!name) {
        // Find the entry (group, component or story) that is referred to
        const entry = titleOrId ? hash[titleOrId] || hash[sanitize(titleOrId)] : hash[kindSlug];

        if (!entry) throw new Error(`Unknown id or title: '${titleOrId}'`);

        // We want to navigate to the first ancestor entry that is a leaf
        const leafEntry = api.findLeafEntry(hash, entry.id);

        // We would default to the viewMode passed in or maintain the current
        const desiredViewMode = viewModeFromArgs || viewModeFromState;

        // By default we would render a story as a story
        let viewMode = 'story';
        // However, any story can be rendered as docs if required
        if (desiredViewMode === 'docs') {
          viewMode = 'docs';
        }

        // NOTE -- we currently still render docs entries in story view mode,
        // (even though in the preview they will appear in docs mode)
        // in order to maintain the viewMode as you browse around.
        // This will change later.

        // On the other hand, docs entries can *only* be rendered as docs
        // if (leafEntry.type === 'docs') {
        //   viewMode = 'docs';
        // }

        const fullId = leafEntry.refId ? `${leafEntry.refId}_${leafEntry.id}` : leafEntry.id;
        navigate(`/${viewMode}/${fullId}`);
      } else if (!titleOrId) {
        // This is a slugified version of the kind, but that's OK, our toId function is idempotent
        const id = toId(kindSlug, name);

        api.selectStory(id, undefined, options);
      } else {
        const id = ref ? `${ref}_${toId(titleOrId, name)}` : toId(titleOrId, name);
        if (hash[id]) {
          api.selectStory(id, undefined, options);
        } else {
          // Support legacy API with component permalinks, where kind is `x/y` but permalink is 'z'
          const entry = hash[sanitize(titleOrId)];
          if (entry?.type === 'component') {
            const foundId = entry.children.find((childId) => hash[childId].name === name);
            if (foundId) {
              api.selectStory(foundId, undefined, options);
            }
          }
        }
      }
    },
    findLeafEntry(storiesHash, storyId) {
      const entry = storiesHash[storyId];
      if (entry.type === 'docs' || entry.type === 'story') {
        return entry;
      }

      const childStoryId = entry.children[0];
      return api.findLeafEntry(storiesHash, childStoryId);
    },
    findLeafStoryId(storiesHash, storyId) {
      return api.findLeafEntry(storiesHash, storyId)?.id;
    },
    findSiblingStoryId(storyId, hash, direction, toSiblingGroup) {
      if (toSiblingGroup) {
        const lookupList = getComponentLookupList(hash);
        const index = lookupList.findIndex((i) => i.includes(storyId));

        // cannot navigate beyond fist or last
        if (index === lookupList.length - 1 && direction > 0) {
          return;
        }
        if (index === 0 && direction < 0) {
          return;
        }

        if (lookupList[index + direction]) {
          // eslint-disable-next-line consistent-return
          return lookupList[index + direction][0];
        }
        return;
      }
      const lookupList = getStoriesLookupList(hash);
      const index = lookupList.indexOf(storyId);

      // cannot navigate beyond fist or last
      if (index === lookupList.length - 1 && direction > 0) {
        return;
      }
      if (index === 0 && direction < 0) {
        return;
      }

      // eslint-disable-next-line consistent-return
      return lookupList[index + direction];
    },
    updateStoryArgs: (story, updatedArgs) => {
      const { id: storyId, refId } = story;
      fullAPI.emit(UPDATE_STORY_ARGS, {
        storyId,
        updatedArgs,
        options: {
          target: refId ? `storybook-ref-${refId}` : 'storybook-preview-iframe',
        },
      });
    },
    resetStoryArgs: (story, argNames?: [string]) => {
      const { id: storyId, refId } = story;
      fullAPI.emit(RESET_STORY_ARGS, {
        storyId,
        argNames,
        options: {
          target: refId ? `storybook-ref-${refId}` : 'storybook-preview-iframe',
        },
      });
    },
    fetchStoryList: async () => {
      try {
        const result = await fetch(STORY_INDEX_PATH);
        if (result.status !== 200) throw new Error(await result.text());

        const storyIndex = (await result.json()) as StoryIndex;

        // We can only do this if the stories.json is a proper storyIndex
        if (storyIndex.v < 3) {
          logger.warn(`Skipping story index with version v${storyIndex.v}, awaiting SET_STORIES.`);
          return;
        }

        await fullAPI.setStoryList(storyIndex);
      } catch (err) {
        store.setState({
          storiesConfigured: true,
          storiesFailed: err,
        });
      }
    },
    setStoryList: async (storyIndex: StoryIndex) => {
      const hash = transformStoryIndexToStoriesHash(storyIndex, {
        provider,
      });

      await store.setState({
        storiesHash: hash,
        storiesConfigured: true,
        storiesFailed: null,
      });
    },
    updateStory: async (
      storyId: StoryId,
      update: StoryUpdate,
      ref?: ComposedRef
    ): Promise<void> => {
      if (!ref) {
        const { storiesHash } = store.getState();
        storiesHash[storyId] = {
          ...storiesHash[storyId],
          ...update,
        } as StoryEntry;
        await store.setState({ storiesHash });
      } else {
        const { id: refId, stories } = ref;
        stories[storyId] = {
          ...stories[storyId],
          ...update,
        } as StoryEntry;
        await fullAPI.updateRef(refId, { stories });
      }
    },
  };

  const initModule = async () => {
    // On initial load, the local iframe will select the first story (or other "selection specifier")
    // and emit STORY_SPECIFIED with the id. We need to ensure we respond to this change.
    fullAPI.on(
      STORY_SPECIFIED,
      function handler({
        storyId,
        viewMode,
      }: {
        storyId: string;
        viewMode: ViewMode;
        [k: string]: any;
      }) {
        const { sourceType } = getEventMetadata(this, fullAPI);

        if (fullAPI.isSettingsScreenActive()) return;

        if (sourceType === 'local') {
          // Special case -- if we are already at the story being specified (i.e. the user started at a given story),
          // we don't need to change URL. See https://github.com/storybookjs/storybook/issues/11677
          const state = store.getState();
          if (state.storyId !== storyId || state.viewMode !== viewMode) {
            navigate(`/${viewMode}/${storyId}`);
          }
        }
      }
    );

    fullAPI.on(STORY_CHANGED, function handler() {
      const { sourceType } = getEventMetadata(this, fullAPI);

      if (sourceType === 'local') {
        const options = fullAPI.getCurrentParameter('options');

        if (options) {
          checkDeprecatedOptionParameters(options);
          fullAPI.setOptions(options);
        }
      }
    });

    fullAPI.on(STORY_PREPARED, function handler({ id, ...update }) {
      const { ref, sourceType } = getEventMetadata(this, fullAPI);
      fullAPI.updateStory(id, { ...update, prepared: true }, ref);

      if (!ref) {
        if (!store.getState().hasCalledSetOptions) {
          const { options } = update.parameters;
          checkDeprecatedOptionParameters(options);
          fullAPI.setOptions(options);
          store.setState({ hasCalledSetOptions: true });
        }
      } else {
        fullAPI.updateRef(ref.id, { ready: true });
      }

      if (sourceType === 'local') {
        const { storyId, storiesHash } = store.getState();

        // create a list of related stories to be preloaded
        const toBePreloaded = Array.from(
          new Set([
            api.findSiblingStoryId(storyId, storiesHash, 1, true),
            api.findSiblingStoryId(storyId, storiesHash, -1, true),
          ])
        ).filter(Boolean);

        fullAPI.emit(PRELOAD_STORIES, toBePreloaded);
      }
    });

    fullAPI.on(SET_STORIES, function handler(data: SetStoriesPayload) {
      const { ref } = getEventMetadata(this, fullAPI);
      const setStoriesData = data.v ? denormalizeStoryParameters(data) : data.stories;

      if (!ref) {
        if (!data.v) {
          throw new Error('Unexpected legacy SET_STORIES event from local source');
        }

        fullAPI.setStories(setStoriesData);
        const options = fullAPI.getCurrentParameter('options');
        checkDeprecatedOptionParameters(options);
        fullAPI.setOptions(options);
      } else {
        fullAPI.setRef(ref.id, { ...ref, setStoriesData }, true);
      }
    });

    fullAPI.on(
      SELECT_STORY,
      function handler({
        kind,
        story,
        storyId,
        ...rest
      }: {
        kind: string;
        story: string;
        storyId: string;
        viewMode: ViewMode;
      }) {
        const { ref } = getEventMetadata(this, fullAPI);

        if (!ref) {
          fullAPI.selectStory(storyId || kind, story, rest);
        } else {
          fullAPI.selectStory(storyId || kind, story, { ...rest, ref: ref.id });
        }
      }
    );

    fullAPI.on(
      STORY_ARGS_UPDATED,
      function handleStoryArgsUpdated({ storyId, args }: { storyId: StoryId; args: Args }) {
        const { ref } = getEventMetadata(this, fullAPI);
        fullAPI.updateStory(storyId, { args }, ref);
      }
    );

    fullAPI.on(CONFIG_ERROR, function handleConfigError(err) {
      store.setState({
        storiesConfigured: true,
        storiesFailed: err,
      });
    });

    if (FEATURES?.storyStoreV7) {
      provider.serverChannel?.on(STORY_INDEX_INVALIDATED, () => fullAPI.fetchStoryList());
      await fullAPI.fetchStoryList();
    }
  };

  return {
    api,
    state: {
      storiesHash: {},
      storyId: initialStoryId,
      viewMode: initialViewMode,
      storiesConfigured: false,
      hasCalledSetOptions: false,
    },
    init: initModule,
  };
};
