import type { Meta, StoryFn } from '@storybook/angular';
import { Button } from '../angular-demo';

export default {
  title: 'Legacy / Component in Story',
} as Meta;

export const Basic: StoryFn = (args) => ({
  component: Button,
  props: args,
});
Basic.args = {
  text: 'Hello Button',
};
