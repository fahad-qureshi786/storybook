import React from 'react';
import type { ComponentMeta, StoryFn, ComponentStoryFn } from '@storybook/react';
import TsButton from '../../components/TsButton';

export default {
  title: 'Other/Demo/TsButton',
  component: TsButton,
  decorators: [
    (StoryFn) => (
      <>
        <StoryFn />
      </>
    ),
  ],
} as ComponentMeta<typeof TsButton>;

const Template: StoryFn = (args) => <TsButton {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  type: 'default',
  children: 'basic',
};

const TypedTemplate: ComponentStoryFn<typeof TsButton> = (args) => <TsButton {...args} />;

export const Typed = TypedTemplate.bind({});
Typed.args = {
  type: 'action',
  children: 'typed',
  foo: 'bar', // should be a type error?
};
