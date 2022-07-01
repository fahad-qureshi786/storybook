import React, { useEffect } from 'react';
import { useChannel } from '@storybook/addons';
import { HIGHLIGHT } from '@storybook/addon-highlight';
import { themes, convert } from '@storybook/theming';

import Button from '../../components/addon-a11y/Button';

const text = 'Testing the a11y highlight';

export default {
  title: 'Addons/A11y/Highlight',
  component: Button,
  parameters: {
    options: { selectedPanel: 'storybook/a11y/panel' },
  },
  decorators: [(storyFn) => <div style={{ padding: 10 }}>{storyFn()}</div>],
};

export const Passes = () => {
  const emit = useChannel({});

  useEffect(() => {
    emit(HIGHLIGHT, {
      elements: ['p'],
      color: convert(themes.light).color.positive,
    });
  }, []);

  return <p>{text}</p>;
};

export const Incomplete = () => {
  const emit = useChannel({});

  useEffect(() => {
    emit(HIGHLIGHT, {
      elements: ['p'],
      color: convert(themes.light).color.warning,
    });
  }, []);

  return <p>{text}</p>;
};

export const Violations = () => {
  const emit = useChannel({});

  useEffect(() => {
    emit(HIGHLIGHT, {
      elements: ['p'],
      color: convert(themes.light).color.negative,
    });
  }, []);

  return <p>{text}</p>;
};
