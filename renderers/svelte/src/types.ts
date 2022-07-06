import type { StoryContext as StoryContextBase } from '@storybook/csf';

export type { RenderContext } from '@storybook/core-client';

export type StoryContext = StoryContextBase<SvelteFramework>;

export interface ShowErrorArgs {
  title: string;
  description: string;
}

export interface MountViewArgs {
  Component: any;
  target: any;
  props: MountProps;
  on: any;
  Wrapper: any;
  WrapperData: any;
}

interface MountProps {
  rounded: boolean;
  text: string;
}

interface WrapperData {
  innerStyle: string;
  style: string;
}

export type SvelteFramework = {
  component: any;
  storyResult: any;
};
