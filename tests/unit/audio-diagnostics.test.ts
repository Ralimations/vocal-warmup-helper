import { describe, expect, it } from "vitest";
import { formatAudioDiagnosticsText, initialAudioDiagnostics } from "@/features/audio/audio-diagnostics";

describe("audio diagnostics", () => {
  it("formats browser and audio state as pasteable plain text", () => {
    const text = formatAudioDiagnosticsText(
      { userAgent: "Test Browser", platform: "Test Platform" },
      {
        ...initialAudioDiagnostics,
        microphoneLabel: "Test Microphone",
        sampleRate: 48000,
        audioWorklet: "fallback",
        baseLatency: 0.01,
        outputLatency: 0.02,
        currentRms: 0.012345,
        yinConfidence: 0.8123,
        soundDetected: true,
        pitchDetected: true,
        frequency: 440,
        pitch: { timestamp: 1, frequency: 440, midiNumber: 69, noteName: "A", octave: 4, cents: 0, confidence: 0.81, amplitude: 0.01 },
      },
    );

    expect(text).toContain("Version: v0.1.0-alpha");
    expect(text).toContain("Microphone: Test Microphone");
    expect(text).toContain("AudioWorklet: fallback");
    expect(text).toContain("Sound detected: true");
    expect(text).toContain("Pitch detected: true");
    expect(text).toContain("Detected note: A4");
    expect(text).toContain("Audio base latency: 10.00 ms");
  });
});
