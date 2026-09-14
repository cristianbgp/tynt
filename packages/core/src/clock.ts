/** Duration of one 60 Hz engine update in milliseconds. */
export const TICK_MS = 1000 / 60;

/** Converts elapsed wall time into deterministic fixed-rate update counts. */
export class FixedClock {
  private previous = 0;
  private accumulator = 0;

  constructor(private readonly maxCatchUpSteps = 5) {}

  /**
   * Establishes a new clock origin and discards accumulated time.
   * @param nowMs - Current monotonic time in milliseconds.
   */
  reset(nowMs: number): void {
    this.previous = nowMs;
    this.accumulator = 0;
  }

  /**
   * Advances the clock and reports how many fixed updates should run.
   * Excess backlog beyond the configured catch-up limit is dropped.
   * @param nowMs - Current monotonic time in milliseconds.
   * @returns The number of updates to execute.
   * @example
   * ```ts
   * const clock = new FixedClock();
   * clock.reset(0);
   * clock.advance(TICK_MS); // 1
   * ```
   */
  advance(nowMs: number): number {
    const elapsed = Math.max(0, nowMs - this.previous);
    this.previous = nowMs;
    this.accumulator += elapsed;
    const available = Math.floor((this.accumulator + 1e-9) / TICK_MS);
    const steps = Math.min(available, this.maxCatchUpSteps);
    if (available > this.maxCatchUpSteps) this.accumulator = 0;
    else this.accumulator -= steps * TICK_MS;
    return steps;
  }
}
