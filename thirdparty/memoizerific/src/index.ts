export type Memoize = <T extends (...args: any[]) => any>(fn: T) => Memoizerific<T>;

export type Memoizerific<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): ReturnType<T>;
  cache: Map<any, any>;
  wasMemoized: boolean;
  lru: CacheMeta[][];
  limit: number;
  numArgs: number;
};

type CacheMeta = {
  cacheItem: Map<any, any>;
  arg: any;
};

export default function memoize(limit: number): Memoize {
  const cache = new Map<any, any>();
  const lru: CacheMeta[][] = [];

  function memoized<T extends (...args: any[]) => any>(fn: T): Memoizerific<T> {
    const memoizerific = ((...args: any[]) => {
      let currentCache = cache;
      const argsLengthMinusOne = args.length - 1;
      const lruPath: CacheMeta[] = Array(argsLengthMinusOne + 1);
      let isMemoized = true;

      if (
        (memoizerific.numArgs || memoizerific.numArgs === 0) &&
        memoizerific.numArgs !== argsLengthMinusOne + 1
      ) {
        throw new Error(
          'Memoizerific functions should always be called with the same number of arguments'
        );
      }

      // loop through each argument to traverse the map tree
      for (let i = 0; i < argsLengthMinusOne; i += 1) {
        lruPath[i] = {
          cacheItem: currentCache,
          arg: args[i],
        };

        // climb through the hierarchical map tree until the second-last argument has been found, or an argument is missing.
        // if all arguments up to the second-last have been found, this will potentially be a cache hit (determined later)
        if (currentCache.has(args[i])) {
          currentCache = currentCache.get(args[i]);
        } else {
          isMemoized = false;

          // make maps until last value
          const newMap = new Map<any, any>();
          currentCache.set(args[i], newMap);
          currentCache = newMap;
        }
      }

      let fnResult;

      // we are at the last arg, check if it is really memoized
      if (isMemoized) {
        if (currentCache.has(args[argsLengthMinusOne])) {
          fnResult = currentCache.get(args[argsLengthMinusOne]);
        } else {
          isMemoized = false;
        }
      }

      // if the result wasn't memoized, compute it and cache it
      if (!isMemoized) {
        fnResult = fn(...args);
        currentCache.set(args[argsLengthMinusOne], fnResult);
      }

      // if there is a cache limit, purge any extra results
      if (limit > 0) {
        lruPath[argsLengthMinusOne] = {
          cacheItem: currentCache,
          arg: args[argsLengthMinusOne],
        };

        if (isMemoized) {
          moveToMostRecentLru(lru, lruPath);
        } else {
          lru.push(lruPath);
        }

        if (lru.length > limit) {
          removeCachedResult(lru.shift());
        }
      }

      memoizerific.wasMemoized = isMemoized;
      memoizerific.numArgs = argsLengthMinusOne + 1;

      return fnResult;
    }) as Memoizerific<T>;

    memoizerific.limit = limit;
    memoizerific.wasMemoized = false;
    memoizerific.cache = cache;
    memoizerific.lru = lru;

    return memoizerific;
  }

  return memoized;
}

// move current args to most recent position
function moveToMostRecentLru<R>(lru: CacheMeta[][], lruPath: CacheMeta[]) {
  const lruLen = lru.length;
  const lruPathLen = lruPath.length;

  let i: number;
  for (i = 0; i < lruLen; i += 1) {
    let isMatch = true;
    for (let ii = 0; ii < lruPathLen; ii += 1) {
      if (!isEqual(lru[i][ii].arg, lruPath[ii].arg)) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      break;
    }
  }

  lru.push(lru.splice(i, 1)[0]);
}

// remove least recently used cache item and all dead branches
function removeCachedResult<R>(removedLru: CacheMeta[]) {
  const removedLruLen = removedLru.length;
  let currentLru = removedLru[removedLruLen - 1];

  currentLru.cacheItem.delete(currentLru.arg);

  // walk down the tree removing dead branches (size 0) along the way
  for (let i = removedLruLen - 2; i >= 0; i -= 1) {
    currentLru = removedLru[i];
    const tmp = currentLru.cacheItem.get(currentLru.arg);

    if (!tmp || !tmp.size) {
      currentLru.cacheItem.delete(currentLru.arg);
    } else {
      break;
    }
  }
}

// check if the numbers are equal, or whether they are both precisely NaN (isNaN returns true for all non-numbers)
function isEqual<T>(val1: T, val2: T) {
  // eslint-disable-next-line no-self-compare
  return val1 === val2 || (val1 !== val1 && val2 !== val2);
}
