import { FixedClock, InputState, type InputName, type InputSnapshot } from "@tynt/core";
import { compileCartridge, type CompiledCartridge } from "./compiler";
import { SandboxRun, type SandboxCallbacks, type SandboxError, type SandboxFrame } from "./sandbox";
import { CartridgeAudioEngine } from "./audio";
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
  onStatus(status: "compiling" | "starting" | "running" | "stopped" | "error"): void;
  onError(error: SandboxError, previewAvailable: boolean): void;
  onFrame?(frame: SandboxFrame): void;
  onAudio?(audio: CartridgeAudio): void;
  onAudioStop?(): void;
  onAudioEnabled?(enabled: boolean): void;
}

function browserDependencies(onStatus: RuntimeDependencies["onStatus"], onError: RuntimeDependencies["onError"], onFrame: NonNullable<RuntimeDependencies["onFrame"]>): RuntimeDependencies {
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

  static forBrowser(
    onStatus: RuntimeDependencies["onStatus"],
    onError: RuntimeDependencies["onError"],
    onFrame: NonNullable<RuntimeDependencies["onFrame"]>,
  ): RuntimeController {
    return new RuntimeController(browserDependencies(onStatus, onError, onFrame));
  }

  constructor(private readonly dependencies: RuntimeDependencies) {}

  get isRunning(): boolean { return this.runInstance?.isActive ?? false; }

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
    let nextRun: RuntimeRun;
    nextRun = this.dependencies.createRun(compiled, {
      onReady: () => {
        if (this.runInstance !== nextRun) return;
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
      },
      onStop: () => {
        if (this.runInstance !== nextRun) return;
        this.stopLoop();
        this.input.reset();
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
    for (let index = 0; index < steps && active.isActive; index++) active.tick(this.input.beginUpdate());
    if (active.isActive) this.animationFrame = this.dependencies.requestFrame(this.onAnimationFrame);
  };

  setKey(code: string, down: boolean): boolean {
    return down ? this.input.keyDown(code) : this.input.keyUp(code);
  }

  setInput(input: InputName, down: boolean): void {
    if (down) this.input.press(input);
    else this.input.release(input);
  }

  resetInput(): void { this.input.reset(); }

  setAudioEnabled(enabled: boolean): void { this.dependencies.onAudioEnabled?.(enabled); }

  private stopLoop(): void {
    if (this.animationFrame !== null) this.dependencies.cancelFrame(this.animationFrame);
    this.animationFrame = null;
  }

  stop(): void {
    this.runRequest++;
    const active = this.runInstance;
    this.runInstance = null;
    this.stopLoop();
    active?.stop();
    this.dependencies.onAudioStop?.();
    this.input.reset();
    this.dependencies.onStatus("stopped");
  }
}
