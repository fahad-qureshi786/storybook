import type { StoryContext as StoryContextBase } from '@storybook/csf';
import type { TemplateResult, SVGTemplateResult } from 'lit-html';

export type StoryFnHtmlReturnType = string | Node | TemplateResult | SVGTemplateResult;

export type StoryContext = StoryContextBase<WebComponentsFramework>;

export type WebComponentsFramework = {
  component: string;
  storyResult: StoryFnHtmlReturnType;
};

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
