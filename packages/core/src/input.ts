import { INPUT_NAMES, type InputName, type InputSnapshot } from "./api";

const KEY_TO_INPUT: Readonly<Record<string, InputName>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyZ: "a",
  KeyX: "b",
};

/** Tracks held inputs and one-update press and release transitions. */
export class InputState {
  private readonly held = new Set<InputName>();
  private readonly pendingPressed = new Set<InputName>();
  private readonly pendingReleased = new Set<InputName>();

  /** Marks an input as held and queues a press transition when newly held. */
  press(input: InputName): void {
    if (!this.held.has(input)) {
      this.held.add(input);
      this.pendingPressed.add(input);
    }
  }

  /** Removes an input from the held set and queues a release transition when previously held. */
  release(input: InputName): void {
    if (this.held.delete(input)) this.pendingReleased.add(input);
  }

  /**
   * Maps a keyboard code to a tynt input and presses it.
   * @returns Whether the code belongs to a tynt control.
   */
  keyDown(code: string): boolean {
    const input = KEY_TO_INPUT[code];
    if (!input) return false;
    this.press(input);
    return true;
  }

  /**
   * Maps a keyboard code to a tynt input and releases it.
   * @returns Whether the code belongs to a tynt control.
   */
  keyUp(code: string): boolean {
    const input = KEY_TO_INPUT[code];
    if (!input) return false;
    this.release(input);
    return true;
  }

  /**
   * Creates the next input snapshot and consumes queued edge transitions.
   * @returns Held inputs and inputs newly pressed or released for this update.
   */
  beginUpdate(): InputSnapshot {
    const snapshot = {
      held: INPUT_NAMES.filter((input) => this.held.has(input)),
      pressed: INPUT_NAMES.filter((input) => this.pendingPressed.has(input)),
      released: INPUT_NAMES.filter((input) => this.pendingReleased.has(input)),
    };
    this.pendingPressed.clear();
    this.pendingReleased.clear();
    return snapshot;
  }

  /** Clears every held input and pending edge transition. */
  reset(): void {
    this.held.clear();
    this.pendingPressed.clear();
    this.pendingReleased.clear();
  }
}
