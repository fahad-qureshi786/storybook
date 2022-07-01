import fs from 'fs-extra';
import { join } from 'path';
import { build } from 'tsup';

const hasFlag = (flags: string[], name: string) => !!flags.find((s) => s.startsWith(`--${name}`));

const run = async ({ cwd, flags }: { cwd: string; flags: string[] }) => {
  const packageJson = await fs.readJson(join(cwd, 'package.json'));

  const reset = hasFlag(flags, 'reset');
  const watch = hasFlag(flags, 'watch');
  const optimized = hasFlag(flags, 'optimized');

  if (reset) {
    await fs.emptyDir(join(process.cwd(), 'dist'));
  }

  if (!optimized) {
    console.log(`skipping generating types for ${process.cwd()}`);
    await fs.writeFile(join(process.cwd(), 'dist', 'index.d.ts'), `export * from '../src/index';`);
  }

  await build({
    entry: packageJson.bundlerEntrypoint,
    watch,
    // sourcemap: optimized,
    format: ['esm', 'cjs'],
    target: 'node16',
    clean: true,
    shims: true,
    external: [
      packageJson.name,
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ],

    dts: optimized
      ? {
          entry: packageJson.bundlerEntrypoint,
          resolve: true,
        }
      : false,
    esbuildOptions: (c) => {
      /* eslint-disable no-param-reassign */
      c.platform = 'node';
      c.legalComments = 'none';
      c.minifyWhitespace = optimized;
      c.minifyIdentifiers = optimized;
      c.minifySyntax = optimized;
      /* eslint-enable no-param-reassign */
    },
  });
};

const flags = process.argv.slice(2);
const cwd = process.cwd();

run({ cwd, flags }).catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
