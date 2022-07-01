/// <reference types="jest" />;

import {
  STORY_ARGS_UPDATED,
  UPDATE_STORY_ARGS,
  RESET_STORY_ARGS,
  SET_STORIES,
  STORY_SPECIFIED,
  STORY_PREPARED,
  STORY_INDEX_INVALIDATED,
  CONFIG_ERROR,
} from '@storybook/core-events';
import { EventEmitter } from 'events';
import global from 'global';
import { mockChannel } from '@storybook/addons';

import { getEventMetadata } from '../lib/events';

import { init as initStories } from '../modules/stories';
import { StoryEntry, SetStoriesStoryData, SetStoriesStory, StoryIndex } from '../lib/stories';
import type Store from '../store';
import { ModuleArgs } from '..';

const mockStories: jest.MockedFunction<() => StoryIndex['entries']> = jest.fn();

jest.mock('../lib/events');
jest.mock('global', () => ({
  ...(jest.requireActual('global') as Record<string, any>),
  fetch: jest.fn(() => ({ json: () => ({ v: 4, entries: mockStories() }) })),
  FEATURES: { storyStoreV7: true },
  CONFIG_TYPE: 'DEVELOPMENT',
}));

const getEventMetadataMock = getEventMetadata as jest.MockedFunction<typeof getEventMetadata>;

const mockIndex = {
  'component-a--story-1': {
    id: 'component-a--story-1',
    title: 'Component A',
    name: 'Story 1',
    importPath: './path/to/component-a.ts',
  },
  'component-a--story-2': {
    id: 'component-a--story-2',
    title: 'Component A',
    name: 'Story 2',
    importPath: './path/to/component-a.ts',
  },
  'component-b--story-3': {
    id: 'component-b--story-3',
    title: 'Component B',
    name: 'Story 3',
    importPath: './path/to/component-b.ts',
  },
};

function createMockStore(initialState = {}) {
  let state = initialState;
  return {
    getState: jest.fn(() => state),
    setState: jest.fn((s) => {
      state = { ...state, ...s };
      return Promise.resolve(state);
    }),
  } as any as Store;
}

const provider = { getConfig: jest.fn().mockReturnValue({}), serverChannel: mockChannel() };

const parameters = {} as SetStoriesStory['parameters'];
const setStoriesData: SetStoriesStoryData = {
  'a--1': {
    kind: 'a',
    name: '1',
    parameters,
    id: 'a--1',
    args: {},
  } as SetStoriesStory,
  'a--2': {
    kind: 'a',
    name: '2',
    parameters,
    id: 'a--2',
    args: {},
  } as SetStoriesStory,
  'b-c--1': {
    kind: 'b/c',
    name: '1',
    parameters,
    id: 'b-c--1',
    args: {},
  } as SetStoriesStory,
  'b-d--1': {
    kind: 'b/d',
    name: '1',
    parameters,
    id: 'b-d--1',
    args: {},
  } as SetStoriesStory,
  'b-d--2': {
    kind: 'b/d',
    name: '2',
    parameters,
    id: 'b-d--2',
    args: { a: 'b' },
  } as SetStoriesStory,
  'custom-id--1': {
    kind: 'b/e',
    name: '1',
    parameters,
    id: 'custom-id--1',
    args: {},
  } as SetStoriesStory,
};

beforeEach(() => {
  provider.getConfig.mockReset().mockReturnValue({});
  provider.serverChannel = mockChannel();
  mockStories.mockReset().mockReturnValue(mockIndex);
  global.fetch
    .mockReset()
    .mockReturnValue({ status: 200, json: () => ({ v: 4, entries: mockStories() }) });

  getEventMetadataMock.mockReturnValue({ sourceType: 'local' } as any);
  getEventMetadataMock.mockReturnValue({ sourceType: 'local' } as any);
});

