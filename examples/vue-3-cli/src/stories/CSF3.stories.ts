import { userEvent, within } from '@storybook/testing-library';
import type { Meta, Story } from '@storybook/vue3';
import Button from './Button.vue';

export default {
  title: 'Example/ButtonCSF3',
  component: Button,
} as Meta;

export const Default: Story = { args: { label: 'Default' } };

export const Primary: Story = {
  args: {
    label: 'Primary',
    primary: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
  },
};
