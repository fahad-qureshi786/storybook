import memoize from 'memoizerific';
import React from 'react';
import deprecate from 'util-deprecate';
import dedent from 'ts-dedent';
import mapValues from 'lodash/mapValues';
import countBy from 'lodash/countBy';
import global from 'global';
import type {
  StoryId,
  ComponentTitle,
  StoryKind,
  StoryName,
  Args,
  ArgTypes,
  Parameters,
} from '@storybook/csf';
import { sanitize } from '@storybook/csf';

import { combineParameters } from '../index';
import merge from './merge';
import type { Provider } from '../modules/provider';
import type { ViewMode } from '../modules/addons';

const { FEATURES } = global;

export type { StoryId };

export interface BaseEntry {
  id: StoryId;
  depth: number;
  name: string;
  refId?: string;
  renderLabel?: (item: BaseEntry) => React.ReactNode;

  /** @deprecated */
  isRoot: boolean;
  /** @deprecated */
  isComponent: boolean;
  /** @deprecated */
  isLeaf: boolean;
}

export interface RootEntry extends BaseEntry {
  type: 'root';
  startCollapsed?: boolean;
  children: StoryId[];

  /** @deprecated */
  isRoot: true;
  /** @deprecated */
  isComponent: false;
  /** @deprecated */
  isLeaf: false;
}

export interface GroupEntry extends BaseEntry {
  type: 'group';
  parent?: StoryId;
  children: StoryId[];

  /** @deprecated */
  isRoot: false;
  /** @deprecated */
  isComponent: false;
  /** @deprecated */
  isLeaf: false;
}

export interface ComponentEntry extends BaseEntry {
  type: 'component';
  parent?: StoryId;
  children: StoryId[];

  /** @deprecated */
  isRoot: false;
  /** @deprecated */
  isComponent: true;
  /** @deprecated */
  isLeaf: false;
}

export interface DocsEntry extends BaseEntry {
  type: 'docs';
  parent: StoryId;
  title: ComponentTitle;
  /** @deprecated */
  kind: ComponentTitle;
  importPath: Path;

  /** @deprecated */
  isRoot: false;
  /** @deprecated */
  isComponent: false;
  /** @deprecated */
  isLeaf: true;
}

export interface StoryEntry extends BaseEntry {
  type: 'story';
  parent: StoryId;
  title: ComponentTitle;
  /** @deprecated */
  kind: ComponentTitle;
  importPath: Path;
  prepared: boolean;
  parameters?: {
    [parameterName: string]: any;
  };
  args?: Args;
  argTypes?: ArgTypes;
  initialArgs?: Args;

  /** @deprecated */
  isRoot: false;
  /** @deprecated */
  isComponent: false;
  /** @deprecated */
  isLeaf: true;
}

/** @deprecated */
export type Root = RootEntry;

/** @deprecated */
export type Group = GroupEntry | ComponentEntry;

/** @deprecated */
export type Story = DocsEntry | StoryEntry;

export type HashEntry = RootEntry | GroupEntry | ComponentEntry | DocsEntry | StoryEntry;

/**
 * The `StoriesHash` is our manager-side representation of the `StoryIndex`.
 * We create entries in the hash not only for each story or docs entry, but
 * also for each "group" of the component (split on '/'), as that's how things
 * are manipulated in the manager (i.e. in the sidebar)
 */
export interface StoriesHash {
  [id: string]: HashEntry;
}

// The data received on the (legacy) `setStories` event
export interface SetStoriesStory {
  id: StoryId;
  name: string;
  refId?: string;
  kind: StoryKind;
  parameters: {
    fileName: string;
    options: {
      [optionName: string]: any;
    };
    docsOnly?: boolean;
    viewMode?: ViewMode;
    [parameterName: string]: any;
  };
  argTypes?: ArgTypes;
  args?: Args;
  initialArgs?: Args;
}

export interface SetStoriesStoryData {
  [id: string]: SetStoriesStory;
}

export type SetStoriesPayload =
  | {
      v: 2;
      error?: Error;
      globals: Args;
      globalParameters: Parameters;
      stories: SetStoriesStoryData;
      kindParameters: {
        [kind: string]: Parameters;
      };
    }
  | ({
      v?: number;
      stories: SetStoriesStoryData;
    } & Record<string, never>);

// The data recevied via the story index
type Path = string;

interface BaseIndexEntry {
  id: StoryId;
  name: StoryName;
  title: ComponentTitle;
  importPath: Path;
}

export type StoryIndexEntry = BaseIndexEntry & {
  type?: 'story';
};

interface V3IndexEntry extends BaseIndexEntry {
  parameters?: Parameters;
}

export interface StoryIndexV3 {
  v: 3;
  stories: Record<StoryId, V3IndexEntry>;
}

