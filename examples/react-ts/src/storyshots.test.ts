import path from 'path';
import initStoryshots from '../../../addons/storyshots/storyshots-core/src';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
});
