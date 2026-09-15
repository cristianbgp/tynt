import { FixedClock, INPUT_NAMES, InputState, type InputName, type InputSnapshot } from "@tynt/core";
import { compileCartridge, type CompiledCartridge } from "./compiler";
import { SandboxRun, type SandboxCallbacks, type SandboxError, type SandboxFrame } from "./sandbox";
import { CartridgeAudioEngine } from "./audio";
import type { RuntimeDebugState } from "./debug-store";
import type { CartridgeAudio } from "./protocol";

export interface RuntimeRun {
  readonly isActive: boolean;
  start(): void;
  tick(input: InputSnapshot): void;
  stop(): void;
}

export interface RuntimeDependencies {
  compile(source: string): Promise<CompiledCartridge>;
  createRun(compiled: CompiledCartridge, callbacks: SandboxCallbacks): RuntimeRun;
  requestFrame(callback: (time: number) => void): number;
  cancelFrame(id: number): void;
  now(): number;
  onStatus(status: "compiling" | "starting" | "running" | "paused" | "stopped" | "error"): void;
  onError(error: SandboxError, previewAvailable: boolean): void;
  onFrame?(frame: SandboxFrame): void;
  onAudio?(audio: CartridgeAudio): void;
  onAudioStop?(): void;
  onAudioEnabled?(enabled: boolean): void;
  onDebugState?(state: RuntimeDebugState): void;
}

const KEY_TO_INPUT: Readonly<Record<string, InputName>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyZ: "a",
  KeyX: "b",
};

function browserDependencies(onStatus: RuntimeDependencies["onStatus"], onError: RuntimeDependencies["onError"], onFrame: NonNullable<RuntimeDependencies["onFrame"]>, onDebugState?: RuntimeDependencies["onDebugState"]): RuntimeDependencies {
  const audio = new CartridgeAudioEngine();
  return {
    compile: compileCartridge,
    createRun: (compiled, callbacks) => new SandboxRun(compiled, callbacks),
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (id) => cancelAnimationFrame(id),
    now: () => performance.now(),
    onStatus,
    onError,
    onFrame,
    onDebugState,
    onAudio: (command) => { void audio.play(command); },
    onAudioStop: () => audio.stop(),
    onAudioEnabled: (enabled) => audio.setEnabled(enabled),
  };
}

export class RuntimeController {
  private readonly input = new InputState();
  private readonly clock = new FixedClock();
  private runInstance: RuntimeRun | null = null;
  private animationFrame: number | null = null;
  private runRequest = 0;
  private paused = false;
  private frameCount = 0;
  private readonly inspectedHeld = new Set<InputName>();
  private readonly inspectedPressed = new Set<InputName>();

  static forBrowser(
    onStatus: RuntimeDependencies["onStatus"],
    onError: RuntimeDependencies["onError"],
    onFrame: NonNullable<RuntimeDependencies["onFrame"]>,
    onDebugState?: RuntimeDependencies["onDebugState"],
  ): RuntimeController {
    return new RuntimeController(browserDependencies(onStatus, onError, onFrame, onDebugState));
  }

  constructor(private readonly dependencies: RuntimeDependencies) {}

  get isRunning(): boolean { return this.runInstance?.isActive ?? false; }
  get isPaused(): boolean { return this.paused && this.isRunning; }

  private inspectedInput(): InputSnapshot {
    return {
      held: INPUT_NAMES.filter((input) => this.inspectedHeld.has(input)),
      pressed: INPUT_NAMES.filter((input) => this.inspectedPressed.has(input)),
    };
  }

  private setInspectedInput(input: InputName, down: boolean): void {
    if (down) {
      if (!this.inspectedHeld.has(input)) this.inspectedPressed.add(input);
      this.inspectedHeld.add(input);
    } else {
      this.inspectedHeld.delete(input);
    }
  }

  private publishDebugState(input: InputSnapshot = this.inspectedInput()): void {
    this.dependencies.onDebugState?.({ frame: this.frameCount, held: input.held, pressed: input.pressed });
  }

  private resetDebugState(): void {
    this.paused = false;
    this.frameCount = 0;
    this.inspectedHeld.clear();
    this.inspectedPressed.clear();
    this.publishDebugState({ held: [], pressed: [] });
  }

