import { SourceType, enhanceArgTypes } from '@storybook/docs-tools';
import { extractArgTypes, extractComponentDescription } from './compodoc';
import { sourceDecorator } from './sourceDecorator';

export const parameters = {
  docs: {
    // probably set this to true by default once it's battle-tested
    inlineStories: false,
    extractArgTypes,
    extractComponentDescription,
    source: {
      type: SourceType.DYNAMIC,
      language: 'html',
    },
  },
};

export const decorators = [sourceDecorator];

export const argTypesEnhancers = [enhanceArgTypes];
