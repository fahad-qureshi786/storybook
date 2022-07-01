import { addParameters } from '@storybook/angular';
import type { Meta, StoryFn } from '@storybook/angular';
import { Button } from '../../angular-demo';

const globalParameter = 'globalParameter';
const chapterParameter = 'chapterParameter';
const storyParameter = 'storyParameter';

addParameters({ globalParameter });

export default {
  title: 'Core / Parameters / All parameters',
  parameters: {
    chapterParameter,
  },
} as Meta;

export const PassedToStory: StoryFn = (_args, { parameters: { fileName, ...parameters } }) => ({
  component: Button,
  props: {
    text: `Parameters are ${JSON.stringify(parameters, null, 2)}`,
    onClick: () => 0,
  },
});

PassedToStory.storyName = 'All parameters passed to story';
PassedToStory.parameters = { storyParameter };
