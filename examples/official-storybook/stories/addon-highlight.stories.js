import React from 'react';
import { useChannel } from '@storybook/addons';
import { HIGHLIGHT, RESET_HIGHLIGHT } from '@storybook/addon-highlight';
import { Page } from '../components/page/Page';

export default {
  title: 'Addons/Highlight',
  component: Page,
};

const Template = () => <Page />;

export const OneSelector = Template.bind({});
OneSelector.decorators = [
  (storyFn) => {
    const emit = useChannel({});

    emit(HIGHLIGHT, {
      elements: ['.page-title'],
    });

    return storyFn();
  },
];

export const MultipleSelectors = Template.bind({});
MultipleSelectors.decorators = [
  (storyFn) => {
    const emit = useChannel({});

    emit(HIGHLIGHT, {
      elements: ['a', 'button'],
    });

    return storyFn();
  },
];

export const CustomColor = Template.bind({});
CustomColor.decorators = [
  (storyFn) => {
    const emit = useChannel({});

    emit(HIGHLIGHT, {
      elements: ['.tip-wrapper'],
      color: '#6c1d5c',
      style: 'solid',
    });

    return storyFn();
  },
];

export const OutlineStyle = Template.bind({});
OutlineStyle.decorators = [
  (storyFn) => {
    const emit = useChannel({});

    emit(HIGHLIGHT, {
      elements: ['.page-title'],
      color: '#6c1d5c',
      style: 'double',
    });

    return storyFn();
  },
];

export const MultipleEvents = Template.bind({});
MultipleEvents.decorators = [
  (storyFn) => {
    const emit = useChannel({});

    emit(HIGHLIGHT, {
      elements: ['.tip-wrapper'],
      color: '#6c1d5c',
      style: 'solid',
    });

    emit(HIGHLIGHT, {
      elements: ['ul'],
      color: '#6c1d5c',
      style: 'dotted',
    });
    return storyFn();
  },
];

export const Reset = Template.bind({});
Reset.decorators = [
  (storyFn) => {
    const emit = useChannel({});

    emit(HIGHLIGHT, {
      elements: ['ul'],
      color: '#6c1d5c',
      style: 'dotted',
    });

    emit(RESET_HIGHLIGHT);

    return storyFn();
  },
];
