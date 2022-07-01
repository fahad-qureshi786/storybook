import React, { FunctionComponent } from 'react';
import { Subheading } from './Subheading';
import { DocsStoryProps } from './types';
import { Anchor } from './Anchor';
import { Description } from './Description';
import { Story } from './Story';
import { Canvas } from './Canvas';

export const DocsStory: FunctionComponent<DocsStoryProps> = ({
  id,
  name,
  expanded = true,
  withToolbar = false,
  parameters = {},
}) => {
  let description;
  const { docs } = parameters;
  if (expanded && docs) {
    description = docs.description?.story;
  }

  const subheading = expanded && name;

  return (
    <Anchor storyId={id}>
      {subheading && <Subheading>{subheading}</Subheading>}
      {description && <Description markdown={description} />}
      <Canvas withToolbar={withToolbar}>
        <Story id={id} parameters={parameters} />
      </Canvas>
    </Anchor>
  );
};
