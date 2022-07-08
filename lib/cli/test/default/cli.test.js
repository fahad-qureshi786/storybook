const run = require('../helpers');

jest.mock('update-notifier', () => ({default: jest.fn(async () => ({notify: jest.fn()}))}));

describe('Default behavior', () => {
  it('suggests the closest match to an unknown command', () => {
    const { status, stderr, stdout } = run(['upgraed']);

    // Assertions
    expect(status).toBe(1);
    expect(stderr.toString()).toContain('Invalid command: upgraed.');
    expect(stdout.toString()).toContain('Did you mean upgrade?');
  });
});
