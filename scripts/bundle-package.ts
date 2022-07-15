import path, { resolve } from 'path';
import chalk from 'chalk';
import { rollup, OutputOptions, watch, RollupOptions } from 'rollup';
import readPkgUp from 'read-pkg-up';
import fs from 'fs-extra';
import rollupTypescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { babel, getBabelOutputPlugin } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import { generateDtsBundle } from 'dts-bundle-generator';
import * as dtsLozalize from './dts-localize';

const { bold, gray, greenBright } = chalk;

interface Options {
  input: string;
  externals: string[];
  cwd: string;
  optimized?: boolean;
  watch?: boolean;
}

async function dts({ input, externals, cwd, ...options }: Options) {
  if (options.watch) {
    try {
      const [out] = await generateDtsBundle(
        [
          {
            filePath: input,
            output: { inlineDeclareGlobals: false, sortNodes: true, noBanner: true },
          },
        ],
        { followSymlinks: false }
      );

      await fs.outputFile('dist/types/index.d.ts', out);
    } catch (e) {
      console.log(e.message);
    }
  } else {
    const [out] = await generateDtsBundle(
      [
        {
          filePath: input,
          output: { inlineDeclareGlobals: false, sortNodes: true, noBanner: true },
        },
      ],
      { followSymlinks: false }
    );

    const bundledDTSfile = path.join(cwd, 'dist/ts-tmp/index.d.ts');
    const localizedDTSout = path.join(cwd, 'dist/types');
    await fs.outputFile(bundledDTSfile, out);

    await dtsLozalize.run([bundledDTSfile], localizedDTSout, { externals, cwd });
  }
}

async function removeDist() {
  await fs.remove('dist');
}

async function mapper() {
  await fs.emptyDir(path.join(process.cwd(), 'dist', 'types'));
  await fs.writeFile(
    path.join(process.cwd(), 'dist', 'types', 'index.d.ts'),
    `export * from '../../src/index';`
  );
}
const makeExternalPredicate = (externals: string[]) => {
  if (externals.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externals.join('|')})($|/)`);
  return (id: string) => pattern.test(id);
};

async function build(options: Options) {
  const { input, externals, cwd, optimized } = options;
  const setting: RollupOptions = {
    input,
    external: makeExternalPredicate(externals),
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      babel({
        babelHelpers: 'external',
        skipPreflightCheck: true,
        compact: false,
      }),
      json(),
      rollupTypescript({ lib: ['es2015', 'dom', 'esnext'], target: 'es6' }),
    ],
  };

  const outputs: OutputOptions[] = [
    {
      dir: resolve(cwd, './dist/esm'),
      format: 'es',
      sourcemap: optimized,
      preferConst: true,
      plugins: [
        getBabelOutputPlugin({
          compact: false,
          presets: [
            [
              '@babel/preset-env',
              {
                shippedProposals: true,
                useBuiltIns: 'usage',
                corejs: '3',
                modules: false,
                targets: { chrome: '100' },
              },
            ],
          ],
        }),
        optimized ? terser({ output: { comments: false }, module: true }) : null,
      ].filter(Boolean),
    },
    {
      dir: resolve(cwd, './dist/cjs'),
      format: 'commonjs',
      plugins: [
        getBabelOutputPlugin({
          compact: false,
          presets: [
            [
              '@babel/preset-env',
              {
                shippedProposals: true,
                useBuiltIns: 'usage',
                corejs: '3',
                modules: false,
                targets: { node: '14' },
              },
            ],
          ],
        }),
        optimized ? terser({ output: { comments: false }, module: true }) : null,
      ].filter(Boolean),
    },
  ];

  if (options.watch) {
    const watcher = watch({ ...setting, output: outputs });

    watcher.on('change', (event) => {
      console.log(`${greenBright('changed')}: ${event.replace(path.resolve(cwd, '../..'), '.')}`);
    });
  } else {
    const bundler = await rollup(setting);

    await Promise.all(outputs.map((config) => bundler.write(config)));

    await bundler.close();
  }
}

const hasFlag = (flags: string[], name: string) => !!flags.find((s) => s.startsWith(`--${name}`));

export async function run({ cwd, flags }: { cwd: string; flags: string[] }) {
  const { packageJson: pkg } = await readPkgUp({ cwd });
  const message = gray(`Built: ${bold(`${pkg.name}@${pkg.version}`)}`);
  console.time(message);

  const reset = hasFlag(flags, 'reset');
  const watch = hasFlag(flags, 'watch');
  const optimized = hasFlag(flags, 'optimized');

  if (reset) {
    await removeDist();
  }

  const input = path.join(cwd, pkg.bundlerEntrypoint);
  const externals = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });

  const options: Options = {
    cwd,
    externals,
    input,
    optimized,
    watch,
  };

  if (!optimized) {
    console.log(`skipping generating types for ${process.cwd()}`);
  }

  await Promise.all([
    //
    build(options),
    ...(options.optimized ? [dts(options)] : [mapper()]),
  ]);

  console.timeEnd(message);
}
