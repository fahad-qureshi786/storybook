import type { Meta, StoryFn } from '@storybook/angular';
import { Button } from '../../angular-demo';

export default {
  title: 'Core / Parameters / Layout',
  component: Button,
} as Meta;

export const Default: StoryFn = () => ({
  props: { text: 'Button' },
});

export const Fullscreen: StoryFn = () => ({
  template: `<div style="background-color: yellow;"><storybook-button-component text="Button"></storybook-button-component></div>`,
});
Fullscreen.parameters = { layout: 'fullscreen' };

export const Centered: StoryFn = () => ({
  props: { text: 'Button' },
});
Centered.parameters = { layout: 'centered' };

export const Padded: StoryFn = () => ({
  props: { text: 'Button' },
});
Padded.parameters = { layout: 'padded' };

export const None: StoryFn = () => ({
  props: { text: 'Button' },
});
None.parameters = { layout: 'none' };
