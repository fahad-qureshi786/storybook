import { enhanceArgTypes } from '@storybook/docs-tools';
import { extractArgTypes } from './extractArgTypes';
import { extractComponentDescription } from './extractComponentDescription';
import { sourceDecorator } from './sourceDecorator';

export const parameters = {
  docs: {
    inlineStories: true,
    extractArgTypes,
    extractComponentDescription,
  },
};

export const decorators = [sourceDecorator];

export const argTypesEnhancers = [enhanceArgTypes];
