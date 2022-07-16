import type { Builder } from '@storybook/core-common';

import type { BuildOptions, BuildResult } from 'esbuild';

export interface Stats {
  //
  toJson: () => any;
}

export type WithRequiredProperty<Type, Key extends keyof Type> = Type &
  {
    [Property in Key]-?: Type[Property];
  };

export type ManagerBuilder = Builder<WithRequiredProperty<BuildOptions, 'outdir'>, Stats>;
export type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

export type BuilderStartOptions = Parameters<ManagerBuilder['start']>['0'];
export type BuilderStartResult = Unpromise<ReturnType<ManagerBuilder['start']>>;
export type StarterFunction = (
  options: BuilderStartOptions
) => AsyncGenerator<unknown, BuilderStartResult | void, void>;

export type BuilderBuildOptions = Parameters<ManagerBuilder['build']>['0'];
export type BuilderBuildResult = Unpromise<ReturnType<ManagerBuilder['build']>>;
export type BuilderFunction = (
  options: BuilderBuildOptions
) => AsyncGenerator<unknown, BuilderBuildResult, void>;

export type Compilation = BuildResult;
