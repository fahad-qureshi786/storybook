import path from 'path';
import type { StorybookConfig } from './types';

export * from './types';

export const babelDefault: StorybookConfig['babelDefault'] = (config) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [require.resolve('@babel/plugin-transform-react-jsx'), { pragma: 'h' }, 'preset'],
    ],
  };
};

export const webpackFinal: StorybookConfig['webpackFinal'] = (config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        react: path.dirname(require.resolve('preact/compat/package.json')),
        'react-dom/test-utils': path.dirname(require.resolve('preact/test-utils/package.json')),
        'react-dom': path.dirname(require.resolve('preact/compat/package.json')),
      },
    },
  };
};
