// Checks that turn what a test found into the type it needs, failing the test when it is not, instead of asserting it.

// The value as an instance of `kind`, or a failed test saying what it was meant to be.
export const instanceOf = <T>(value: unknown, kind: abstract new (...args: never[]) => T): T => {
  if (value instanceof kind) {
    return value;
  }

  throw new Error(`Expected a ${kind.name}.`);
};
