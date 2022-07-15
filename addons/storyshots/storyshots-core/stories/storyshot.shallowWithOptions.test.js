import path from 'path';
import initStoryshots, { shallowSnapshot } from '../dist/types';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  test: (data) =>
    shallowSnapshot({
      ...data,
    }),
});
