import global from 'global';
import React from 'react';

import type { Combo, StoriesHash } from '@storybook/api';
import { Consumer } from '@storybook/api';

import { Preview } from '../components/preview/preview';

const { PREVIEW_URL } = global;

export type Item = StoriesHash[keyof StoriesHash];

const splitTitleAddExtraSpace = (input: string) =>
  input.split('/').join(' / ').replace(/\s\s/, ' ');

const getDescription = (item: Item) => {
  if (item?.type === 'story' || item?.type === 'docs') {
    const { title, name } = item;
    return title && name ? splitTitleAddExtraSpace(`${title} - ${name} ⋅ Storybook`) : 'Storybook';
  }

  return item?.name ? `${item.name} ⋅ Storybook` : 'Storybook';
};

const mapper = ({ api, state }: Combo) => {
  const { layout, location, customQueryParams, storyId, refs, viewMode, path, refId } = state;
  const story = api.getData(storyId, refId);
  const docsOnly = story?.type === 'docs';

  return {
    api,
    story,
    options: layout,
    description: getDescription(story),
    viewMode,
    path,
    refs,
    storyId,
    baseUrl: PREVIEW_URL || 'iframe.html',
    queryParams: customQueryParams,
    docsOnly,
    location,
  };
};

const PreviewConnected = React.memo<{ id: string; withLoader: boolean }>((props) => (
  <Consumer filter={mapper}>{(fromState) => <Preview {...props} {...fromState} />}</Consumer>
));

export default PreviewConnected;
