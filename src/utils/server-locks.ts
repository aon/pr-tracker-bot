import { Mutex, MutexInterface, withTimeout } from "async-mutex";

const locks = new Map<string, Lock>();

export class Lock {
  private pendingLocks: number;
  private readonly mutex: MutexInterface;
  private readonly MUTEX_TIMEOUT = 60 * 1000; // 1 minute

  constructor() {
    this.pendingLocks = 0;
    this.mutex = withTimeout(
      new Mutex(),
      this.MUTEX_TIMEOUT,
      new Error("Failed to acquire lock")
    );
  }

  async acquire() {
    this.pendingLocks++;
    await this.mutex.acquire();
  }

  release() {
    this.pendingLocks--;
    this.mutex.release();
  }

  hasPendingLocks() {
    return this.pendingLocks > 0;
  }
}

export const acquireLock = async (key: string) => {
  if (!locks.has(key)) {
    locks.set(key, new Lock());
  }

  const lock = locks.get(key) as Lock;
  await lock.acquire();
};

export function releaseLock(key: string) {
  if (!locks.has(key)) return;

  const lock = locks.get(key) as Lock;
  lock.release();

  if (!lock.hasPendingLocks()) {
    locks.delete(key);
  }
}
