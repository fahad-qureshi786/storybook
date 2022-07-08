import path from 'path';
import { mount } from 'enzyme';
import initStoryshots from '../src/index';

initStoryshots({
  framework: 'react',
  configPath: path.join(__dirname, '..', '.storybook'),
  renderer: mount,
});
