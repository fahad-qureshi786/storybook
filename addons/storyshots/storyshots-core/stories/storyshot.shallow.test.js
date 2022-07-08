import path from 'path';
import initStoryshots, { shallowSnapshot } from '../src/index';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  test: shallowSnapshot,
});
