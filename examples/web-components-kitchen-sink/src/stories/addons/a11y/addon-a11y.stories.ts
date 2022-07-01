import { html } from 'lit';
import type { Meta, StoryFn } from '@storybook/web-components';

const text = 'Testing the a11y addon';

export default {
  title: 'Addons / A11y',
  parameters: {
    options: { selectedPanel: 'storybook/a11y/panel' },
  },
} as Meta;

export const Default: StoryFn = () => html`<button></button>`;
export const Label: StoryFn = () => html`<button>${text}</button>`;
export const Disabled: StoryFn = () => html`<button disabled>${text}</button>`;
export const InvalidContrast: StoryFn = () => html`
  <button style="color: black; background-color: brown;">${text}</button>
`;

export const DelayedRender: StoryFn = () => {
  const div = document.createElement('div');
  setTimeout(() => {
    div.innerHTML = `<button>This button has a delayed render of 1s</button>`;
  }, 1000);
  return div;
};
