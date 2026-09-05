import { describe, expect, it, vi, afterEach } from "vitest";
import { ReferenceTonePlayer } from "@/features/audio/reference-tone-player";

class FakeAudioParam {
  value = 0;
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
  setTargetAtTime = vi.fn();
}

class FakeOscillator {
  type = "sine";
  frequency = new FakeAudioParam();
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  connect = vi.fn(() => new FakeGain());
}

class FakeGain {
  gain = new FakeAudioParam();
  connect = vi.fn(() => ({}));
}

class FakeAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};
  oscillators: FakeOscillator[] = [];
  createOscillator = vi.fn(() => {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  });
  createGain = vi.fn(() => new FakeGain());
  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => undefined);
}

const originalAudioContext = window.AudioContext;

afterEach(() => {
  Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
});

describe("ReferenceTonePlayer", () => {
  it("layers piano harmonics for each target and replaces the voice on target change", async () => {
    const context = new FakeAudioContext();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: vi.fn(() => context) });
    const player = new ReferenceTonePlayer();
    await player.unlock();
    player.start("E4");
    player.start("E4");

    expect(context.oscillators).toHaveLength(3);
    expect(context.oscillators.map((oscillator) => oscillator.type)).toEqual(["sine", "sine", "sine"]);
    expect(context.oscillators.map((oscillator) => oscillator.frequency.value)).toEqual([
      expect.closeTo(329.63, 1),
      expect.closeTo(659.26, 1),
      expect.closeTo(988.89, 1),
    ]);
    expect(context.oscillators.every((oscillator) => oscillator.start.mock.calls.length === 1)).toBe(true);
    player.start("F4");
    expect(context.oscillators).toHaveLength(6);
    expect(context.oscillators.slice(0, 3).every((oscillator) => oscillator.stop.mock.calls.length >= 1)).toBe(true);
    player.close();
  });

  it("ducks the sustained guide and stops it cleanly", async () => {
    const context = new FakeAudioContext();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: vi.fn(() => context) });
    const player = new ReferenceTonePlayer();
    await player.unlock();
    player.start("E4");
    player.duck();
    player.stop();

    const gain = context.createGain.mock.results[0]?.value as FakeGain;
    expect(gain.gain.setTargetAtTime).toHaveBeenCalled();
    expect(context.oscillators.every((oscillator) => oscillator.stop.mock.calls.length >= 1)).toBe(true);
    player.replay("E4");
    expect(context.oscillators).toHaveLength(6);
    player.close();
  });
});
