import type { Meta, StoryFn } from '@storybook/angular';
import { Component } from '@angular/core';

@Component({
  selector: 'component-with-whitespace',
  template: ` <div>
    <p>Some content</p>
  </div>`,
})
class ComponentWithWhitespace {}

export default {
  title: 'Core / Parameters / With Bootstrap Options',
  parameters: {
    bootstrapOptions: {
      preserveWhitespaces: true,
    },
  },
  component: ComponentWithWhitespace,
} as Meta;

export const WithPreserveWhitespaces: StoryFn = (_args) => ({});
