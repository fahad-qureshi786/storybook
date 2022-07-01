/* eslint-disable storybook/use-storybook-testing-library */
// @TODO: use addon-interactions and remove the rule disable above
import React from 'react';
import type { ComponentEntry, StoriesHash } from '@storybook/api';
import { screen } from '@testing-library/dom';

import { Tree } from './Tree';
import { stories } from './mockdata.large';
import { DEFAULT_REF_ID } from './data';

export default {
  component: Tree,
  title: 'UI/Sidebar/Tree',
  excludeStories: /.*Data$/,
  parameters: { layout: 'fullscreen' },
  decorators: [(storyFn: any) => <div style={{ maxWidth: '230px' }}>{storyFn()}</div>],
};

const refId = DEFAULT_REF_ID;
const storyId = Object.values(stories).find((story) => story.type === 'story').id;

const log = (id: string) => console.log(id);

export const Full = () => {
  const [selectedId, setSelectedId] = React.useState(storyId);
  return (
    <Tree
      isBrowsing
      isMain
      refId={refId}
      data={stories}
      highlightedRef={{ current: { itemId: selectedId, refId } }}
      setHighlightedItemId={log}
      selectedStoryId={selectedId}
      onSelectStoryId={setSelectedId}
    />
  );
};

const tooltipStories = Object.keys(stories).reduce((acc, key) => {
  if (key === 'tooltip-tooltipselect--default') {
    acc['tooltip-tooltipselect--tooltipselect'] = {
      ...stories[key],
      id: 'tooltip-tooltipselect--tooltipselect',
      name: 'TooltipSelect',
    };
    return acc;
  }
  if (key === 'tooltip-tooltipselect') {
    acc[key] = {
      ...(stories[key] as ComponentEntry),
      children: ['tooltip-tooltipselect--tooltipselect'],
    };
    return acc;
  }
  if (key.startsWith('tooltip')) acc[key] = stories[key];
  return acc;
}, {} as StoriesHash);

const singleStoryComponent: StoriesHash = {
  single: {
    type: 'component',
    name: 'Single',
    id: 'single',
    parent: null,
    depth: 0,
    children: ['single--single'],
    renderLabel: () => <span>🔥 Single</span>,
  },
  'single--single': {
    type: 'story',
    id: 'single--single',
    title: 'Single',
    name: 'Single',
    prepared: true,
    args: {},
    argTypes: {},
    initialArgs: {},
    depth: 1,
    parent: 'single',
    renderLabel: () => <span>🔥 Single</span>,
    importPath: './single.stories.js',
  },
};
export const SingleStoryComponents = () => {
  const [selectedId, setSelectedId] = React.useState('tooltip-tooltipbuildlist--default');
  return (
    <Tree
      isBrowsing
      isMain
      refId={refId}
      data={{ ...singleStoryComponent, ...tooltipStories }}
      highlightedRef={{ current: { itemId: selectedId, refId } }}
      setHighlightedItemId={log}
      selectedStoryId={selectedId}
      onSelectStoryId={setSelectedId}
    />
  );
};

const docsOnlySinglesStoryComponent: StoriesHash = {
  single: {
    type: 'component',
    name: 'Single',
    id: 'single',
    parent: null,
    depth: 0,
    children: ['single--docs'],
  },
  'single--docs': {
    type: 'docs',
    id: 'single--docs',
    title: 'Single',
    name: 'Single',
    depth: 1,
    parent: 'single',
    importPath: './single.stories.js',
  },
};
export const DocsOnlySingleStoryComponents = () => {
  const [selectedId, setSelectedId] = React.useState('tooltip-tooltipbuildlist--default');
  return (
    <Tree
      isBrowsing
      isMain
      refId={refId}
      data={{ ...docsOnlySinglesStoryComponent, ...tooltipStories }}
      highlightedRef={{ current: { itemId: selectedId, refId } }}
      setHighlightedItemId={log}
      selectedStoryId={selectedId}
      onSelectStoryId={setSelectedId}
    />
  );
};

// node must be selected, highlighted, and focused
// in order to tab to 'Skip to canvas' link
export const SkipToCanvasLinkFocused = {
  args: {
    isBrowsing: true,
    isMain: true,
    refId,
    data: stories,
    highlightedRef: { current: { itemId: 'tooltip-tooltipbuildlist--default', refId } },
    setHighlightedItemId: log,
    selectedStoryId: 'tooltip-tooltipbuildlist--default',
    onSelectStoryId: () => {},
  },
  parameters: { chromatic: { delay: 300 } },
  play: () => {
    // focus each instance for chromatic/storybook's stacked theme
    screen.getAllByText('Skip to canvas').forEach((x) => x.focus());
  },
};
