export function timeoutFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function timeout(cb: Function, ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(() => {
      cb();
      resolve();
    }, ms),
  );
}
