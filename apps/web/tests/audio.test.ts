import { expect, test, vi } from "vitest";
import { CartridgeAudioEngine } from "../src/runtime/audio";

test("schedules a bounded oscillator and stops active cartridge audio", async () => {
  const events: Array<string | number> = [];
  const oscillator = {
    type: "sine", frequency: { setValueAtTime: (value: number) => events.push(value) },
    connect: () => {}, start: (time: number) => events.push(`start:${time}`), stop: (time?: number) => events.push(`stop:${time}`),
    addEventListener: () => {}, disconnect: () => {},
  };
  const gain = { gain: { setValueAtTime: (value: number) => events.push(value), linearRampToValueAtTime: () => {} }, connect: () => {}, disconnect: () => {} };
  const context = { currentTime: 2, state: "suspended", destination: {}, resume: async () => { events.push("resume"); }, createOscillator: () => oscillator, createGain: () => gain };
  const audio = new CartridgeAudioEngine(() => context as any);

  await audio.play({ frequency: 440, duration: 100, volume: 0.2, wave: "square", delay: 50 });
  expect(oscillator.type).toBe("square");
  expect(events).toContain("resume");
  expect(events).toContain("start:2.05");
  audio.stop();
  expect(events.some((event) => String(event).startsWith("stop:"))).toBe(true);
});

test("does not create browser audio while cartridge sound is disabled", async () => {
  const createContext = vi.fn();
  const audio = new CartridgeAudioEngine(createContext);
  audio.setEnabled(false);
  await audio.play({ frequency: 440, duration: 100, volume: 0.2, wave: "square", delay: 0 });
  expect(createContext).not.toHaveBeenCalled();
});
