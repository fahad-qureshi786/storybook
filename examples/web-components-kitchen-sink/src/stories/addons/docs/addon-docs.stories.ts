import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import type { Meta, StoryFn } from '@storybook/web-components';
import mdxNotes from './notes/notes.mdx';

export default {
  title: 'Addons / Docs / Stories',
} as Meta;

export const Basic: StoryFn = () => html`<div>Click docs tab to see basic docs</div>`;

export const NoDocs: StoryFn = () => html`<div>Click docs tab to see no docs error</div>`;
NoDocs.parameters = { docs: { page: null } };

export const LargerThanPreview: StoryFn = () =>
  html`<div style=${styleMap({ width: '1000px', backgroundColor: 'pink' })}>HUGE</div>`;

export const MdxOverride: StoryFn = () =>
  html`<div>Click docs tab to see MDX-overridden docs</div>`;
MdxOverride.parameters = {
  docs: { page: mdxNotes },
};

export const InlineOverride: StoryFn = () =>
  html`<div>Click docs tab to see JSX-overridden docs</div>`;
InlineOverride.parameters = {
  docs: { page: () => html`<div>Hello docs</div>` },
};

export const DocsDisable: StoryFn = () => html`<div>This story shouldn't show up in DocsPage</div>`;
DocsDisable.parameters = {
  docs: { disable: true },
};