  private tick(active: RuntimeRun): void {
    const input = this.input.beginUpdate();
    this.inspectedPressed.clear();
    active.tick(input);
    this.frameCount++;
    this.publishDebugState(input);
  }

  async run(source: string): Promise<boolean> {
    const request = ++this.runRequest;
    this.dependencies.onStatus("compiling");
    let compiled: CompiledCartridge;
    try {
      compiled = await this.dependencies.compile(source);
    } catch (error) {
      if (request !== this.runRequest) return false;
      this.dependencies.onStatus("error");
      this.dependencies.onError(
        { phase: "protocol", message: error instanceof Error ? error.message : String(error) },
        this.isRunning,
      );
      return false;
    }
    if (request !== this.runRequest) return false;

    this.stopLoop();
    this.dependencies.onAudioStop?.();
    this.runInstance?.stop();
    this.input.reset();
    this.resetDebugState();
    let nextRun: RuntimeRun;
    nextRun = this.dependencies.createRun(compiled, {
      onReady: () => {
        if (this.runInstance !== nextRun) return;
        this.paused = false;
        this.dependencies.onStatus("running");
        this.clock.reset(this.dependencies.now());
        this.animationFrame = this.dependencies.requestFrame(this.onAnimationFrame);
      },
      onFrame: (frame) => {
        if (this.runInstance === nextRun) this.dependencies.onFrame?.(frame);
      },
      onAudio: (audio) => {
        if (this.runInstance === nextRun) this.dependencies.onAudio?.(audio);
      },
      onError: (error) => {
        if (this.runInstance !== nextRun) return;
        this.dependencies.onStatus("error");
        this.dependencies.onError(error, false);
        this.stopLoop();
        this.dependencies.onAudioStop?.();
        this.input.reset();
        this.resetDebugState();
      },
      onStop: () => {
        if (this.runInstance !== nextRun) return;
        this.stopLoop();
        this.input.reset();
        this.resetDebugState();
        this.runInstance = null;
      },
    });
    this.runInstance = nextRun;
    this.dependencies.onStatus("starting");
    nextRun.start();
    return true;
  }

  private readonly onAnimationFrame = (time: number): void => {
    this.animationFrame = null;
    const active = this.runInstance;
    if (!active?.isActive) return;
    const steps = this.clock.advance(time);
    for (let index = 0; index < steps && active.isActive; index++) this.tick(active);
    if (active.isActive) this.animationFrame = this.dependencies.requestFrame(this.onAnimationFrame);
  };

  setKey(code: string, down: boolean): boolean {
    const handled = down ? this.input.keyDown(code) : this.input.keyUp(code);
    const input = KEY_TO_INPUT[code];
    if (handled && input) {
      this.setInspectedInput(input, down);
      this.publishDebugState();
    }
    return handled;
  }

  setInput(input: InputName, down: boolean): void {
    if (down) this.input.press(input);
    else this.input.release(input);
    this.setInspectedInput(input, down);
    this.publishDebugState();
  }

  resetInput(): void {
    this.input.reset();
    this.inspectedHeld.clear();
    this.inspectedPressed.clear();
    this.publishDebugState();
  }

  setAudioEnabled(enabled: boolean): void { this.dependencies.onAudioEnabled?.(enabled); }

  private stopLoop(): void {
    if (this.animationFrame !== null) this.dependencies.cancelFrame(this.animationFrame);
    this.animationFrame = null;
  }

  pause(): boolean {
    if (!this.isRunning || this.paused) return false;
    this.paused = true;
    this.stopLoop();
    this.dependencies.onAudioStop?.();
    this.dependencies.onStatus("paused");
    return true;
  }

  resume(): boolean {
    if (!this.isPaused) return false;
    this.paused = false;
    this.clock.reset(this.dependencies.now());
    this.dependencies.onStatus("running");
    this.animationFrame = this.dependencies.requestFrame(this.onAnimationFrame);
    return true;
  }

  step(): boolean {
    const active = this.runInstance;
    if (!active?.isActive || !this.paused) return false;
    this.tick(active);
    return true;
  }

  stop(): void {
    this.runRequest++;
    const active = this.runInstance;
    this.runInstance = null;
    this.stopLoop();
    active?.stop();
    this.dependencies.onAudioStop?.();
    this.input.reset();
    this.resetDebugState();
    this.dependencies.onStatus("stopped");
  }
}
