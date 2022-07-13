import React, { useContext, FC } from 'react';

import { DocsContext } from './DocsContext';
import { DocsStory } from './DocsStory';

interface PrimaryProps {
  name?: string;
}

export const Primary: FC<PrimaryProps> = ({ name }) => {
  const docsContext = useContext(DocsContext);
  const storyId = name && docsContext.storyIdByName(name);
  const story = docsContext.storyById(storyId);
  return story ? <DocsStory {...story} expanded={false} withToolbar /> : null;
};
