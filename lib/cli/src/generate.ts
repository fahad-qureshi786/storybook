import program from 'commander';
import path from 'path';
import chalk from 'chalk';
import envinfo from 'envinfo';
import leven from 'leven';
import { sync as readUpSync } from 'read-pkg-up';

import { logger } from '@storybook/node-logger';

import { initiate } from './initiate';
import { add } from './add';
import { migrate } from './migrate';
import { extract } from './extract';
import { upgrade } from './upgrade';
import { repro } from './repro';
import { link } from './link';
import { automigrate } from './automigrate';
import { generateStorybookBabelConfigInCWD } from './babel-config';
import { dev } from './dev';
import { build } from './build';
import { parseList, getEnvConfig } from './utils';

const pkg = readUpSync({ cwd: __dirname }).packageJson;
const consoleLogger = console;

program.option(
  '--disable-telemetry',
  'disable sending telemetry data',
  // default value is false, but if the user sets STORYBOOK_DISABLE_TELEMETRY, it can be true
  process.env.STORYBOOK_DISABLE_TELEMETRY && process.env.STORYBOOK_DISABLE_TELEMETRY !== 'false'
);

program.option('--enable-crash-reports', 'enable sending crash reports to telemetry data');

program
  .command('init')
  .description('Initialize Storybook into your project.')
  .option('-f --force', 'Force add Storybook')
  .option('-s --skip-install', 'Skip installing deps')
  .option('-N --use-npm', 'Use npm to install deps')
  .option('--use-pnp', 'Enable pnp mode')
  .option('-p --parser <babel | babylon | flow | ts | tsx>', 'jscodeshift parser')
  .option('-t --type <type>', 'Add Storybook for a specific project type')
  .option('-y --yes', 'Answer yes to all prompts')
  .option('-b --builder <builder>', 'Builder library')
  .option('-l --linkable', 'Prepare installation for link (contributor helper)')
  .action((options) => initiate(options, pkg));

program
  .command('add <addon>')
  .description('Add an addon to your Storybook')
  .option('-N --use-npm', 'Use NPM to build the Storybook server')
  .option('-s --skip-postinstall', 'Skip package specific postinstall config modifications')
  .action((addonName, options) => add(addonName, options));

program
  .command('babelrc')
  .description('generate the default storybook babel config into your current working directory')
  .action(() => generateStorybookBabelConfigInCWD());

program
  .command('upgrade')
  .description('Upgrade your Storybook packages to the latest')
  .option('-N --use-npm', 'Use NPM to build the Storybook server')
  .option('-y --yes', 'Skip prompting the user')
  .option('-n --dry-run', 'Only check for upgrades, do not install')
  .option('-p --prerelease', 'Upgrade to the pre-release packages')
  .option('-s --skip-check', 'Skip postinstall version and automigration checks')
  .action((options) => upgrade(options));

program
  .command('info')
  .description('Prints debugging information about the local environment')
  .action(() => {
    consoleLogger.log(chalk.bold('\nEnvironment Info:'));
    envinfo
      .run({
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
        npmPackages: '@storybook/*',
        npmGlobalPackages: '@storybook/*',
      })
      .then(consoleLogger.log);
  });

program
  .command('migrate [migration]')
  .description('Run a Storybook codemod migration on your source files')
  .option('-l --list', 'List available migrations')
  .option('-g --glob <glob>', 'Glob for files upon which to apply the migration', '**/*.js')
  .option('-p --parser <babel | babylon | flow | ts | tsx>', 'jscodeshift parser')
  .option(
    '-n --dry-run',
    'Dry run: verify the migration exists and show the files to which it will be applied'
  )
  .option(
    '-r --rename <from-to>',
    'Rename suffix of matching files after codemod has been applied, e.g. ".js:.ts"'
  )
  .action((migration, { configDir, glob, dryRun, list, rename, parser }) => {
    migrate(migration, {
      configDir,
      glob,
      dryRun,
      list,
      rename,
      parser,
      logger: consoleLogger,
    }).catch((err) => {
      logger.error(err);
      process.exit(1);
    });
  });

program
  .command('extract [location] [output]')
  .description('extract stories.json from a built version')
  .action((location = 'storybook-static', output = path.join(location, 'stories.json')) =>
    extract(location, output).catch((e) => {
      logger.error(e);
      process.exit(1);
    })
  );

program
  .command('repro [outputDirectory]')
  .description('Create a reproduction from a set of possible templates')
  .option('-f --renderer <renderer>', 'Filter on given renderer')
  .option('-t --template <template>', 'Use the given template')
  .option('-l --list', 'List available templates')
  .option('-g --generator <generator>', 'Use custom generator command')
  .option('--pnp', "Use Yarn Plug'n'Play mode instead of node_modules one")
  .option('--local', "use storybook's local packages instead of yarn's registry")
  .option('--e2e', 'Used in e2e context')
  .action((outputDirectory, { renderer, template, list, e2e, generator, pnp, local }) =>
    repro({ outputDirectory, renderer, template, list, e2e, local, generator, pnp }).catch((e) => {
      logger.error(e);
      process.exit(1);
    })
  );