export type DocsIndexEntry = BaseIndexEntry & {
  storiesImports: Path[];
  type: 'docs';
};

export type IndexEntry = StoryIndexEntry | DocsIndexEntry;
export interface StoryIndex {
  v: number;
  entries: Record<StoryId, IndexEntry>;
}

const warnLegacyShowRoots = deprecate(
  () => {},
  dedent`
    The 'showRoots' config option is deprecated and will be removed in Storybook 7.0. Use 'sidebar.showRoots' instead.
    Read more about it in the migration guide: https://github.com/storybookjs/storybook/blob/master/MIGRATION.md
  `
);

const warnChangedDefaultHierarchySeparators = deprecate(
  () => {},
  dedent`
    The default hierarchy separators changed in Storybook 6.0.
    '|' and '.' will no longer create a hierarchy, but codemods are available.
    Read more about it in the migration guide: https://github.com/storybookjs/storybook/blob/master/MIGRATION.md
  `
);

export const denormalizeStoryParameters = ({
  globalParameters,
  kindParameters,
  stories,
}: SetStoriesPayload): SetStoriesStoryData => {
  return mapValues(stories, (storyData) => ({
    ...storyData,
    parameters: combineParameters(
      globalParameters,
      kindParameters[storyData.kind],
      storyData.parameters as unknown as Parameters
    ),
  }));
};

const TITLE_PATH_SEPARATOR = /\s*\/\s*/;

// We used to received a bit more data over the channel on the SET_STORIES event, including
// the full parameters for each story.
type PreparedIndexEntry = IndexEntry & {
  parameters?: Parameters;
  argTypes?: ArgTypes;
  args?: Args;
  initialArgs?: Args;
};
export interface PreparedStoryIndex {
  v: number;
  entries: Record<StoryId, PreparedIndexEntry>;
}

export const transformSetStoriesStoryDataToStoriesHash = (
  data: SetStoriesStoryData,
  { provider }: { provider: Provider }
) =>
  transformStoryIndexToStoriesHash(transformSetStoriesStoryDataToPreparedStoryIndex(data), {
    provider,
  });

const transformSetStoriesStoryDataToPreparedStoryIndex = (
  stories: SetStoriesStoryData
): PreparedStoryIndex => {
  const entries: PreparedStoryIndex['entries'] = Object.entries(stories).reduce(
    (acc, [id, story]) => {
      if (!story) return acc;

      const { docsOnly, fileName, ...parameters } = story.parameters;
      const base = {
        title: story.kind,
        id,
        name: story.name,
        importPath: fileName,
      };
      if (docsOnly) {
        acc[id] = {
          type: 'docs',
          storiesImports: [],
          ...base,
        };
      } else {
        const { argTypes, args, initialArgs } = story;
        acc[id] = {
          type: 'story',
          ...base,
          parameters,
          argTypes,
          args,
          initialArgs,
        };
      }
      return acc;
    },
    {} as PreparedStoryIndex['entries']
  );

  return { v: 4, entries };
};

const transformStoryIndexV3toV4 = (index: StoryIndexV3): PreparedStoryIndex => {
  const countByTitle = countBy(Object.values(index.stories), 'title');
  return {
    v: 4,
    entries: Object.values(index.stories).reduce((acc, entry) => {
      let type: IndexEntry['type'] = 'story';
      if (
        entry.parameters?.docsOnly ||
        (entry.name === 'Page' && countByTitle[entry.title] === 1)
      ) {
        type = 'docs';
      }
      acc[entry.id] = {
        type,
        ...(type === 'docs' && { storiesImports: [] }),
        ...entry,
      };
      return acc;
    }, {} as PreparedStoryIndex['entries']),
  };
};

