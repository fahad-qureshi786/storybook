const { buildStaticStandalone } = require('../lib/core-server/dist/cjs/build-static');

process.env.NODE_ENV = 'production';

const run = async () => {
  await buildStaticStandalone({
    ignorePreview: true,
    outputDir: './lib/manager-webpack5/prebuilt',
    configDir: './scripts/build-manager-config',
  });
};

run().catch((e) => {
  console.log(e);
  process.exit(1);
});
