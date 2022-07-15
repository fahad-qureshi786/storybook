import { once } from '@storybook/client-logger';

/**
 * No longer supported, only here to help with error handling
 */
export const CURRENT_SELECTION = '.';
export const currentSelectionWarning = () =>
  once.warn(
    '`of="."` (current selection) is no longer supported in doc blocks. Falling back to primary story'
  );

export const PRIMARY_STORY = '^';

export type Component = any;

export interface StoryData {
  id?: string;
  kind?: string;
  name?: string;
  parameters?: any;
}

export type DocsStoryProps = StoryData & {
  expanded?: boolean;
  withToolbar?: boolean;
};
