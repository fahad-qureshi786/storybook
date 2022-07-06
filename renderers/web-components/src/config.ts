import { parameters as docsParams } from './docs/config';

export const parameters = { framework: 'web-components' as const, ...docsParams };
export { decorators, argTypesEnhancers } from './docs/config';
export { renderToDOM } from './render';
