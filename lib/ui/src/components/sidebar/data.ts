import type { HashEntry, StoriesHash, StoryEntry } from '@storybook/api';
import { Item } from './types';

export const DEFAULT_REF_ID = 'storybook_internal';

function isLeaf(entry: HashEntry) {
  return entry.type === 'story' || entry.type === 'docs';
}

export const collapseAllStories = (stories: StoriesHash) => {
  // keep track of component IDs that have been rewritten to the ID of their first leaf child
  const componentIdToLeafId: Record<string, string> = {};

  // 1) remove all leaves
  const leavesRemoved = Object.values(stories).filter((item) => !isLeaf(item));

  // 2) make all components leaves and rewrite their ID's to the first leaf child
  const componentsFlattened = leavesRemoved.map((item: HashEntry) => {
    // this is a folder, so just leave it alone
    if (item.type !== 'component') {
      return item;
    }

    const { id, children, name, parent, depth } = item;

    const nonLeafChildren: string[] = [];
    const leafChildren: string[] = [];
    children.forEach((child: string) =>
      (isLeaf(stories[child]) ? leafChildren : nonLeafChildren).push(child)
    );

    if (leafChildren.length === 0) {
      return item; // pass through, we'll handle you later
    }

    const leaf = stories[leafChildren[0]] as StoryEntry;
    const component = {
      ...leaf,
      name,
      parent,
      depth,
    };
    componentIdToLeafId[id] = leaf.id;

    // this is a component, so it should not have any non-leaf children
    if (nonLeafChildren.length !== 0) {
      throw new Error(`Unexpected '${item.id}': ${JSON.stringify({ nonLeafChildren })}`);
    }

    return component;
  });

  // 3) rewrite all the children as needed
  const childrenRewritten = componentsFlattened.map((item) => {
    if (item.type === 'root' || item.type === 'group' || item.type === 'component') {
      const { children, ...rest } = item;
      const rewritten = children.map((child: string) => componentIdToLeafId[child] || child);

      return { children: rewritten, ...rest };
    }
    return item;
  });

  const result = {} as StoriesHash;
  childrenRewritten.forEach((item) => {
    result[item.id] = item as Item;
  });
  return result;
};