export const transformStoryIndexToStoriesHash = (
  index: PreparedStoryIndex,
  {
    provider,
  }: {
    provider: Provider;
  }
): StoriesHash => {
  if (!index.v) throw new Error('Composition: Missing stories.json version');

  const v4Index = index.v === 4 ? index : transformStoryIndexV3toV4(index as any);

  const entryValues = Object.values(v4Index.entries);
  const { sidebar = {}, showRoots: deprecatedShowRoots } = provider.getConfig();
  const { showRoots = deprecatedShowRoots, collapsedRoots = [], renderLabel } = sidebar;
  const usesOldHierarchySeparator = entryValues.some(({ title }) => title.match(/\.|\|/)); // dot or pipe
  if (typeof deprecatedShowRoots !== 'undefined') {
    warnLegacyShowRoots();
  }

  const setShowRoots = typeof showRoots !== 'undefined';
  if (usesOldHierarchySeparator && !setShowRoots && FEATURES?.warnOnLegacyHierarchySeparator) {
    warnChangedDefaultHierarchySeparators();
  }

  const storiesHashOutOfOrder = Object.values(entryValues).reduce((acc, item) => {
    // First, split the title into a set of names, separated by '/' and trimmed.
    const { title } = item;
    const groups = title.trim().split(TITLE_PATH_SEPARATOR);
    const root = (!setShowRoots || showRoots) && groups.length > 1 ? [groups.shift()] : [];
    const names = [...root, ...groups];

    // Now create a "path" or sub id for each name
    const paths = names.reduce((list, name, idx) => {
      const parent = idx > 0 && list[idx - 1];
      const id = sanitize(parent ? `${parent}-${name}` : name);

      if (parent === id) {
        throw new Error(
          dedent`
          Invalid part '${name}', leading to id === parentId ('${id}'), inside title '${title}'
          
          Did you create a path that uses the separator char accidentally, such as 'Vue <docs/>' where '/' is a separator char? See https://github.com/storybookjs/storybook/issues/6128
          `
        );
      }
      list.push(id);
      return list;
    }, [] as string[]);

    // Now, let's add an entry to the hash for each path/name pair
    paths.forEach((id, idx) => {
      // The child is the next path, OR the story/docs entry itself
      const childId = paths[idx + 1] || item.id;

      if (root.length && idx === 0) {
        acc[id] = merge<RootEntry>((acc[id] || {}) as RootEntry, {
          type: 'root',
          id,
          name: names[idx],
          depth: idx,
          renderLabel,
          startCollapsed: collapsedRoots.includes(id),
          // Note that this will later get appended to the previous list of children (see below)
          children: [childId],

          // deprecated fields
          isRoot: true,
          isComponent: false,
          isLeaf: false,
        });
        // Usually the last path/name pair will be displayed as a component,
        // *unless* there are other stories that are more deeply nested under it
        //
        // For example, if we had stories for both
        //   - Atoms / Button
        //   - Atoms / Button / LabelledButton
        //
        // In this example the entry for 'atoms-button' would *not* be a component.
      } else if ((!acc[id] || acc[id].type === 'component') && idx === paths.length - 1) {
        acc[id] = merge<ComponentEntry>((acc[id] || {}) as ComponentEntry, {
          type: 'component',
          id,
          name: names[idx],
          parent: paths[idx - 1],
          depth: idx,
          renderLabel,
          ...(childId && {
            children: [childId],
          }),
          // deprecated fields
          isRoot: false,
          isComponent: true,
          isLeaf: false,
        });
      } else {
        acc[id] = merge<GroupEntry>((acc[id] || {}) as GroupEntry, {
          type: 'group',
          id,
          name: names[idx],
          parent: paths[idx - 1],
          depth: idx,
          renderLabel,
          ...(childId && {
            children: [childId],
          }),
          // deprecated fields
          isRoot: false,
          isComponent: false,
          isLeaf: false,
        });
      }
    });

    // Finally add an entry for the docs/story itself
    acc[item.id] = {
      type: 'story',
      ...item,
      depth: paths.length,
      parent: paths[paths.length - 1],
      renderLabel,
      ...(item.type !== 'docs' && { prepared: !!item.parameters }),

      // deprecated fields
      kind: item.title,
      isRoot: false,
      isComponent: false,
      isLeaf: true,
    } as DocsEntry | StoryEntry;

    return acc;
  }, {} as StoriesHash);

  // This function adds a "root" or "orphan" and all of its descendents to the hash.
  function addItem(acc: StoriesHash, item: HashEntry) {
    // If we were already inserted as part of a group, that's great.
    if (acc[item.id]) {
      return acc;
    }

    acc[item.id] = item;
    // Ensure we add the children depth-first *before* inserting any other entries
    if (item.type === 'root' || item.type === 'group' || item.type === 'component') {
      item.children.forEach((childId) => addItem(acc, storiesHashOutOfOrder[childId]));
    }
    return acc;
  }

  // We'll do two passes over the data, adding all the orphans, then all the roots
  const orphanHash = Object.values(storiesHashOutOfOrder)
    .filter((i) => i.type !== 'root' && !i.parent)
    .reduce(addItem, {});

  return Object.values(storiesHashOutOfOrder)
    .filter((i) => i.type === 'root')
    .reduce(addItem, orphanHash);
};

export const getComponentLookupList = memoize(1)((hash: StoriesHash) => {
  return Object.entries(hash).reduce((acc, i) => {
    const value = i[1];
    if (value.type === 'component') {
      acc.push([...value.children]);
    }
    return acc;
  }, [] as StoryId[][]);
});

export const getStoriesLookupList = memoize(1)((hash: StoriesHash) => {
  return Object.keys(hash).filter((k) => ['story', 'docs'].includes(hash[k].type));
});
