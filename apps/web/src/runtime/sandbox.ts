import type { DrawCommand, InputSnapshot } from "@tynt/core";
import { mapGeneratedPosition, type CompiledCartridge } from "./compiler";
import { createIframeDocument } from "./iframe-source";
import { newRunToken, parseIframeMessage, type CartridgeAudio, type ErrorPhase } from "./protocol";
import { createWorkerSource } from "./worker-source";

export interface SandboxFrame { commands: DrawCommand[] }
export interface SandboxError { phase: ErrorPhase; message: string; line?: number; column?: number }

interface MessageTarget { postMessage(message: unknown, targetOrigin: string): void }
export interface SandboxIframe {
  contentWindow: MessageTarget | null;
  srcdoc: string;
  dataset: { runtimeState?: string };
  setSandbox(value: string): void;
  addEventListener(type: "load", callback: () => void): void;
  remove(): void;
}

export interface SandboxEnvironment {
  createIframe(): SandboxIframe;
  appendIframe(iframe: SandboxIframe): void;
  addMessageListener(callback: (event: MessageEvent) => void): void;
  removeMessageListener(callback: (event: MessageEvent) => void): void;
}

function createDomEnvironment(): SandboxEnvironment {
  return {
    createIframe() {
      const element = document.createElement("iframe");
      element.className = "runtime-sandbox";
      element.hidden = true;
      return Object.assign(element, { setSandbox: (value: string) => element.setAttribute("sandbox", value) }) as unknown as SandboxIframe;
    },
    appendIframe: (iframe) => document.body.appendChild(iframe as unknown as Node),
    addMessageListener: (callback) => window.addEventListener("message", callback),
    removeMessageListener: (callback) => window.removeEventListener("message", callback),
  };
}

export interface SandboxCallbacks {
  onReady?(): void;
  onFrame?(frame: SandboxFrame): void;
  onAudio?(command: CartridgeAudio): void;
  onError?(error: SandboxError): void;
  onStop?(): void;
}

const MAX_AUDIO_EVENTS_PER_SECOND = 64;
const MAX_AUDIO_EVENTS_PER_RUN = 36_000;

export class SandboxRun {
  readonly token: string;
  private iframe: SandboxIframe | null = null;
  private active = false;
  private readonly environment: SandboxEnvironment;
  private audioWindowStart = 0;
  private audioWindowCount = 0;
  private audioTotal = 0;

  constructor(
    private readonly compiled: CompiledCartridge,
    private readonly callbacks: SandboxCallbacks = {},
    environment?: SandboxEnvironment,
    token = newRunToken(),
    private readonly now: () => number = () => performance.now(),
  ) {
    if (!environment && typeof document === "undefined") throw new Error("A sandbox environment is required outside the browser");
    this.environment = environment ?? createDomEnvironment();
    this.token = token;
  }

  get isActive(): boolean { return this.active; }

  private acceptAudio(): void {
    const now = this.now();
    if (now - this.audioWindowStart >= 1_000) {
      this.audioWindowStart = now;
      this.audioWindowCount = 0;
    }
    if (this.audioWindowCount >= MAX_AUDIO_EVENTS_PER_SECOND) {
      throw new Error("Cartridge exceeded 64 audio events per second");
    }
    if (this.audioTotal >= MAX_AUDIO_EVENTS_PER_RUN) {
      throw new Error("Cartridge exceeded 36,000 audio events in one run");
    }
    this.audioWindowCount++;
    this.audioTotal++;
  }

  private readonly onMessage = (event: MessageEvent): void => {
    if (!this.active || event.source !== this.iframe?.contentWindow) return;
    try {
      const message = parseIframeMessage(event.data, this.token);
      if (message.kind === "ready") this.callbacks.onReady?.();
      else if (message.kind === "frame") this.callbacks.onFrame?.({ commands: message.commands });
      else if (message.kind === "audio") {
        this.acceptAudio();
        const { frequency, duration, volume, wave, delay } = message;
        this.callbacks.onAudio?.({ frequency, duration, volume, wave, delay });
      }
      else if (message.kind === "error") {
        const mapped = message.line === undefined ? null : mapGeneratedPosition(this.compiled.map, message.line, message.column ?? 0);
        this.callbacks.onError?.({
          phase: message.phase,
          message: message.message,
          line: mapped?.line,
          column: mapped?.column,
        });
        this.stop();
      }
    } catch (error) {
      this.callbacks.onError?.({ phase: "protocol", message: error instanceof Error ? error.message : "Invalid sandbox message" });
      this.stop();
    }
  };

  start(): void {
    if (this.active) return;
    const iframe = this.environment.createIframe();
    this.iframe = iframe;
    this.active = true;
    iframe.dataset.runtimeState = "starting";
    iframe.setSandbox("allow-scripts");
    iframe.srcdoc = createIframeDocument(this.token);
    iframe.addEventListener("load", () => {
      if (!this.active) return;
      iframe.contentWindow?.postMessage({
        kind: "boot",
        token: this.token,
        workerSource: createWorkerSource(this.compiled.code, this.token),
      }, "*");
    });
    this.environment.addMessageListener(this.onMessage);
    this.environment.appendIframe(iframe);
  }

  tick(input: InputSnapshot): void {
    if (!this.active) return;
    this.iframe?.contentWindow?.postMessage({ kind: "tick", token: this.token, input }, "*");
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    try { this.iframe?.contentWindow?.postMessage({ kind: "stop", token: this.token }, "*"); } catch {}
    this.environment.removeMessageListener(this.onMessage);
    this.iframe?.remove();
    this.iframe = null;
    this.callbacks.onStop?.();
  }
}
