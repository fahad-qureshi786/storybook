import React, { FC } from 'react';

import { Consumer } from '@storybook/api';

import { ShortcutsScreen } from './shortcuts';

const ShortcutsPage: FC = () => (
  <Consumer>
    {({
      api: {
        getShortcutKeys,
        getAddonsShortcutLabels,
        setShortcut,
        restoreDefaultShortcut,
        restoreAllDefaultShortcuts,
      },
    }) => (
      <ShortcutsScreen
        shortcutKeys={getShortcutKeys()}
        addonsShortcutLabels={getAddonsShortcutLabels()}
        {...{ setShortcut, restoreDefaultShortcut, restoreAllDefaultShortcuts }}
      />
    )}
  </Consumer>
);

export { ShortcutsPage };
