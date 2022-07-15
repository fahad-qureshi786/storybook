import React from 'react';

import { action } from '@storybook/addon-actions';
import { Button } from '../react-demo';

export default {
  title: 'Button',

  parameters: {
    component: Button,
  },
};

export const WithText = () => <Button onClick={action('clicked')}>Hello Button</Button>;

export const WithSomeEmoji = () => (
  <Button onClick={action('clicked')}>
    <span role="img" aria-label="so cool">
      😀 😎 👍 💯
    </span>
  </Button>
);

WithSomeEmoji.storyName = 'with some emoji';
