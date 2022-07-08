import { SourceType, enhanceArgTypes } from '@storybook/docs-tools';
import { extractArgTypes, extractComponentDescription } from './custom-elements';
import { sourceDecorator } from './sourceDecorator';

export const decorators = [sourceDecorator];

export const parameters = {
  docs: {
    extractArgTypes,
    extractComponentDescription,
    inlineStories: true,
    source: {
      type: SourceType.DYNAMIC,
      language: 'html',
    },
  },
};

export const argTypesEnhancers = [enhanceArgTypes];
