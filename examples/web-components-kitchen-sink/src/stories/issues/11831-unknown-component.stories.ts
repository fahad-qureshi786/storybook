import { html } from 'lit';
import type { Meta, StoryFn } from '@storybook/web-components';

export default {
  title: 'Issues / 11831 Unknown component',
  component: 'unknown-component',
} as Meta;

const Template: StoryFn = ({ backSide, header, rows }) =>
  html`
    <demo-wc-card .backSide="${backSide}" .header="${header}" .rows="${rows}"
      >A simple card</demo-wc-card
    >
  `;

export const Front = Template.bind({});
Front.args = { backSide: false, header: undefined, rows: [] };
