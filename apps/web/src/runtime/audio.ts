import type { CartridgeAudio } from "./protocol";

type AudioContextFactory = () => AudioContext;

export class CartridgeAudioEngine {
  private context: AudioContext | null = null;
  private readonly active = new Set<OscillatorNode>();
  private enabled = true;

  constructor(private readonly createContext: AudioContextFactory = () => new AudioContext()) {}

  async play(command: CartridgeAudio): Promise<void> {
    if (!this.enabled) return;
    const context = this.context ??= this.createContext();
    if (context.state === "suspended") await context.resume();
    const start = context.currentTime + command.delay / 1_000;
    const end = start + command.duration / 1_000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = command.wave;
    oscillator.frequency.setValueAtTime(command.frequency, start);
    gain.gain.setValueAtTime(command.volume, start);
    gain.gain.linearRampToValueAtTime(0, end);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.active.add(oscillator);
    oscillator.addEventListener("ended", () => {
      this.active.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
    oscillator.start(start);
    oscillator.stop(end);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  stop(): void {
    for (const oscillator of this.active) {
      try { oscillator.stop(); } catch {}
      oscillator.disconnect();
    }
    this.active.clear();
  }
}
