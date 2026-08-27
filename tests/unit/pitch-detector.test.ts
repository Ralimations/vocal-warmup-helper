import { describe, expect, it } from "vitest";
import { YinPitchDetector } from "@/features/audio/pitch-detector";

describe("YIN pitch detector", () => {
  it("detects a clean sine wave near A4", () => {
    const detector = new YinPitchDetector();
    const samples = Float32Array.from({ length: 4096 }, (_, index) =>
      Math.sin((2 * Math.PI * 440 * index) / 44100),
    );

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
});
