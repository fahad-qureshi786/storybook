import memoize, { Memoizerific } from './index';

describe('complexArgs', () => {
  const arg1 = { a: { b: 3 }, num: 3 };
  const arg2 = { c: { d: 3 }, num: 7 };
  const arg3 = [
    { f: { g: 3 }, num: 11 },
    { h: { i: 3 }, num: 4 },
    { j: { k: 3 }, num: 6 },
  ];

  let memoizedFn: Memoizerific<(...args: any[]) => any>;

  beforeEach(() => {
    memoizedFn = memoize(50)((a: any, b: any, c: any) => a.num * b.num);
    memoizedFn(arg1, arg2, arg3);
  });

  it('should be map', () => {
    expect(memoizedFn.cache instanceof Map).toEqual(true);
  });

  it('should not be memoized', () => {
    const a1 = { a: 1 };
    memoizedFn = memoize(50)((input: any) => input);

    memoizedFn(arg1);
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn(a1);
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn(a1);
    expect(memoizedFn.wasMemoized).toEqual(true);

    memoizedFn({ a: 1 });
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn({ a: 1 });
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn({ a: 1 });
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn(a1);
    expect(memoizedFn.wasMemoized).toEqual(true);

    expect(memoizedFn.lru.length).toEqual(5);
  });

  it('should be memoized', () => {
    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(1);
  });

  it('should have multiple cached items', () => {
    memoizedFn(arg1, arg2, arg3);
    memoizedFn(arg1, arg2, 1);
    expect(memoizedFn.wasMemoized).toEqual(false);
    expect(memoizedFn.lru.length).toEqual(2);
  });
});

describe('different number of args between calls', () => {
  let memoizedFn: Memoizerific<any>;
  const arg1 = 1;
  const arg2 = 2;
  const arg3 = 3;
  const arg4 = 4;
  const arg5 = 5;

  beforeEach(() => {
    memoizedFn = memoize(50)((...args: any[]) => `memoized result ${args.length}`);
    memoizedFn(arg1, arg2, arg3);
  });

  it('right number of args', () => {
    const res = memoizedFn(arg1, arg2, arg4);
    expect(res).toEqual('memoized result 3');
    expect(memoizedFn.wasMemoized).toEqual(false);
    expect(memoizedFn.lru.length).toEqual(2);
  });

  it('one more arg', () => {
    expect(() => {
      memoizedFn(arg1, arg2, arg3, arg4);
    }).toThrow();
  });

  it('several more args', () => {
    expect(() => {
      memoizedFn(arg1, arg2, arg3, arg4, arg5);
    }).toThrow();
  });

  it('one fewer args', () => {
    expect(() => {
      memoizedFn(arg1, arg2);
    }).toThrow();
  });

  it('several fewer args', () => {
    expect(() => {
      memoizedFn(arg1);
    }).toThrow();
  });
});

describe('fibonacci', () => {
  function fibonacci(n: number): number {
    if (n < 2) {
      return 1;
    }
    return fibonacci(n - 2) + fibonacci(n - 1);
  }

  const fibonacciMemoized: Memoizerific<typeof fibonacci> = memoize(50)((n) => {
    if (n < 2) {
      return 1;
    }
    return fibonacciMemoized(n - 2) + fibonacciMemoized(n - 1);
  });

  let fibonacciTime = process.hrtime();
  const fibonacciResult = fibonacci(40);
  fibonacciTime = process.hrtime(fibonacciTime);

  let fibonacciMemoizedTime = process.hrtime();
  const fibonacciMemoizedResult = fibonacciMemoized(40);
  fibonacciMemoizedTime = process.hrtime(fibonacciMemoizedTime);

  const ratioDifference =
    (fibonacciTime[0] * 1000000000 + fibonacciTime[1]) /
    (fibonacciMemoizedTime[0] * 1000000000 + fibonacciMemoizedTime[1]);

  it('should equal non-memoized result', () => {
    expect(fibonacciResult).toEqual(fibonacciMemoizedResult);
  });
  it('should have proper lru length', () => {
    expect(fibonacciMemoized.lru.length).toEqual(41);
  });
  it('should be at least 10x faster', () => {
    expect(ratioDifference).toBeGreaterThan(10);
  });
});

