import mergeWith from 'lodash/mergeWith';
import isEqual from 'lodash/isEqual';

import { logger } from '@storybook/client-logger';

export default <TObj = any>(a: TObj, b: Partial<TObj>) =>
  mergeWith({}, a, b, (objValue: TObj, srcValue: Partial<TObj>) => {
    if (Array.isArray(srcValue) && Array.isArray(objValue)) {
      srcValue.forEach((s) => {
        const existing = objValue.find((o) => o === s || isEqual(o, s));
        if (!existing) {
          objValue.push(s);
        }
      });

      return objValue;
    }
    if (Array.isArray(objValue)) {
      logger.log(['the types mismatch, picking', objValue]);
      return objValue;
    }
    return undefined;
  });
