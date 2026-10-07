/** Keep React's existing snapshot when the file-derived data has not changed. */
export function retainSnapshot<T>(current: T | undefined, next: T): T {
  return current !== undefined && JSON.stringify(current) === JSON.stringify(next) ? current : next;
}

export function createHeartbeat<T>(options: {
  canRead: () => boolean;
  generation: () => number;
  read: () => Promise<T>;
  apply: (snapshot: T) => void;
  onError: (error: unknown) => void;
}) {
  let pending = false, stopped = false;
  const current = (generation: number) => !stopped && options.canRead() && generation === options.generation();
  return {
    async tick() {
      if (stopped || pending || !options.canRead()) return;
      pending = true;
      const generation = options.generation();
      try {
        const snapshot = await options.read();
        if (current(generation)) options.apply(snapshot);
      } catch (error) {
        if (current(generation)) options.onError(error);
      } finally { pending = false; }
    },
    stop() { stopped = true; },
  };
}