describe('wasMemoized', () => {
  let memoizedFn: Memoizerific<(a: number, b: number, c: number) => number>;

  beforeEach(() => {
    memoizedFn = memoize(50)((arg1, arg2, arg3) => arg1 + arg2 + arg3);
  });

  it('should be false before any invocations', () => {
    expect(memoizedFn.wasMemoized).toEqual(false);
  });

  it('should be false after one invocation', () => {
    memoizedFn(1, 2, 3);
    expect(memoizedFn.wasMemoized).toEqual(false);
  });

  it('should be true', () => {
    memoizedFn(1, 2, 3);
    memoizedFn(1, 2, 3);
    expect(memoizedFn.wasMemoized).toEqual(true);
  });

  it('should be false', () => {
    memoizedFn(1, 2, 3);
    memoizedFn(1, 2, 3);
    memoizedFn(4, 5, 6);
    expect(memoizedFn.wasMemoized).toEqual(false);
  });
});

describe('limit', () => {
  let memoizedFn: Memoizerific<any>;

  beforeEach(() => {
    memoizedFn = memoize(43)((arg1: any, arg2: any, arg3: any) => arg1.num * arg2.num);
  });

  it('should be correct after no invocations', () => {
    expect(memoizedFn.limit).toEqual(43);
  });

  it('should be correct after one invocation', () => {
    memoizedFn(1, 2, 3);
    expect(memoizedFn.limit).toEqual(43);
  });

  it('should be correct after multiple invocations', () => {
    memoizedFn(1, 2, 3);
    memoizedFn(4, 5, 6);
    expect(memoizedFn.limit).toEqual(43);
  });
});

describe('no args', () => {
  let memoizedFn: Memoizerific<() => string>;

  beforeEach(() => {
    memoizedFn = memoize(50)(() => 'no args');
    memoizedFn();
  });

  it('should be memoized', () => {
    let res = memoizedFn();
    expect(res).toEqual('no args');
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(1);

    res = memoizedFn();
    expect(res).toEqual('no args');
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(1);
  });
});

describe('null args', () => {
  let memoizedFn: Memoizerific<any>;
  const arg1: any = null;
  const arg2: any = undefined;
  const arg3 = NaN; // important to test since NaN does not equal NaN

  beforeEach(() => {
    memoizedFn = memoize(50)((a: any, b: any, c: any) => '');
    memoizedFn(arg1, arg2, arg3);
  });

  it('should not be memoized', () => {
    expect(memoizedFn.wasMemoized).toEqual(false);
    expect(memoizedFn.lru.length).toEqual(1);
  });

  it('should be memoized', () => {
    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(1);
  });

  it('should have multiple cached items', () => {
    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);
    memoizedFn(arg1, arg2, 1);
    expect(memoizedFn.wasMemoized).toEqual(false);
    expect(memoizedFn.lru.length).toEqual(2);
  });

  it('should not confuse undefined and null', () => {
    memoizedFn(arg2, arg1, arg3);
    expect(memoizedFn.wasMemoized).toEqual(false);
    expect(memoizedFn.lru.length).toEqual(2);
  });
});

describe('surpassed limit', () => {
  let memoizedFn: Memoizerific<any>;
  const arg1 = { a: { b: 3 }, num: 3 };
  const arg2 = { c: { d: 3 }, num: 7 };
  const arg3 = [
    { f: { g: 3 }, num: 11 },
    { h: { i: 3 }, num: 4 },
    { j: { k: 3 }, num: 6 },
  ];

  beforeEach(() => {
    memoizedFn = memoize(2)((a: any, b: any, c: any) => a.num * b.num);
    memoizedFn(arg1, arg2, arg3);
  });

  it('should replace original memoized', () => {
    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(1);

    memoizedFn(1, 1, 1);
    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);

    memoizedFn(1, 1, 1);
    expect(memoizedFn.wasMemoized).toEqual(true);
    memoizedFn(2, 2, 2);
    expect(memoizedFn.wasMemoized).toEqual(false);
    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(false);
    expect(memoizedFn.lru.length).toEqual(2);

    memoizedFn(2, 2, 2);
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(2);

    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(2);
  });

  it('should move original to most recent', () => {
    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);

    memoizedFn(1, 1, 1);
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);

    memoizedFn(2, 2, 2);
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);

    memoizedFn(3, 3, 3);
    expect(memoizedFn.wasMemoized).toEqual(false);

    memoizedFn(arg1, arg2, arg3);
    expect(memoizedFn.wasMemoized).toEqual(true);
    expect(memoizedFn.lru.length).toEqual(2);
  });
});
