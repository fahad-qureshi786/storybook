# Memoizerific.js

This code is based on the original npm package:

https://www.npmjs.com/package/memoizerific
https://github.com/thinkloop/memoizerific

That library has an MIT license (Copyright (c) 2016 Baz).

Some changes are made:

1) The code is rewritten from JavaScript to TypeScript
2) The polyfill for `Map` is removed. This assumes that the
   running environment (browser or Node) supports Map.
3) Unit tests are rewritten/ported.
4) The code is tweaked to follow Storybook code style/linting etc.
