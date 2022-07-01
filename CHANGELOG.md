## 7.0.0-alpha.8 (June 29, 2022)

### Features

- Webpack: Support .cjs extension ([#18502](https://github.com/storybookjs/storybook/pull/18502))

### Maintenance

- Docs2: Extract doc blocks into a separate package ([#18587](https://github.com/storybookjs/storybook/pull/18587))

## 7.0.0-alpha.7 (June 29, 2022)

### Features

- TypeScript: Re-structure types for frameworks and presets ([#18504](https://github.com/storybookjs/storybook/pull/18504))
- UI: Add parent wildcard sortOrder ([#18243](https://github.com/storybookjs/storybook/pull/18243))

### Bug Fixes

- UI: Fix typo in CSS pseudo selector ([#17708](https://github.com/storybookjs/storybook/pull/17708))
- UI: Fix sidebar a11y by moving aria-expanded attribute to button ([#18354](https://github.com/storybookjs/storybook/pull/18354))
- CLI: Hook up the npm7 migration ([#18522](https://github.com/storybookjs/storybook/pull/18522))

### Maintenance

- Build: Use TSUP to compile `core-common` ([#18546](https://github.com/storybookjs/storybook/pull/18546))
- Build: Use TSUP to compile the presets ([#18544](https://github.com/storybookjs/storybook/pull/18544))
- Build: Use TSUP to compile the frameworks ([#18543](https://github.com/storybookjs/storybook/pull/18543))
- Build: Use TSUP to compile the renderers ([#18534](https://github.com/storybookjs/storybook/pull/18534))
- Essentials: Add highlight addon ([#17800](https://github.com/storybookjs/storybook/pull/17800))
- Core: Replace `cpy` with `fs-extra` copy/copyFile ([#18497](https://github.com/storybookjs/storybook/pull/18497))
- Build: Enable Template.bind({}) TS support in our repo ([#18540](https://github.com/storybookjs/storybook/pull/18540))
- Turn on strict types in store + preview-web ([#18536](https://github.com/storybookjs/storybook/pull/18536))
- Addon-highlight: Convert to simplified addon style ([#17991](https://github.com/storybookjs/storybook/pull/17991))

### Dependency Upgrades

- Upgrade @storybook/testing-library to `0.0.14-next.0` ([#18539](https://github.com/storybookjs/storybook/pull/18539))

## 7.0.0-alpha.6 (June 21, 2022)

### Bug Fixes

- Interactions: Reset instrumenter state on HMR ([#18516](https://github.com/storybookjs/storybook/pull/18516))
- Interactions: Prevent showing child exception while parent is still playing ([#18518](https://github.com/storybookjs/storybook/pull/18518))

### Maintenance

- Docs2 core: Fetch `index.json` for composition ([#18521](https://github.com/storybookjs/storybook/pull/18521))
- Addon-docs: Switch Meta block to receive all module exports ([#18514](https://github.com/storybookjs/storybook/pull/18514))
- Re-add deprecated fields to lib/api ([#18488](https://github.com/storybookjs/storybook/pull/18488))
- Core: Handle v3 index in composition ([#18498](https://github.com/storybookjs/storybook/pull/18498))
- Story index: Ensure that `extract` script works and SBs can be composed into v6 storybooks ([#18409](https://github.com/storybookjs/storybook/pull/18409))
- Docs2: Handle new docs entries in the preview ([#18099](https://github.com/storybookjs/storybook/pull/18099))
- Docs2: Refactor manager to use new index data ([#18023](https://github.com/storybookjs/storybook/pull/18023))

## 7.0.0-alpha.5 (June 20, 2022)

### Bug Fixes

- Core: Allow a teardown function to be returned from `renderToDOM` ([#18457](https://github.com/storybookjs/storybook/pull/18457))
- CLI: Add npm7 migration for legacy peer deps ([#18510](https://github.com/storybookjs/storybook/pull/18510))
- Interactions: Fix broken UI on nested interactions ([#18499](https://github.com/storybookjs/storybook/pull/18499))

### Maintenance

- Build: Upgrade yarn to 3.2.1 ([#18511](https://github.com/storybookjs/storybook/pull/18511))

## 7.0.0-alpha.4 (June 19, 2022)

### Breaking Changes

- Core: Remove standalone node APIs ([#18089](https://github.com/storybookjs/storybook/pull/18089))

### Maintenance

- Build: Add logFilters to yarn config ([#18500](https://github.com/storybookjs/storybook/pull/18500))
- Build: Set typescript strict-mode ([#18493](https://github.com/storybookjs/storybook/pull/18493))

## 7.0.0-alpha.3 (June 17, 2022)

### Features

- Interactions: Collapse child interactions ([#18484](https://github.com/storybookjs/storybook/pull/18484))

### Bug Fixes

- Interactions: Fix `waitFor` behavior while debugging ([#18460](https://github.com/storybookjs/storybook/pull/18460))
- UI: Fix display skip to sidebar button ([#18479](https://github.com/storybookjs/storybook/pull/18479))

### Maintenance

- CLI: Use `storybook` instead of `sb` ([#18430](https://github.com/storybookjs/storybook/pull/18430))
- Components: Re-bundle the syntax highlighter ([#18425](https://github.com/storybookjs/storybook/pull/18425))

## 7.0.0-alpha.2 (June 15, 2022)

### Features

- UI: Update manager to respect `parameters.docsOnly` in `stories.json` ([#18433](https://github.com/storybookjs/storybook/pull/18433))
- CLI: Add additional files api to sb repro ([#18389](https://github.com/storybookjs/storybook/pull/18389))

### Bug Fixes

- Core: Fix process is not defined when using components ([#18469](https://github.com/storybookjs/storybook/pull/18469))
- Story index: Warn on `storyName` in CSF3 exports ([#18464](https://github.com/storybookjs/storybook/pull/18464))
- Telemetry: Strip out preset from addon name ([#18442](https://github.com/storybookjs/storybook/pull/18442))

### Maintenance

- CLI: Improve to be more async & cleanup ([#18475](https://github.com/storybookjs/storybook/pull/18475))
- 7.0.0 pnp support ([#18461](https://github.com/storybookjs/storybook/pull/18461))
- Build: Use playright version of sb-bench ([#18458](https://github.com/storybookjs/storybook/pull/18458))
- Angular: Support Angular 14 standalone components ([#18272](https://github.com/storybookjs/storybook/pull/18272))
- Build: Fix prebundle script on Windows ([#18365](https://github.com/storybookjs/storybook/pull/18365))
- Scripts: Clean verdaccio cache when running locally ([#18359](https://github.com/storybookjs/storybook/pull/18359))
- Core: fix PnP compatibility for @storybook/ui and @storybook/router packages ([#18412](https://github.com/storybookjs/storybook/pull/18412))

## 7.0.0-alpha.1 (June 7, 2022)

### Bug Fixes

- CLI: Fix `init` to install correct version of sb/storybook ([#18417](https://github.com/storybookjs/storybook/pull/18417))

## 7.0.0-alpha.0 (June 7, 2022)

### Breaking Changes

- Build chain upgrades: TS4, Webpack5, modern ESM, TSUP ([#18205](https://github.com/storybookjs/storybook/pull/18205))
- Create frameworks & rename renderers ([#18201](https://github.com/storybookjs/storybook/pull/18201))
- Core-webpack: Factor out webpack dependencies ([#18114](https://github.com/storybookjs/storybook/pull/18114))
- Core: Remove start-/build-storybook from all frameworks ([#17899](https://github.com/storybookjs/storybook/pull/17899))

### Features

- Core: Add pluggable indexers ([#18355](https://github.com/storybookjs/storybook/pull/18355))
- CLI: Add dev/build commands ([#17898](https://github.com/storybookjs/storybook/pull/17898))
- CLI: Add support for angular/cli v14 ([#18334](https://github.com/storybookjs/storybook/pull/18334))

### Bug Fixes

- Vue/Vue3: Fix decorators in StoryStoreV7 ([#18375](https://github.com/storybookjs/storybook/pull/18375))
- Preview: Default select to `viewMode` story ([#18370](https://github.com/storybookjs/storybook/pull/18370))

### Maintenance

- Core: Split webpack presets out of frameworks ([#18018](https://github.com/storybookjs/storybook/pull/18018))
- Core: Renderer refactor ([#17982](https://github.com/storybookjs/storybook/pull/17982))
- Core: Allow builders to be set in presets ([#18182](https://github.com/storybookjs/storybook/pull/18182))
- Core: Minimize webpack deps ([#18024](https://github.com/storybookjs/storybook/pull/18024))
- Core: Make renderers presets ([#18004](https://github.com/storybookjs/storybook/pull/18004))
- Examples: Simplify sb usage in package.json scripts ([#18065](https://github.com/storybookjs/storybook/pull/18065))

# Older versions

For older versions of the changelog, see [CHANGELOG.v6.md](./CHANGELOG.v6.md), [CHANGELOG.v1-5.md](./CHANGELOG.v1-5.md)
