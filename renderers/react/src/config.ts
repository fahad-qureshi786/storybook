import { parameters as docsParams } from './docs/config';

export const parameters = {
  framework: 'react',
  ...docsParams,
};

export { decorators, argTypesEnhancers } from './docs/config';

export { render, renderToDOM } from './render';
