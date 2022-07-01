import type { Meta, StoryFn } from '@storybook/angular';
import { TokenComponent, ITEMS, DEFAULT_NAME } from './angular-src/token.component';

export default {
  title: 'Core / ModuleMetadata / In stories',
} as Meta;

export const Individual1: StoryFn = () => ({
  template: `<storybook-simple-token-component [name]="name"></storybook-simple-token-component>`,
  props: {
    name: 'Prop Name',
  },
  moduleMetadata: {
    imports: [],
    declarations: [TokenComponent],
    providers: [
      {
        provide: ITEMS,
        useValue: ['Joe', 'Jane'],
      },
    ],
  },
});

Individual1.storyName = 'Individual 1';

export const Individual2: StoryFn = () => ({
  template: `<storybook-simple-token-component></storybook-simple-token-component>`,
  moduleMetadata: {
    imports: [],
    declarations: [TokenComponent],
    providers: [
      {
        provide: ITEMS,
        useValue: ['Jim', 'Jill'],
      },
      {
        provide: DEFAULT_NAME,
        useValue: 'Provider Name',
      },
    ],
  },
});

Individual2.storyName = 'Individual 2';
