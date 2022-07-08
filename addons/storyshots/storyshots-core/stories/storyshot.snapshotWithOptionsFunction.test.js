import path from 'path';
import initStoryshots, { snapshotWithOptions } from '../src/index';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  test: snapshotWithOptions(() => ({})),
});
