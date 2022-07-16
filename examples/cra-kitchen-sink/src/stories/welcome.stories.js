import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { Welcome } from '../components/react-demo';

export default {
  title: 'Welcome',
  component: Welcome,
};

export const Story1 = () => <Welcome showApp={linkTo('Button')} />;
Story1.title = 'to Storybook';
