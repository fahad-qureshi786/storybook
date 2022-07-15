import React from 'react';
import { actions as createActions } from '@storybook/addon-actions';

import { AboutScreen } from './about';

const info = {
  plain: `- upgrade webpack & babel to latest\n- new addParameters and third argument to .add to pass data to addons\n- added the ability to theme storybook\n- improved ui for mobile devices\n- improved performance of addon-knobs`,
};

export default {
  component: AboutScreen,
  title: 'UI/Settings/AboutScreen',
  decorators: [
    (storyFn) => (
      <div
        style={{
          position: 'relative',
          height: '100vh',
          width: '100vw',
        }}
      >
        {storyFn()}
      </div>
    ),
  ],
};

const actions = createActions('onClose');

export const UpToDate = () => (
  <AboutScreen latest={{ version: '7.0.0', info }} current={{ version: '7.0.0' }} {...actions} />
);

export const OldVersionRaceCondition = () => (
  <AboutScreen latest={{ version: '7.0.0', info }} current={{ version: '7.0.3' }} {...actions} />
);

export const NewVersionRequired = () => (
  <AboutScreen latest={{ version: '7.0.3', info }} current={{ version: '7.0.0' }} {...actions} />
);

export const FailedToFetchNewVersion = () => (
  <AboutScreen current={{ version: '7.0.0' }} {...actions} />
);
