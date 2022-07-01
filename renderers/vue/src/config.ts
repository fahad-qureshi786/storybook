import { parameters as docsParams } from './docs/config';

export const parameters = { framework: 'vue' as const, ...docsParams };
export { decorators, argTypesEnhancers } from './docs/config';

export { render, renderToDOM } from './render';
export { decorateStory as applyDecorators } from './decorateStory';
