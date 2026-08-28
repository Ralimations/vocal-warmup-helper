import { describe, expect, it } from "vitest";
import { MIN_STABLE_VOICED_FRAMES, MIN_STABLE_SOUND_FRAMES, SOUND_RELEASE_FRAMES, SoundActivityTracker, YinPitchDetector } from "@/features/audio/pitch-detector";

describe("YIN pitch detector", () => {
  it("detects a clean sine wave near A4", () => {
    const detector = new YinPitchDetector();
    const samples = Float32Array.from({ length: 4096 }, (_, index) =>
      Math.sin((2 * Math.PI * 440 * index) / 44100),
    );

    expect(detector.detect(samples, 44100)).toBeNull();
    expect(detector.detect(samples, 44100)).toBeNull();
    const result = detector.detect(samples, 44100);

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.frequency).toBeGreaterThan(439);
    expect(result.frequency).toBeLessThan(442);
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it("rejects silence", () => {
    const detector = new YinPitchDetector();
    const result = detector.detect(new Float32Array(2048), 44100);

    expect(result).toBeNull();
  });

  it("rejects an isolated transient instead of treating it as voiced", () => {
    const detector = new YinPitchDetector();
    const transient = new Float32Array(4096);
    transient[200] = 1;

    expect(detector.detect(transient, 44100)).toBeNull();
    expect(detector.detect(new Float32Array(4096), 44100)).toBeNull();
  });

  it("requires consecutive stable voiced observations", () => {
    const detector = new YinPitchDetector();
    const samples = Float32Array.from({ length: 4096 }, (_, index) => Math.sin((2 * Math.PI * 440 * index) / 44100));

    for (let index = 0; index < MIN_STABLE_VOICED_FRAMES - 1; index += 1) expect(detector.detect(samples, 44100)).toBeNull();
    expect(detector.detect(samples, 44100)).not.toBeNull();
  });

  it("keeps sound activity separate from pitch availability", () => {
    const tracker = new SoundActivityTracker();
    for (let index = 0; index < MIN_STABLE_SOUND_FRAMES - 1; index += 1) expect(tracker.update(0.05)).toBe(false);
    expect(tracker.update(0.05)).toBe(true);
    expect(tracker.update(0)).toBe(true);
    for (let index = 0; index < SOUND_RELEASE_FRAMES - 2; index += 1) expect(tracker.update(0)).toBe(true);
    expect(tracker.update(0)).toBe(false);
  });
});
