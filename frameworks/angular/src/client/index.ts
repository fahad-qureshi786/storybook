import './globals';

export * from './public-api';
export * from './public-types';

export type { StoryFnAngularReturnType as IStory } from './types';

export { moduleMetadata, componentWrapperDecorator } from './decorators';

// optimization: stop HMR propagation in webpack
module?.hot?.decline();
