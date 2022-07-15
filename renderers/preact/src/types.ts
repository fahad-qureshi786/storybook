import type { AnyComponent } from 'preact';

export type { RenderContext } from '@storybook/core-client';

export type StoryFnPreactReturnType = string | Node | preact.JSX.Element;

export interface ShowErrorArgs {
  title: string;
  description: string;
}

export interface IStorybookStory {
  name: string;
  render: (context: any) => any;
}

export interface IStorybookSection {
  kind: string;
  stories: IStorybookStory[];
}

export type PreactFramework = {
  component: AnyComponent<any, any>;
  storyResult: StoryFnPreactReturnType;
};
