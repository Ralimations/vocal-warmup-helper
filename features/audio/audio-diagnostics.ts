import type { PitchFrame } from "@/types/domain";
import { APP_VERSION } from "@/lib/alpha";

export type AudioWorkletStatus = "not-started" | "active" | "fallback" | "unsupported";

export interface AudioDiagnostics {
  microphoneLabel: string;
  sampleRate: number | null;
  audioWorklet: AudioWorkletStatus;
  baseLatency: number | null;
  outputLatency: number | null;
  currentRms: number;
  yinConfidence: number | null;
  soundDetected: boolean;
  pitchDetected: boolean;
  frequency: number | null;
  pitch: PitchFrame | null;
}

export const initialAudioDiagnostics: AudioDiagnostics = {
  microphoneLabel: "Not available until microphone permission is granted",
  sampleRate: null,
  audioWorklet: "not-started",
  baseLatency: null,
  outputLatency: null,
  currentRms: 0,
  yinConfidence: null,
  soundDetected: false,
  pitchDetected: false,
  frequency: null,
  pitch: null,
};

function formatNumber(value: number | null, digits = 2): string {
  return value === null || !Number.isFinite(value) ? "unavailable" : value.toFixed(digits);
}

export function formatAudioDiagnosticsText(
  browser: { userAgent: string; platform: string },
  diagnostics: AudioDiagnostics,
): string {
  const pitch = diagnostics.pitch;
  return [
    "Vocal Warmup diagnostics",
    `Version: ${APP_VERSION}`,
    `User agent: ${browser.userAgent}`,
    `Platform: ${browser.platform}`,
    `Microphone: ${diagnostics.microphoneLabel}`,
    `AudioContext sample rate: ${diagnostics.sampleRate === null ? "unavailable" : `${diagnostics.sampleRate} Hz`}`,
    `AudioWorklet: ${diagnostics.audioWorklet}`,
    `Current RMS: ${formatNumber(diagnostics.currentRms, 5)}`,
    `YIN confidence: ${formatNumber(diagnostics.yinConfidence, 3)}`,
    `Sound detected: ${diagnostics.soundDetected ? "true" : "false"}`,
    `Pitch detected: ${diagnostics.pitchDetected ? "true" : "false"}`,
    `Detected frequency: ${diagnostics.frequency === null ? "unavailable" : `${formatNumber(diagnostics.frequency)} Hz`}`,
    `Detected note: ${pitch ? `${pitch.noteName}${pitch.octave}` : "unavailable"}`,
    `Audio base latency: ${diagnostics.baseLatency === null ? "unavailable" : `${formatNumber(diagnostics.baseLatency * 1000)} ms`}`,
    `Audio output latency: ${diagnostics.outputLatency === null ? "unavailable" : `${formatNumber(diagnostics.outputLatency * 1000)} ms`}`,
  ].join("\n");
}
