import path from 'path';
import initStoryshots, { renderOnly } from '../src/index';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  test: renderOnly,
});
