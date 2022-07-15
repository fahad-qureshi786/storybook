export type { RenderContext } from '@storybook/core-client';

export interface ShowErrorArgs {
  title: string;
  description: string;
}

export interface OptionsArgs {
  template: any;
  context: any;
  element: any;
}

export type EmberFramework = {
  component: any;
  storyResult: OptionsArgs;
};
