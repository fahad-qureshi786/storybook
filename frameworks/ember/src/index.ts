export {
  storiesOf,
  setAddon,
  addDecorator,
  addParameters,
  configure,
  getStorybook,
  forceReRender,
  raw,
} from './client/preview';

// optimization: stop HMR propagation in webpack
module?.hot?.decline();
