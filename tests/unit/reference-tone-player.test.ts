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
  it("starts one sustained oscillator per target and replaces it on target change", async () => {
    const context = new FakeAudioContext();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: vi.fn(() => context) });
    const player = new ReferenceTonePlayer();
    await player.unlock();
    player.start("E4");
    player.start("E4");

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0].start).toHaveBeenCalledOnce();
    expect(context.oscillators[0].stop).not.toHaveBeenCalled();
    player.start("F4");
    expect(context.oscillators).toHaveLength(2);
    expect(context.oscillators[0].stop).toHaveBeenCalledOnce();
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
    expect(context.oscillators[0].stop).toHaveBeenCalledOnce();
    player.close();
  });
});
