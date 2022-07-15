import React from 'react';
import { action } from '@storybook/addon-actions';
import PropTypes from 'prop-types';
import { Button } from '../components/react-demo';

const Bold = ({ children }) => {
  return <b>{children}</b>;
};

Bold.propTypes = {
  children: PropTypes.string.isRequired,
};

export default {
  title: 'Decorators',
  component: Button,
  decorators: [
    (Story) => (
      <div style={{ padding: 25, border: '3px solid red' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithArgs = (args) => <Button {...args} />;
WithArgs.args = { onClick: action('clicked', { depth: 1 }), children: 'With args' };

export const Basic = () => <Button onClick={action('clicked', { depth: 1 })}>Basic</Button>;

export const Nested = (args) => (
  <Button {...args}>
    <Bold>Hello</Bold>
  </Button>
);
Nested.args = { onClick: action('clicked', { depth: 1 }) };
