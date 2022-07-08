import path from 'path';
import initStoryshots, { renderOnly } from '../dist/types';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  test: renderOnly,
});
