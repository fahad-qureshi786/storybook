import { spawn } from 'child_process';
import { promisify } from 'util';
import { readdir as readdirRaw, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import program from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';

import { getDeployables } from './utils/list-examples';
import { filterDataForCurrentCircleCINode } from './utils/concurrency';

program
  .option(
    '--skip <value>',
    'Skip an example, accepts multiple values like "--skip vue-kitchen-sink official-storybook"',
    (value, previous) => previous.concat([value]),
    []
  )
  .option('--all', `run e2e tests for every example`, false);
program.parse(process.argv);

const { all: shouldRunAllExamples, args: exampleArgs, skip: examplesToSkip } = program;

const readdir = promisify(readdirRaw);

const p = (l) => join(__dirname, '..', ...l);
const logger = console;

const exec = async (command, args = [], options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit', shell: true });

    child
      .on('close', (code) => {
        if (code) {
          reject();
        } else {
          resolve();
        }
      })
      .on('error', (e) => {
        logger.error(e);
        reject();
      });
  });

// TODO think if this filter is what we want for smoke tests
const hasBuildScript = (l) => {
  const text = readFileSync(l, 'utf8');
  const json = JSON.parse(text);

  return !!json.scripts['build-storybook'];
};

const handleExamples = async (deployables) => {
  await deployables.reduce(async (acc, d) => {
    await acc;

    logger.log('');
    logger.log(`-----------------${Array(d.length).fill('-').join('')}`);
    logger.log(`▶️  smoke-testing: ${d}`);
    logger.log(`-----------------${Array(d.length).fill('-').join('')}`);
    const cwd = p(['examples', d]);

    // ensure web-components example works, because it's outside the yarn workspace
    if (existsSync(join(cwd, 'yarn.lock'))) {
      await exec(`yarn`, [`install`], { cwd });
    }

    await exec(`yarn`, ['storybook', '--smoke-test', '--quiet'], { cwd });

    logger.log('-------');
    logger.log(`✅ ${d} passed`);
    logger.log('-------');
  }, Promise.resolve());
};

const run = async () => {
  const allExamples = await readdir(p(['examples']));

  // if a specific example is passed, use it. Else use all
  let examplesToBuild =
    exampleArgs.length > 0
      ? exampleArgs
      : allExamples.filter((example) => !example.includes('README'));

  if (examplesToSkip.length > 0) {
    logger.log(`⏭  Will skip the following examples: ${chalk.yellow(examplesToSkip.join(', '))}`);
    examplesToBuild = examplesToBuild.filter((example) => !examplesToSkip.includes(example));
  }

  if (!shouldRunAllExamples && exampleArgs.length === 0) {
    const { selectedExamples } = await prompts([
      {
        type: 'autocompleteMultiselect',
        message: 'Select the examples to smoke-test',
        name: 'selectedExamples',
        min: 1,
        hint: 'You can also run directly with example name like `yarn smoketest-storybooks official-example`, or `yarn smoketest-storybooks --all` for all examples!',
        choices: examplesToBuild.map((exampleName) => {
          return {
            value: exampleName,
            title: exampleName,
            selected: false,
          };
        }),
      },
    ]);
    examplesToBuild = selectedExamples;
  }

  const list = getDeployables(examplesToBuild, hasBuildScript);
  const deployables = filterDataForCurrentCircleCINode(list);

  if (deployables.length) {
    logger.log(`🏗  Will smoke test: ${chalk.cyan(deployables.join(', '))}`);
    await handleExamples(deployables);
  }
};

run().catch((e) => {
  logger.error(e);
  process.exit(1);
});
