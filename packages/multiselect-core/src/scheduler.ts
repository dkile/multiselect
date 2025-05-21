export interface Scheduler {
  schedule(fn: () => void): void;
}

export const rafScheduler: Scheduler = {
  schedule: (fn: () => void) => {
    requestAnimationFrame(fn);
  },
};