describe('stories API', () => {
  it('sets a sensible initialState', () => {
    const { state } = initStories({
      storyId: 'id',
      viewMode: 'story',
    } as ModuleArgs);

    expect(state).toEqual({
      storiesConfigured: false,
      storiesHash: {},
      storyId: 'id',
      viewMode: 'story',
      hasCalledSetOptions: false,
    });
  });

  describe('setStories', () => {
    beforeEach(() => {
      mockStories.mockRejectedValue(new Error('Fetch failed') as never);
    });

    it('stores basic kinds and stories w/ correct keys', () => {
      const navigate = jest.fn();
      const store = createMockStore({});

      const {
        api: { setStories },
      } = initStories({ store, navigate, provider } as any as any);

      provider.getConfig.mockReturnValue({ sidebar: { showRoots: false } });
      setStories(setStoriesData);

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doesn't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual([
        'a',
        'a--1',
        'a--2',
        'b',
        'b-c',
        'b-c--1',
        'b-d',
        'b-d--1',
        'b-d--2',
        'b-e',
        'custom-id--1',
      ]);
      expect(storedStoriesHash.a).toMatchObject({
        type: 'component',
        id: 'a',
        children: ['a--1', 'a--2'],
      });

      expect(storedStoriesHash['a--1']).toMatchObject({
        type: 'story',
        id: 'a--1',
        parent: 'a',
        title: 'a',
        name: '1',
        parameters,
        args: {},
        prepared: true,
      });

      expect(storedStoriesHash['a--2']).toMatchObject({
        type: 'story',
        id: 'a--2',
        parent: 'a',
        title: 'a',
        name: '2',
        parameters,
        args: {},
        prepared: true,
      });

      expect(storedStoriesHash.b).toMatchObject({
        type: 'group',
        id: 'b',
        children: ['b-c', 'b-d', 'b-e'],
      });

      expect(storedStoriesHash['b-c']).toMatchObject({
        type: 'component',
        id: 'b-c',
        parent: 'b',
        children: ['b-c--1'],
      });

      expect(storedStoriesHash['b-c--1']).toMatchObject({
        type: 'story',
        id: 'b-c--1',
        parent: 'b-c',
        title: 'b/c',
        name: '1',
        parameters,
        args: {},
        prepared: true,
      });

      expect(storedStoriesHash['b-d']).toMatchObject({
        type: 'component',
        id: 'b-d',
        parent: 'b',
        children: ['b-d--1', 'b-d--2'],
      });

      expect(storedStoriesHash['b-d--1']).toMatchObject({
        type: 'story',
        id: 'b-d--1',
        parent: 'b-d',
        title: 'b/d',
        name: '1',
        parameters,
        args: {},
        prepared: true,
      });

      expect(storedStoriesHash['b-d--2']).toMatchObject({
        type: 'story',
        id: 'b-d--2',
        parent: 'b-d',
        title: 'b/d',
        name: '2',
        parameters,
        args: { a: 'b' },
        prepared: true,
      });

      expect(storedStoriesHash['b-e']).toMatchObject({
        type: 'component',
        id: 'b-e',
        parent: 'b',
        children: ['custom-id--1'],
      });

      expect(storedStoriesHash['custom-id--1']).toMatchObject({
        type: 'story',
        id: 'custom-id--1',
        parent: 'b-e',
        title: 'b/e',
        name: '1',
        parameters,
        args: {},
        prepared: true,
      });
    });

    it('trims whitespace of group/component names (which originate from the kind)', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories },
      } = initStories({ store, navigate, provider } as any);

      setStories({
        'design-system-some-component--my-story': {
          id: 'design-system-some-component--my-story',
          kind: '  Design System  /  Some Component  ', // note the leading/trailing whitespace around each part of the path
          name: '  My Story  ', // we only trim the path, so this will be kept as-is (it may intentionally have whitespace)
          parameters,
          args: {},
        },
      });

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doesn't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual([
        'design-system',
        'design-system-some-component',
        'design-system-some-component--my-story',
      ]);
      expect(storedStoriesHash['design-system']).toMatchObject({
        type: 'root',
        name: 'Design System', // root name originates from `kind`, so it gets trimmed
      });
      expect(storedStoriesHash['design-system-some-component']).toMatchObject({
        type: 'component',
        name: 'Some Component', // component name originates from `kind`, so it gets trimmed
      });
      expect(storedStoriesHash['design-system-some-component--my-story']).toMatchObject({
        type: 'story',
        title: '  Design System  /  Some Component  ', // title is kept as-is, because it may be used as identifier
        name: '  My Story  ', // story name is kept as-is, because it's set directly on the story
      });
    });

    it('sets roots when showRoots = true', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories },
      } = initStories({ store, navigate, provider } as any);

      provider.getConfig.mockReturnValue({ sidebar: { showRoots: true } });
      setStories({
        'a-b--1': {
          kind: 'a/b',
          name: '1',
          parameters,
          id: 'a-b--1',
          args: {},
        },
      });

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doens't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual(['a', 'a-b', 'a-b--1']);
      expect(storedStoriesHash.a).toMatchObject({
        type: 'root',
        id: 'a',
        children: ['a-b'],
      });
      expect(storedStoriesHash['a-b']).toMatchObject({
        type: 'component',
        id: 'a-b',
        parent: 'a',
        children: ['a-b--1'],
      });
      expect(storedStoriesHash['a-b--1']).toMatchObject({
        type: 'story',
        id: 'a-b--1',
        parent: 'a-b',
        name: '1',
        title: 'a/b',
        parameters,
        args: {},
      });
    });

    it('does not put bare stories into a root when showRoots = true', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories },
      } = initStories({ store, navigate, provider } as any);

      provider.getConfig.mockReturnValue({ sidebar: { showRoots: true } });
      setStories({
        'a--1': {
          kind: 'a',
          name: '1',
          parameters,
          id: 'a--1',
          args: {},
        },
      });

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doens't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual(['a', 'a--1']);
      expect(storedStoriesHash.a).toMatchObject({
        type: 'component',
        id: 'a',
        children: ['a--1'],
      });
      expect(storedStoriesHash['a--1']).toMatchObject({
        type: 'story',
        id: 'a--1',
        parent: 'a',
        title: 'a',
        name: '1',
        parameters,
        args: {},
      });
    });

    // Stories can get out of order for a few reasons -- see reproductions on
    //   https://github.com/storybookjs/storybook/issues/5518
    it('does the right thing for out of order stories', async () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories },
      } = initStories({ store, navigate, provider } as any);

      await setStories({
        'a--1': { kind: 'a', name: '1', parameters, id: 'a--1', args: {} },
        'b--1': { kind: 'b', name: '1', parameters, id: 'b--1', args: {} },
        'a--2': { kind: 'a', name: '2', parameters, id: 'a--2', args: {} },
      });

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doens't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual(['a', 'a--1', 'a--2', 'b', 'b--1']);
      expect(storedStoriesHash.a).toMatchObject({
        type: 'component',
        id: 'a',
        children: ['a--1', 'a--2'],
      });

      expect(storedStoriesHash.b).toMatchObject({
        type: 'component',
        id: 'b',
        children: ['b--1'],
      });
    });
  });

  // Can't currently run these tests as cannot set this on the events
  describe('STORY_SPECIFIED event', () => {
    it('navigates to the story', async () => {
      const navigate = jest.fn();
      const fullAPI = Object.assign(new EventEmitter(), {
        isSettingsScreenActive() {
          return false;
        },
      });
      const store = createMockStore({});
      const { init, api } = initStories({ store, navigate, provider, fullAPI } as any);

      Object.assign(fullAPI, api);
      init();
      fullAPI.emit(STORY_SPECIFIED, { storyId: 'a--1', viewMode: 'story' });

      expect(navigate).toHaveBeenCalledWith('/story/a--1');
    });

    it('DOES not navigate if the story was already selected', async () => {
      const navigate = jest.fn();
      const fullAPI = Object.assign(new EventEmitter(), {
        isSettingsScreenActive() {
          return true;
        },
      });
      const store = createMockStore({ viewMode: 'story', storyId: 'a--1' });
      initStories({ store, navigate, provider, fullAPI } as any);

      fullAPI.emit(STORY_SPECIFIED, { storyId: 'a--1', viewMode: 'story' });

      expect(navigate).not.toHaveBeenCalled();
    });

    it('DOES not navigate if a settings page was selected', async () => {
      const navigate = jest.fn();
      const fullAPI = Object.assign(new EventEmitter(), {
        isSettingsScreenActive() {
          return true;
        },
      });
      const store = createMockStore({ viewMode: 'settings', storyId: 'about' });
      initStories({ store, navigate, provider, fullAPI } as any);

      fullAPI.emit(STORY_SPECIFIED, { storyId: 'a--1', viewMode: 'story' });

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('args handling', () => {
    it('changes args properly, per story when receiving STORY_ARGS_UPDATED', () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = new EventEmitter();

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);

      Object.assign(fullAPI, api);
      (fullAPI as any as typeof api).setStories({
        'a--1': { kind: 'a', name: '1', parameters, id: 'a--1', args: { a: 'b' } },
        'b--1': { kind: 'b', name: '1', parameters, id: 'b--1', args: { x: 'y' } },
      });

      const { storiesHash: initialStoriesHash } = store.getState();
      expect((initialStoriesHash['a--1'] as StoryEntry).args).toEqual({ a: 'b' });
      expect((initialStoriesHash['b--1'] as StoryEntry).args).toEqual({ x: 'y' });

      init();
      fullAPI.emit(STORY_ARGS_UPDATED, { storyId: 'a--1', args: { foo: 'bar' } });

      const { storiesHash: changedStoriesHash } = store.getState();
      expect((changedStoriesHash['a--1'] as StoryEntry).args).toEqual({ foo: 'bar' });
      expect((changedStoriesHash['b--1'] as StoryEntry).args).toEqual({ x: 'y' });
    });

    it('changes reffed args properly, per story when receiving STORY_ARGS_UPDATED', () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = new EventEmitter();

      const { init, api } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);
      (fullAPI as any).updateRef = jest.fn();

      init();
      getEventMetadataMock.mockReturnValueOnce({
        sourceType: 'external',
        ref: { id: 'refId', stories: { 'a--1': { args: { a: 'b' } } } },
      } as any);
      fullAPI.emit(STORY_ARGS_UPDATED, { storyId: 'a--1', args: { foo: 'bar' } });
      expect((fullAPI as any).updateRef).toHaveBeenCalledWith('refId', {
        stories: { 'a--1': { args: { foo: 'bar' } } },
      });
    });

    it('updateStoryArgs emits UPDATE_STORY_ARGS to the local frame and does not change anything', () => {
      const navigate = jest.fn();
      const emit = jest.fn();
      const on = jest.fn();
      const fullAPI = { emit, on };
      const store = createMockStore();

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);

      api.setStories({
        'a--1': { kind: 'a', name: '1', parameters, id: 'a--1', args: { a: 'b' } },
        'b--1': { kind: 'b', name: '1', parameters, id: 'b--1', args: { x: 'y' } },
      });

      Object.assign(fullAPI, api);
      init();

      api.updateStoryArgs({ id: 'a--1' } as StoryEntry, { foo: 'bar' });
      expect(emit).toHaveBeenCalledWith(UPDATE_STORY_ARGS, {
        storyId: 'a--1',
        updatedArgs: { foo: 'bar' },
        options: {
          target: 'storybook-preview-iframe',
        },
      });

      const { storiesHash: changedStoriesHash } = store.getState();
      expect((changedStoriesHash['a--1'] as StoryEntry).args).toEqual({ a: 'b' });
      expect((changedStoriesHash['b--1'] as StoryEntry).args).toEqual({ x: 'y' });
    });

    it('updateStoryArgs emits UPDATE_STORY_ARGS to the right frame', () => {
      const navigate = jest.fn();
      const emit = jest.fn();
      const on = jest.fn();
      const fullAPI = { emit, on };
      const store = createMockStore();

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);

      api.setStories({
        'a--1': { kind: 'a', name: '1', parameters, id: 'a--1', args: { a: 'b' } },
        'b--1': { kind: 'b', name: '1', parameters, id: 'b--1', args: { x: 'y' } },
      });

      Object.assign(fullAPI, api);
      init();

      api.updateStoryArgs({ id: 'a--1', refId: 'refId' } as StoryEntry, { foo: 'bar' });
      expect(emit).toHaveBeenCalledWith(UPDATE_STORY_ARGS, {
        storyId: 'a--1',
        updatedArgs: { foo: 'bar' },
        options: {
          target: 'storybook-ref-refId',
        },
      });
    });

    it('resetStoryArgs emits RESET_STORY_ARGS to the local frame and does not change anything', () => {
      const navigate = jest.fn();
      const emit = jest.fn();
      const on = jest.fn();
      const fullAPI = { emit, on };
      const store = createMockStore();

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);

      api.setStories({
        'a--1': { kind: 'a', name: '1', parameters, id: 'a--1', args: { a: 'b' } },
        'b--1': { kind: 'b', name: '1', parameters, id: 'b--1', args: { x: 'y' } },
      });

      Object.assign(fullAPI, api);
      init();

      api.resetStoryArgs({ id: 'a--1' } as StoryEntry, ['foo']);
      expect(emit).toHaveBeenCalledWith(RESET_STORY_ARGS, {
        storyId: 'a--1',
        argNames: ['foo'],
        options: {
          target: 'storybook-preview-iframe',
        },
      });

      const { storiesHash: changedStoriesHash } = store.getState();
      expect((changedStoriesHash['a--1'] as StoryEntry).args).toEqual({ a: 'b' });
      expect((changedStoriesHash['b--1'] as StoryEntry).args).toEqual({ x: 'y' });
    });

    it('resetStoryArgs emits RESET_STORY_ARGS to the right frame', () => {
      const navigate = jest.fn();
      const emit = jest.fn();
      const on = jest.fn();
      const fullAPI = { emit, on };
      const store = createMockStore();

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);

      api.setStories({
        'a--1': { kind: 'a', name: '1', parameters, id: 'a--1', args: { a: 'b' } },
        'b--1': { kind: 'b', name: '1', parameters, id: 'b--1', args: { x: 'y' } },
      });

      Object.assign(fullAPI, api);
      init();

      api.resetStoryArgs({ id: 'a--1', refId: 'refId' } as StoryEntry, ['foo']);
      expect(emit).toHaveBeenCalledWith(RESET_STORY_ARGS, {
        storyId: 'a--1',
        argNames: ['foo'],
        options: {
          target: 'storybook-ref-refId',
        },
      });
    });
  });

  describe('jumpToStory', () => {
    it('works forward', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });

      const {
        api: { setStories, jumpToStory },
        state,
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      jumpToStory(1);
      expect(navigate).toHaveBeenCalledWith('/story/a--2');
    });

    it('works backwards', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--2', viewMode: 'story' });

      const {
        api: { setStories, jumpToStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      jumpToStory(-1);
      expect(navigate).toHaveBeenCalledWith('/story/a--1');
    });

    it('does nothing if you are at the last story and go forward', () => {
      const navigate = jest.fn();
      const store = createMockStore({
        storyId: 'custom-id--1',
        viewMode: 'story',
      });

      const {
        api: { setStories, jumpToStory },
      } = initStories({
        store,
        navigate,
        provider,
      } as any);
      setStories(setStoriesData);

      jumpToStory(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does nothing if you are at the first story and go backward', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });

      const {
        api: { setStories, jumpToStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      jumpToStory(-1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does nothing if you have not selected a story', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories, jumpToStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      jumpToStory(1);
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('findSiblingStoryId', () => {
    it('works forward', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const storyId = 'a--1';
      const {
        api: { setStories, findSiblingStoryId },
        state,
      } = initStories({ store, navigate, storyId, viewMode: 'story', provider } as any);
      store.setState(state);
      setStories(setStoriesData);

      const result = findSiblingStoryId(storyId, store.getState().storiesHash, 1, false);
      expect(result).toBe('a--2');
    });
    it('works forward toSiblingGroup', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const storyId = 'a--1';
      const {
        api: { setStories, findSiblingStoryId },
        state,
      } = initStories({ store, navigate, storyId, viewMode: 'story', provider } as any);
      store.setState(state);
      setStories(setStoriesData);

      const result = findSiblingStoryId(storyId, store.getState().storiesHash, 1, true);
      expect(result).toBe('b-c--1');
    });
  });
  describe('jumpToComponent', () => {
    it('works forward', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories, jumpToComponent },
        state,
      } = initStories({ store, navigate, storyId: 'a--1', viewMode: 'story', provider } as any);
      store.setState(state);
      setStories(setStoriesData);

      jumpToComponent(1);
      expect(navigate).toHaveBeenCalledWith('/story/b-c--1');
    });

    it('works backwards', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories, jumpToComponent },
        state,
      } = initStories({ store, navigate, storyId: 'b-c--1', viewMode: 'story', provider } as any);
      store.setState(state);
      setStories(setStoriesData);

      jumpToComponent(-1);
      expect(navigate).toHaveBeenCalledWith('/story/a--1');
    });

    it('does nothing if you are in the last component and go forward', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories, jumpToComponent },
        state,
      } = initStories({
        store,
        navigate,
        storyId: 'custom-id--1',
        viewMode: 'story',
        provider,
      } as any);
      store.setState(state);
      setStories(setStoriesData);

      jumpToComponent(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does nothing if you are at the first component and go backward', () => {
      const navigate = jest.fn();
      const store = createMockStore();

      const {
        api: { setStories, jumpToComponent },
        state,
      } = initStories({ store, navigate, storyId: 'a--2', viewMode: 'story', provider } as any);
      store.setState(state);
      setStories(setStoriesData);

      jumpToComponent(-1);
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('selectStory', () => {
    it('navigates', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      selectStory('a--2');
      expect(navigate).toHaveBeenCalledWith('/story/a--2');
    });

    it('retains current view mode', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'docs' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      selectStory('a--2');
      expect(navigate).toHaveBeenCalledWith('/docs/a--2');
    });

    it('sets view mode to docs if doc-level component is selected', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'docs' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories({
        ...setStoriesData,
        'intro--docs': {
          id: 'intro--docs',
          kind: 'Intro',
          name: 'Page',
          parameters: { docsOnly: true } as any,
          args: {},
        },
      });

      selectStory('intro');
      expect(navigate).toHaveBeenCalledWith('/docs/intro--docs');
    });

    describe('legacy api', () => {
      it('allows navigating to a combination of title + name', () => {
        const navigate = jest.fn();
        const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });
        const {
          api: { setStories, selectStory },
        } = initStories({ store, navigate, provider } as any);
        setStories(setStoriesData);

        selectStory('a', '2');
        expect(navigate).toHaveBeenCalledWith('/story/a--2');
      });

      it('allows navigating to a given name (in the current component)', () => {
        const navigate = jest.fn();
        const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });
        const {
          api: { setStories, selectStory },
        } = initStories({ store, navigate, provider } as any);
        setStories(setStoriesData);

        selectStory(undefined, '2');
        expect(navigate).toHaveBeenCalledWith('/story/a--2');
      });
    });

    it('allows navigating away from the settings pages', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'settings' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      selectStory('a--2');
      expect(navigate).toHaveBeenCalledWith('/story/a--2');
    });

    it('allows navigating to first story in component on call by component id', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      selectStory('a');
      expect(navigate).toHaveBeenCalledWith('/story/a--1');
    });

    it('allows navigating to first story in group on call by group id', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      selectStory('b');
      expect(navigate).toHaveBeenCalledWith('/story/b-c--1');
    });

    it('allows navigating to first story in component on call by title', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--1', viewMode: 'story' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      selectStory('A');
      expect(navigate).toHaveBeenCalledWith('/story/a--1');
    });

    it('allows navigating to the first story of the current component if passed nothing', () => {
      const navigate = jest.fn();
      const store = createMockStore({ storyId: 'a--2', viewMode: 'story' });
      const {
        api: { setStories, selectStory },
      } = initStories({ store, navigate, provider } as any);
      setStories(setStoriesData);

      selectStory();
      expect(navigate).toHaveBeenCalledWith('/story/a--1');
    });

    describe('component permalinks', () => {
      it('allows navigating to kind/storyname (legacy api)', () => {
        const navigate = jest.fn();
        const store = createMockStore();

        const {
          api: { selectStory, setStories },
          state,
        } = initStories({ store, navigate, provider } as any);
        store.setState(state);
        setStories(setStoriesData);

        selectStory('b/e', '1');
        expect(navigate).toHaveBeenCalledWith('/story/custom-id--1');
      });

      it('allows navigating to component permalink/storyname (legacy api)', () => {
        const navigate = jest.fn();
        const store = createMockStore();

        const {
          api: { selectStory, setStories },
          state,
        } = initStories({ store, navigate, provider } as any);
        store.setState(state);
        setStories(setStoriesData);

        selectStory('custom-id', '1');
        expect(navigate).toHaveBeenCalledWith('/story/custom-id--1');
      });

      it('allows navigating to first story in kind on call by kind', () => {
        const navigate = jest.fn();
        const store = createMockStore();

        const {
          api: { selectStory, setStories },
          state,
        } = initStories({ store, navigate, provider } as any);
        store.setState(state);
        setStories(setStoriesData);

        selectStory('b/e');
        expect(navigate).toHaveBeenCalledWith('/story/custom-id--1');
      });
    });
  });

  describe('fetchStoryIndex', () => {
    it('deals with 500 errors', async () => {
      const navigate = jest.fn();
      const store = createMockStore({});
      const fullAPI = Object.assign(new EventEmitter(), {});

      global.fetch.mockReturnValue({ status: 500, text: async () => new Error('sorting error') });
      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      await init();

      const { storiesConfigured, storiesFailed } = store.getState();
      expect(storiesConfigured).toBe(true);
      expect(storiesFailed?.message).toMatch(/sorting error/);
    });

    it('sets the initial set of stories in the stories hash', async () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      await init();

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doesn't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual([
        'component-a',
        'component-a--story-1',
        'component-a--story-2',
        'component-b',
        'component-b--story-3',
      ]);
      expect(storedStoriesHash['component-a']).toMatchObject({
        type: 'component',
        id: 'component-a',
        children: ['component-a--story-1', 'component-a--story-2'],
      });

      expect(storedStoriesHash['component-a--story-1']).toMatchObject({
        type: 'story',
        id: 'component-a--story-1',
        parent: 'component-a',
        title: 'Component A',
        name: 'Story 1',
        prepared: false,
      });
      expect(
        (storedStoriesHash['component-a--story-1'] as StoryEntry as StoryEntry).args
      ).toBeUndefined();
    });

    it('moves rootless stories to the front of the list', async () => {
      mockStories.mockReset().mockReturnValue({
        'root-first--story-1': {
          id: 'root-first--story-1',
          title: 'Root/First',
          name: 'Story 1',
          importPath: './path/to/root/first.ts',
        },
        ...mockIndex,
      });

      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      await init();

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doesn't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual([
        'component-a',
        'component-a--story-1',
        'component-a--story-2',
        'component-b',
        'component-b--story-3',
        'root',
        'root-first',
        'root-first--story-1',
      ]);
      expect(storedStoriesHash.root).toMatchObject({
        type: 'root',
        id: 'root',
        children: ['root-first'],
      });
    });

    it('watches for the INVALIDATE event and refetches -- and resets the hash', async () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      global.fetch.mockClear();
      await init();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      global.fetch.mockClear();
      mockStories.mockReturnValueOnce({
        'component-a--story-1': {
          type: 'story',
          id: 'component-a--story-1',
          title: 'Component A',
          name: 'Story 1',
          importPath: './path/to/component-a.ts',
        },
      });
      provider.serverChannel.emit(STORY_INDEX_INVALIDATED);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Let the promise/await chain resolve
      await new Promise((r) => setTimeout(r, 0));
      const { storiesHash: storedStoriesHash } = store.getState();

      expect(Object.keys(storedStoriesHash)).toEqual(['component-a', 'component-a--story-1']);
    });

    it('handles docs entries', async () => {
      mockStories.mockReset().mockReturnValue({
        'component-a--page': {
          id: 'component-a--page',
          title: 'Component A',
          name: 'Page',
          importPath: './path/to/component-a.ts',
        },
        'component-a--story-2': {
          id: 'component-a--story-2',
          title: 'Component A',
          name: 'Story 2',
          importPath: './path/to/component-a.ts',
        },
        'component-b': {
          type: 'docs',
          id: 'component-b--docs',
          title: 'Component B',
          name: 'Docs',
          importPath: './path/to/component-b.ts',
          storiesImports: [],
        },
        'component-c--story-4': {
          id: 'component-c--story-4',
          title: 'Component c',
          name: 'Story 4',
          importPath: './path/to/component-c.ts',
        },
      });

      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      await init();

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doesn't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual([
        'component-a',
        'component-a--page',
        'component-a--story-2',
        'component-b',
        'component-b--docs',
        'component-c',
        'component-c--story-4',
      ]);
      expect(storedStoriesHash['component-a--page'].type).toBe('story');
      expect(storedStoriesHash['component-a--story-2'].type).toBe('story');
      expect(storedStoriesHash['component-b--docs'].type).toBe('docs');
      expect(storedStoriesHash['component-c--story-4'].type).toBe('story');
    });

    // Skip this for now, will come back soon
    it.skip('prefers parameters.docsOnly to inferred docsOnly status', async () => {
      mockStories.mockReset().mockReturnValue({
        'component-a--docs': {
          type: 'story',
          title: 'Component A',
          name: 'Docs', // Called 'Docs' rather than 'Page'
          importPath: './path/to/component-a.ts',
          parameters: {
            docsOnly: true,
          },
        },
      });

      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI });
      Object.assign(fullAPI, api);

      await init();

      const { storiesHash: storedStoriesHash } = store.getState();

      // We need exact key ordering, even if in theory JS doesn't guarantee it
      expect(Object.keys(storedStoriesHash)).toEqual(['component-a', 'component-a--docs']);
      expect(storedStoriesHash['component-a--docs'].parameters.docsOnly).toBe(true);
    });
  });

  describe('STORY_PREPARED', () => {
    it('prepares the story', async () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
        setOptions: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      await init();
      fullAPI.emit(STORY_PREPARED, {
        id: 'component-a--story-1',
        parameters: { a: 'b' },
        args: { c: 'd' },
      });

      const { storiesHash: storedStoriesHash } = store.getState();
      expect(storedStoriesHash['component-a--story-1']).toMatchObject({
        type: 'story',
        id: 'component-a--story-1',
        parent: 'component-a',
        title: 'Component A',
        name: 'Story 1',
        prepared: true,
        parameters: { a: 'b' },
        args: { c: 'd' },
      });
    });

    it('sets options the first time it is called', async () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
        setOptions: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      await init();
      fullAPI.emit(STORY_PREPARED, {
        id: 'component-a--story-1',
        parameters: { options: 'options' },
      });

      expect(fullAPI.setOptions).toHaveBeenCalledWith('options');

      fullAPI.setOptions.mockClear();
      fullAPI.emit(STORY_PREPARED, {
        id: 'component-a--story-1',
        parameters: { options: 'options2' },
      });

      expect(fullAPI.setOptions).not.toHaveBeenCalled();
    });

    it('sets the ref to ready when it is an external story', async () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
        updateRef: jest.fn(),
      });

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      getEventMetadataMock.mockReturnValueOnce({
        sourceType: 'external',
        ref: { id: 'refId', stories: { 'a--1': { args: { a: 'b' } } } },
      } as any);
      await init();

      fullAPI.emit(STORY_PREPARED, {
        id: 'a--1',
      });

      expect(fullAPI.updateRef.mock.calls.length).toBe(2);

      expect(fullAPI.updateRef.mock.calls[0][1]).toEqual({
        stories: { 'a--1': { args: { a: 'b' }, prepared: true } },
      });

      expect(fullAPI.updateRef.mock.calls[1][1]).toEqual({
        ready: true,
      });
    });
  });

  describe('CONFIG_ERROR', () => {
    it('shows error to user', async () => {
      const navigate = jest.fn();
      const store = createMockStore();
      const fullAPI = Object.assign(new EventEmitter(), {});

      const { api, init } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api);

      await init();

      fullAPI.emit(CONFIG_ERROR, { message: 'Failed to run configure' });

      const { storiesConfigured, storiesFailed } = store.getState();
      expect(storiesConfigured).toBe(true);
      expect(storiesFailed?.message).toMatch(/Failed to run configure/);
    });
  });

  describe('v2 SET_STORIES event', () => {
    it('normalizes parameters and calls setStories for local stories', () => {
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
        setOptions: jest.fn(),
        findRef: jest.fn(),
        getCurrentParameter: jest.fn(),
      });
      const navigate = jest.fn();
      const store = createMockStore();

      const { init, api } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api, { setStories: jest.fn() });
      init();

      const setStoriesPayload = {
        v: 2,
        globalParameters: { global: 'global' },
        kindParameters: { a: { kind: 'kind' } },
        stories: { 'a--1': { kind: 'a', parameters: { story: 'story' } } },
      };
      fullAPI.emit(SET_STORIES, setStoriesPayload);

      expect(fullAPI.setStories).toHaveBeenCalledWith({
        'a--1': { kind: 'a', parameters: { global: 'global', kind: 'kind', story: 'story' } },
      });
    });

    it('normalizes parameters and calls setRef for external stories', () => {
      const fullAPI = Object.assign(new EventEmitter());
      const navigate = jest.fn();
      const store = createMockStore();

      const { init, api } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api, {
        setStories: jest.fn(),
        findRef: jest.fn(),
        setRef: jest.fn(),
      });
      init();

      getEventMetadataMock.mockReturnValueOnce({
        sourceType: 'external',
        ref: { id: 'ref' },
      } as any);
      const setStoriesPayload = {
        v: 2,
        globalParameters: { global: 'global' },
        kindParameters: { a: { kind: 'kind' } },
        stories: { 'a--1': { kind: 'a', parameters: { story: 'story' } } },
      };
      fullAPI.emit(SET_STORIES, setStoriesPayload);

      expect(fullAPI.setStories).not.toHaveBeenCalled();
      expect(fullAPI.setRef).toHaveBeenCalledWith(
        'ref',
        {
          id: 'ref',
          setStoriesData: {
            'a--1': { kind: 'a', parameters: { global: 'global', kind: 'kind', story: 'story' } },
          },
        },
        true
      );
    });

    it('calls setOptions w/ first story parameter', () => {
      const fullAPI = Object.assign(new EventEmitter(), {
        setStories: jest.fn(),
        setOptions: jest.fn(),
        findRef: jest.fn(),
      });
      const navigate = jest.fn();
      const store = createMockStore();

      const { init, api } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api, { getCurrentParameter: jest.fn().mockReturnValue('options') });
      init();

      store.setState({});
      const setStoriesPayload = {
        v: 2,
        globalParameters: {},
        kindParameters: { a: {} },
        stories: { 'a--1': { kind: 'a' } },
      };
      fullAPI.emit(SET_STORIES, setStoriesPayload);

      expect(fullAPI.setOptions).toHaveBeenCalledWith('options');
    });
  });
  describe('legacy (v1) SET_STORIES event', () => {
    it('calls setRef with stories', () => {
      const fullAPI = Object.assign(new EventEmitter());
      const navigate = jest.fn();
      const store = createMockStore();

      const { init, api } = initStories({ store, navigate, provider, fullAPI } as any);
      Object.assign(fullAPI, api, {
        setStories: jest.fn(),
        findRef: jest.fn(),
        setRef: jest.fn(),
      });
      init();

      getEventMetadataMock.mockReturnValueOnce({
        sourceType: 'external',
        ref: { id: 'ref' },
      } as any);
      const setStoriesPayload = {
        stories: { 'a--1': {} },
      };
      fullAPI.emit(SET_STORIES, setStoriesPayload);

      expect(fullAPI.setStories).not.toHaveBeenCalled();
      expect(fullAPI.setRef).toHaveBeenCalledWith(
        'ref',
        {
          id: 'ref',
          setStoriesData: {
            'a--1': {},
          },
        },
        true
      );
    });
  });
});
