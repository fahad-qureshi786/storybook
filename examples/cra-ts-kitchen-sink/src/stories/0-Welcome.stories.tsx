import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { Welcome } from '../components/react-demo';

export default {
  title: 'Welcome',
  component: Welcome,
};

export const ToStorybook = () => <Welcome showApp={linkTo('Button')} />;

ToStorybook.storyName = 'to Storybook';
