import type { Meta, StoryFn } from '@storybook/angular';
import { linkTo } from '@storybook/addon-links';
import { AppComponent } from '../app/app.component';

export default {
  title: 'Welcome/ To Angular',
} as Meta;

export const ToAngular: StoryFn = () => ({
  component: AppComponent,
  props: {
    showApp: linkTo('Button'),
  },
});
