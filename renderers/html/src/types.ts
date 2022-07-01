import type { StoryContext as DefaultStoryContext } from '@storybook/csf';
import { parameters } from './config';

export type { RenderContext } from '@storybook/core-client';

export type StoryFnHtmlReturnType = string | Node;

export interface IStorybookStory {
  name: string;
  render: (context: any) => any;
}

export interface IStorybookSection {
  kind: string;
  stories: IStorybookStory[];
}

export interface ShowErrorArgs {
  title: string;
  description: string;
}

export type HtmlFramework = {
  component: HTMLElement;
  storyResult: StoryFnHtmlReturnType;
};

export type StoryContext = DefaultStoryContext<HtmlFramework> & {
  parameters: DefaultStoryContext<HtmlFramework>['parameters'] & typeof parameters;
};
