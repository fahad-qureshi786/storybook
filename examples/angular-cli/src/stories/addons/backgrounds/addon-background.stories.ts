import type { Meta, StoryFn } from '@storybook/angular';
import { Button } from '../../angular-demo';

export default {
  title: 'Addons / Backgrounds',
  component: Button,
  parameters: {
    backgrounds: {
      default: 'twitter',
      values: [
        { name: 'twitter', value: '#00aced' },
        { name: 'facebook', value: '#3b5998' },
      ],
    },
  },
} as Meta;

export const WithComponent: StoryFn = () => ({
  props: { text: 'Button' },
});

export const WithTemplate: StoryFn = () => ({
  template: `<storybook-button-component [text]="text" (onClick)="onClick($event)"></storybook-button-component>`,
  props: { text: 'Button' },
});

export const Overridden = () => ({
  props: { text: 'This one should have different backgrounds' },
});
Overridden.parameters = {
  backgrounds: {
    default: 'pink',
    values: [
      { name: 'pink', value: 'hotpink' },
      { name: 'blue', value: 'deepskyblue' },
    ],
  },
};
