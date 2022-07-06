import { useStorybookApi } from '@storybook/api';
import React, { FC, useEffect } from 'react';

import { ReleaseNotesScreen } from './release_notes';

const ReleaseNotesPage: FC = () => {
  const api = useStorybookApi();

  useEffect(() => {
    api.setDidViewReleaseNotes();
  }, []);

  const version = api.releaseNotesVersion();

  return <ReleaseNotesScreen version={version} />;
};

export { ReleaseNotesPage };
