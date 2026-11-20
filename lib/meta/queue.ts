type MetaJob = () => void;

const jobs = new Map<string, MetaJob>();
const listeners = new Set<() => void>();

let live = false;

export function enqueueMeta(key: string, job: MetaJob): void {
  if (live) {
    job();
    return;
  }
  jobs.set(key, job);
}

export function metaIsLive(): boolean {
  return live;
}

export function drainMeta(): void {
  if (live) return;
  live = true;
  const pending = [...jobs.values()];
  jobs.clear();
  for (const listener of listeners) listener();
  for (const job of pending) job();
}

export function subscribeMetaLive(listener: () => void): () => void {
  listeners.add(listener);
  if (live) listener();
  return () => {
    listeners.delete(listener);
  };
}
