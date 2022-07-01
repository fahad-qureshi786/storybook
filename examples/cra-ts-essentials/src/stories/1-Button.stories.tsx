import React from 'react';
import type { ComponentStoryFn, ComponentMeta } from '@storybook/react';
import { Button } from './react-demo';

export default {
  title: 'Button',
  component: Button,
  argTypes: { onClick: { action: 'clicked' } },
} as ComponentMeta<typeof Button>;

const Template: ComponentStoryFn<typeof Button> = (args) => <Button {...args} />;

export const Text = Template.bind({});
Text.args = {
  children: 'Hello button',
};

export const Emoji = Template.bind({});
Emoji.args = {
  children: '😀 😎 👍 💯',
};
