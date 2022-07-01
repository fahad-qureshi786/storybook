import { Component } from '@angular/core';

import type { Meta, StoryFn } from '@storybook/angular/';

@Component({
  selector: 'storybook-with-ng-content',
  template: `Content value:
    <div style="color: #1e88e5;"><ng-content></ng-content></div>`,
})
class WithNgContentComponent {}

export default {
  title: 'Basics / Component / With ng-content / Simple',
  component: WithNgContentComponent,
} as Meta;

export const OnlyComponent: StoryFn = () => ({});

export const Default: StoryFn = () => ({
  template: `<storybook-with-ng-content><h1>This is rendered in ng-content</h1></storybook-with-ng-content>`,
});

export const WithDynamicContentAndArgs: StoryFn = (args) => ({
  template: `<storybook-with-ng-content><h1>${args.content}</h1></storybook-with-ng-content>`,
});
WithDynamicContentAndArgs.argTypes = {
  content: { control: 'text' },
};
WithDynamicContentAndArgs.args = { content: 'Default content' };
