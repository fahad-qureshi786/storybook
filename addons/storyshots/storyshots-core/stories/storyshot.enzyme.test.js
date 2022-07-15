import path from 'path';
import { mount } from 'enzyme';
import initStoryshots from '../dist/types';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  renderer: mount,
});
