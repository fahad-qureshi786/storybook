import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  targetFromTargetString,
  Target,
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { from, Observable, of, throwError } from 'rxjs';
import type { CLIOptions } from '@storybook/core-common';
import { catchError, map, mapTo, switchMap } from 'rxjs/operators';
import { sync as findUpSync } from 'find-up';
import { sync as readUpSync } from 'read-pkg-up';
import {
  BrowserBuilderOptions,
  ExtraEntryPoint,
  StylePreprocessorOptions,
} from '@angular-devkit/build-angular';

import { buildStaticStandalone } from '@storybook/core-server';
import type { StandaloneOptions } from '../utils/standalone-options';
import { runCompodoc } from '../utils/run-compodoc';
import { buildStandaloneErrorHandler } from '../utils/build-standalone-errors-handler';

export type StorybookBuilderOptions = JsonObject & {
  browserTarget?: string | null;
  tsConfig?: string;
  compodoc: boolean;
  compodocArgs: string[];
  styles?: ExtraEntryPoint[];
  stylePreprocessorOptions?: StylePreprocessorOptions;
} & Pick<
    // makes sure the option exists
    CLIOptions,
    'outputDir' | 'configDir' | 'loglevel' | 'quiet' | 'docs' | 'webpackStatsJson'
  >;

export type StorybookBuilderOutput = JsonObject & BuilderOutput & {};

export default createBuilder<any, any>(commandBuilder);

function commandBuilder(
  options: StorybookBuilderOptions,
  context: BuilderContext
): Observable<StorybookBuilderOutput> {
  return from(setup(options, context)).pipe(
    switchMap(({ tsConfig }) => {
      const runCompodoc$ = options.compodoc
        ? runCompodoc({ compodocArgs: options.compodocArgs, tsconfig: tsConfig }, context).pipe(
            mapTo({ tsConfig })
          )
        : of({});

      return runCompodoc$.pipe(mapTo({ tsConfig }));
    }),
    map(({ tsConfig }) => {
      const {
        browserTarget,
        stylePreprocessorOptions,
        styles,
        configDir,
        docs,
        loglevel,
        outputDir,
        quiet,
        webpackStatsJson,
      } = options;

      const standaloneOptions: StandaloneOptions = {
        packageJson: readUpSync({ cwd: __dirname }).packageJson,
        configDir,
        docs,
        loglevel,
        outputDir,
        quiet,
        angularBrowserTarget: browserTarget,
        angularBuilderContext: context,
        angularBuilderOptions: {
          ...(stylePreprocessorOptions ? { stylePreprocessorOptions } : {}),
          ...(styles ? { styles } : {}),
        },
        tsConfig,
        webpackStatsJson,
      };
      return standaloneOptions;
    }),
    switchMap((standaloneOptions) => runInstance({ ...standaloneOptions, mode: 'static' })),
    map(() => {
      return { success: true };
    })
  );
}

async function setup(options: StorybookBuilderOptions, context: BuilderContext) {
  let browserOptions: (JsonObject & BrowserBuilderOptions) | undefined;
  let browserTarget: Target | undefined;

  if (options.browserTarget) {
    browserTarget = targetFromTargetString(options.browserTarget);
    browserOptions = await context.validateOptions<JsonObject & BrowserBuilderOptions>(
      await context.getTargetOptions(browserTarget),
      await context.getBuilderNameForTarget(browserTarget)
    );
  }

  return {
    tsConfig:
      options.tsConfig ??
      findUpSync('tsconfig.json', { cwd: options.configDir }) ??
      browserOptions.tsConfig,
  };
}

function runInstance(options: StandaloneOptions) {
  return from(buildStaticStandalone(options as any)).pipe(
    catchError((error: any) => throwError(buildStandaloneErrorHandler(error)))
  );
}
