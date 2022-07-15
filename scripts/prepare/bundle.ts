import fs from 'fs-extra';
import path, { join } from 'path';
import { build } from 'tsup';
import aliasPlugin from 'esbuild-plugin-alias';
import shelljs from 'shelljs';

const hasFlag = (flags: string[], name: string) => !!flags.find((s) => s.startsWith(`--${name}`));

const run = async ({ cwd, flags }: { cwd: string; flags: string[] }) => {
  const {
    name,
    dependencies,
    peerDependencies,
    bundler: { entries, platform, pre },
  } = await fs.readJson(join(cwd, 'package.json'));

  if (pre) {
    shelljs.exec(`esrun ${pre}`, { cwd });
  }

  const reset = hasFlag(flags, 'reset');
  const watch = hasFlag(flags, 'watch');
  const optimized = hasFlag(flags, 'optimized');

  if (reset) {
    await fs.emptyDir(join(process.cwd(), 'dist'));
  }

  if (!optimized) {
    await Promise.all(
      entries.map(async (file: string) => {
        console.log(`skipping generating types for ${file}`);
        const { name } = path.parse(file);

        const pathName = join(process.cwd(), 'dist', `${name}.d.ts`);
        // throw new Error('test');
        await fs.ensureFile(pathName);
        await fs.writeFile(pathName, `export * from '../src/${name}';`);
      })
    );
  }

  await Promise.all([
    build({
      entry: entries,
      watch,
      // sourcemap: optimized,
      format: ['esm'],
      target: 'chrome100',
      clean: !watch,
      platform: platform || 'browser',
      // shims: true,
      esbuildPlugins: [
        aliasPlugin({
          process: path.resolve(
            '../../node_modules/rollup-plugin-node-polyfills/polyfills/process-es6.js'
          ),
          util: path.resolve('../../node_modules/rollup-plugin-node-polyfills/polyfills/util.js'),
        }),
      ],
      external: [name, ...Object.keys(dependencies || {}), ...Object.keys(peerDependencies || {})],

      dts: optimized
        ? {
            entry: entries,
            resolve: true,
          }
        : false,
      esbuildOptions: (c) => {
        /* eslint-disable no-param-reassign */
        c.define = optimized
          ? { 'process.env.NODE_ENV': "'production'", 'process.env': '{}', global: 'window' }
          : { 'process.env.NODE_ENV': "'development'", 'process.env': '{}', global: 'window' };
        c.platform = platform || 'browser';
        c.legalComments = 'none';
        c.minifyWhitespace = optimized;
        c.minifyIdentifiers = optimized;
        c.minifySyntax = optimized;
        /* eslint-enable no-param-reassign */
      },
    }),
    build({
      entry: entries,
      watch,
      format: ['cjs'],
      target: 'node14',
      platform: 'node',
      clean: !watch,
      external: [name, ...Object.keys(dependencies || {}), ...Object.keys(peerDependencies || {})],

      esbuildOptions: (c) => {
        /* eslint-disable no-param-reassign */
        // c.define = optimized
        //   ? { 'process.env.NODE_ENV': "'production'", 'process.env': '{}' }
        //   : { 'process.env.NODE_ENV': "'development'", 'process.env': '{}' };
        c.platform = 'node';
        c.legalComments = 'none';
        c.minifyWhitespace = optimized;
        c.minifyIdentifiers = optimized;
        c.minifySyntax = optimized;
        /* eslint-enable no-param-reassign */
      },
    }),
  ]);
};

const flags = process.argv.slice(2);
const cwd = process.cwd();

run({ cwd, flags }).catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
