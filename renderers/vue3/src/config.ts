import { parameters as docsParams } from './docs/config';

export const parameters = { framework: 'vue3' as const, ...docsParams };
export { argTypesEnhancers } from './docs/config';

export { render, renderToDOM } from './render';
export { decorateStory as applyDecorators } from './decorateStory';
