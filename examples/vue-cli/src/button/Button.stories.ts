import type { Meta, StoryFn } from '@storybook/vue';
import Button from './Button.vue';

export default {
  title: 'Button',
  component: Button,
  parameters: {
    controls: {
      expanded: true,
    },
  },
} as Meta;

export const ButtonWithProps: StoryFn = (args, { argTypes }) => ({
  components: { Button },
  template: '<Button :size="size">Button text</Button>',
  props: Object.keys(argTypes),
});
ButtonWithProps.args = {
  size: 'big',
};

export const WithDefaultRender = {
  args: {
    size: 'small',
    label: 'Button with default render',
  },
};
