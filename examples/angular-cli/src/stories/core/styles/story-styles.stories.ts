import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { Button } from '../../angular-demo';

export default {
  title: 'Core / Story host styles',
  decorators: [
    moduleMetadata({
      declarations: [Button],
    }),
  ],
} as Meta;

export const TemplateStory: StoryFn = () => ({
  template: `<storybook-button-component [text]="text" (onClick)="onClick($event)"></storybook-button-component>`,
  props: {
    text: 'Button with custom styles',
    onClick: action('log'),
  },
  styles: [
    `
      storybook-button-component {
        background-color: yellow;
        padding: 25px;
      }
    `,
  ],
});
TemplateStory.storyName = 'With story template';

export const WithArgsStory: StoryFn = (args) => ({
  template: `<storybook-button-component [text]="text" (onClick)="onClick($event)"></storybook-button-component>`,
  props: args,
  styles: [
    `
  storybook-button-component {
    background-color: red;
    padding: 25px;
  }
`,
  ],
});
WithArgsStory.storyName = 'With Args';
WithArgsStory.argTypes = {
  text: { control: 'text' },
  onClick: { action: 'On click' },
};
WithArgsStory.args = {
  text: 'Button with custom styles',
};