program
  .command('link <repo-url-or-directory>')
  .description('Pull down a repro from a URL (or a local directory), link it, and run storybook')
  .option('--local', 'Link a local directory already in your file system')
  .action((target, { local }) =>
    link({ target, local }).catch((e) => {
      logger.error(e);
      process.exit(1);
    })
  );

program
  .command('automigrate [fixId]')
  .description('Check storybook for known problems or migrations and apply fixes')
  .option('-y --yes', 'Skip prompting the user')
  .option('-n --dry-run', 'Only check for fixes, do not actually run them')
  .action((fixId, options) =>
    automigrate({ fixId, ...options }).catch((e) => {
      logger.error(e);
      process.exit(1);
    })
  );

program
  .command('dev')
  .option('-p, --port <number>', 'Port to run Storybook', (str) => parseInt(str, 10))
  .option('-h, --host <string>', 'Host to run Storybook')
  .option('-s, --static-dir <dir-names>', 'Directory where to load static files from', parseList)
  .option('-c, --config-dir <dir-name>', 'Directory where to load Storybook configurations from')
  .option(
    '--https',
    'Serve Storybook over HTTPS. Note: You must provide your own certificate information.'
  )
  .option(
    '--ssl-ca <ca>',
    'Provide an SSL certificate authority. (Optional with --https, required if using a self-signed certificate)',
    parseList
  )
  .option('--ssl-cert <cert>', 'Provide an SSL certificate. (Required with --https)')
  .option('--ssl-key <key>', 'Provide an SSL key. (Required with --https)')
  .option('--smoke-test', 'Exit after successful start')
  .option('--ci', "CI mode (skip interactive prompts, don't open browser)")
  .option('--no-open', 'Do not open Storybook automatically in the browser')
  .option('--loglevel <level>', 'Control level of logging during build')
  .option('--quiet', 'Suppress verbose build output')
  .option('--no-version-updates', 'Suppress update check', true)
  .option(
    '--no-release-notes',
    'Suppress automatic redirects to the release notes after upgrading',
    true
  )
  .option('--no-manager-cache', 'Do not cache the manager UI')
  .option('--debug-webpack', 'Display final webpack configurations for debugging purposes')
  .option('--webpack-stats-json [directory]', 'Write Webpack Stats JSON to disk')
  .option(
    '--preview-url <string>',
    'Disables the default storybook preview and lets your use your own'
  )
  .option('--force-build-preview', 'Build the preview iframe even if you are using --preview-url')
  .option('--docs', 'Build a documentation-only site using addon-docs')
  .action((options) => {
    logger.setLevel(program.loglevel);
    consoleLogger.log(chalk.bold(`${pkg.name} v${pkg.version}`) + chalk.reset('\n'));

    // The key is the field created in `program` variable for
    // each command line argument. Value is the env variable.
    getEnvConfig(program, {
      port: 'SBCONFIG_PORT',
      host: 'SBCONFIG_HOSTNAME',
      staticDir: 'SBCONFIG_STATIC_DIR',
      configDir: 'SBCONFIG_CONFIG_DIR',
      ci: 'CI',
    });

    if (typeof program.port === 'string' && program.port.length > 0) {
      program.port = parseInt(program.port, 10);
    }

    dev({ ...options, packageJson: pkg });
  });

program
  .command('build')
  .option('-s, --static-dir <dir-names>', 'Directory where to load static files from', parseList)
  .option('-o, --output-dir <dir-name>', 'Directory where to store built files')
  .option('-c, --config-dir <dir-name>', 'Directory where to load Storybook configurations from')
  .option('--quiet', 'Suppress verbose build output')
  .option('--loglevel <level>', 'Control level of logging during build')
  .option('--debug-webpack', 'Display final webpack configurations for debugging purposes')
  .option('--webpack-stats-json [directory]', 'Write Webpack Stats JSON to disk')
  .option(
    '--preview-url <string>',
    'Disables the default storybook preview and lets your use your own'
  )
  .option('--force-build-preview', 'Build the preview iframe even if you are using --preview-url')
  .option('--docs', 'Build a documentation-only site using addon-docs')
  .option('--no-manager-cache', 'Do not cache the manager UI')
  .action((options) => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    logger.setLevel(program.loglevel);
    consoleLogger.log(chalk.bold(`${pkg.name} v${pkg.version}\n`));

    // The key is the field created in `program` variable for
    // each command line argument. Value is the env variable.
    getEnvConfig(program, {
      staticDir: 'SBCONFIG_STATIC_DIR',
      outputDir: 'SBCONFIG_OUTPUT_DIR',
      configDir: 'SBCONFIG_CONFIG_DIR',
    });

    build({ ...options, packageJson: pkg });
  });

program.on('command:*', ([invalidCmd]) => {
  consoleLogger.error(
    ' Invalid command: %s.\n See --help for a list of available commands.',
    invalidCmd
  );
  // eslint-disable-next-line
  const availableCommands = program.commands.map((cmd) => cmd._name);
  const suggestion = availableCommands.find((cmd) => leven(cmd, invalidCmd) < 3);
  if (suggestion) {
    consoleLogger.info(`\n Did you mean ${suggestion}?`);
  }
  process.exit(1);
});

program.usage('<command> [options]').version(pkg.version).parse(process.argv);
