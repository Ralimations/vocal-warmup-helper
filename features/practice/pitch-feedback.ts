import type { PitchFrame, PitchSmoothing } from "@/types/domain";
import { frequencyToPitchFrame, midiToNote } from "@/features/audio/note-converter";

export const TUNER_DISPLAY_RANGE_CENTS = 50;
export const CENTERED_THRESHOLD_CENTS = 10;
export const SUCCESS_THRESHOLD_CENTS = 25;
export const CLOSE_THRESHOLD_CENTS = 35;
export const MAX_STABLE_FREQUENCY_DELTA_CENTS = 50;
export const PITCH_TRAIL_WINDOW_MS = 5000;
export const STALE_PITCH_TIMEOUT_MS = 700;
export const PITCH_MIN_CONFIDENCE = 0.35;
export const PITCH_MIN_AMPLITUDE = 0.005;
export const PITCH_STABILITY_MAX_DEVIATION_CENTS = 35;

export type TunerState = "NO SIGNAL" | "CENTERED" | "IN TUNE" | "SLIGHTLY FLAT" | "SLIGHTLY SHARP" | "FLAT" | "SHARP";
export type PitchInputState = "No voice detected" | "Too quiet" | "Pitch uncertain" | "Detected";

export interface PracticeSignalState {
  soundDetected: boolean;
  pitchDetected: boolean;
  label: "No voice detected" | "Sound detected · Pitch unavailable" | "Pitch detected";
}

export interface PitchObservation {
  timestamp: number;
  cents: number;
  confidence?: number;
  amplitude?: number;
  valid?: boolean;
}

export interface PitchHistoryPoint {
  timestamp: number;
  midi: number;
  confidence?: number;
  amplitude?: number;
  valid?: boolean;
}

export interface PitchAxisLabel {
  note: string;
  midi: number;
  percent: number;
}

export interface SustainProgress {
  elapsedMs: number;
  durationMs: number;
  percent: number;
}

export function isUsablePitchFrame(frame: PitchFrame): boolean {
  return frame.confidence >= PITCH_MIN_CONFIDENCE && frame.amplitude >= PITCH_MIN_AMPLITUDE && Number.isFinite(frame.frequency);
}

export function smoothPitchFrame(frame: PitchFrame, previous: PitchFrame | null, mode: PitchSmoothing): PitchFrame {
  if (!previous || mode === "none") return frame;
  const currentWeight = mode === "moderate" ? 0.55 : 0.75;
  return frequencyToPitchFrame(frame.frequency * currentWeight + previous.frequency * (1 - currentWeight), frame.confidence, frame.amplitude, frame.timestamp);
}

export function getPitchInputState(frame: PitchFrame | null): PitchInputState {
  if (!frame) return "No voice detected";
  if (frame.amplitude < PITCH_MIN_AMPLITUDE) return "Too quiet";
  if (frame.confidence < PITCH_MIN_CONFIDENCE) return "Pitch uncertain";
  return "Detected";
}

export function getPracticeSignalState(soundDetected: boolean, frame: PitchFrame | null): PracticeSignalState {
  const pitchDetected = frame !== null && isUsablePitchFrame(frame);
  return {
    soundDetected,
    pitchDetected,
    label: !soundDetected ? "No voice detected" : pitchDetected ? "Pitch detected" : "Sound detected · Pitch unavailable",
  };
}

export function centsFromTarget(frequency: number, targetFrequency: number): number {
  if (frequency <= 0 || targetFrequency <= 0) return 0;
  return Math.round(1200 * Math.log2(frequency / targetFrequency) * 10) / 10;
}

export function getTunerState(cents: number | null): TunerState {
  if (cents === null || !Number.isFinite(cents)) return "NO SIGNAL";
  const absoluteCents = Math.abs(cents);
  if (absoluteCents <= CENTERED_THRESHOLD_CENTS) return "CENTERED";
  if (absoluteCents <= SUCCESS_THRESHOLD_CENTS) return "IN TUNE";
  if (absoluteCents <= CLOSE_THRESHOLD_CENTS) return cents < 0 ? "SLIGHTLY FLAT" : "SLIGHTLY SHARP";
  return cents < 0 ? "FLAT" : "SHARP";
}

export function clampCents(cents: number, range = TUNER_DISPLAY_RANGE_CENTS): number {
  return Math.min(range, Math.max(-range, cents));
}

export function centsToMeterPercent(cents: number | null, range = TUNER_DISPLAY_RANGE_CENTS): number | null {
  if (cents === null || !Number.isFinite(cents)) return null;
  return ((clampCents(cents, range) + range) / (range * 2)) * 100;
}

export function trimPitchHistory(history: PitchHistoryPoint[], nowMs: number, windowMs = PITCH_TRAIL_WINDOW_MS): PitchHistoryPoint[] {
  const cutoff = nowMs - windowMs;
  return history.filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.midi) && point.timestamp >= cutoff && point.timestamp <= nowMs && point.valid !== false && (point.confidence === undefined || point.confidence >= PITCH_MIN_CONFIDENCE) && (point.amplitude === undefined || point.amplitude >= PITCH_MIN_AMPLITUDE));
}

export function getPitchAxisLabels(history: PitchHistoryPoint[], targetMidi?: number, count = 5): PitchAxisLabel[] {
  const values = history.map((point) => point.midi).filter(Number.isFinite);
  if (targetMidi !== undefined && Number.isFinite(targetMidi)) values.push(targetMidi);
  const center = targetMidi !== undefined && Number.isFinite(targetMidi) ? targetMidi : values.length ? (Math.min(...values) + Math.max(...values)) / 2 : 60;
  const range = Math.max(8, Math.ceil((Math.max(...values, center) - Math.min(...values, center)) + 4));
  const minMidi = center - range / 2;
  const maxMidi = center + range / 2;
  return Array.from({ length: count }, (_, index) => {
    const percent = (index / Math.max(1, count - 1)) * 100;
    const midi = maxMidi - (percent / 100) * range;
    const note = midiToNote(midi);
    return { note: `${note.noteName}${note.octave}`, midi, percent };
  });
}

export function isValidPitchObservation(observation: PitchObservation): boolean {
  return observation.valid !== false
    && Number.isFinite(observation.timestamp)
    && Number.isFinite(observation.cents)
    && (observation.confidence === undefined || observation.confidence >= PITCH_MIN_CONFIDENCE)
    && (observation.amplitude === undefined || observation.amplitude >= PITCH_MIN_AMPLITUDE);
}

export function trimPitchTrail(observations: PitchObservation[], nowMs: number, windowMs = PITCH_TRAIL_WINDOW_MS): PitchObservation[] {
  const cutoff = nowMs - windowMs;
  return observations.filter((observation) => isValidPitchObservation(observation) && observation.timestamp >= cutoff && observation.timestamp <= nowMs);
}

export function calculatePitchStability(observations: PitchObservation[]): number {
  const valid = observations.filter(isValidPitchObservation);
  if (!valid.length) return 0;
  if (valid.length === 1) return 100;
  const mean = valid.reduce((total, observation) => total + observation.cents, 0) / valid.length;
  const variance = valid.reduce((total, observation) => total + (observation.cents - mean) ** 2, 0) / valid.length;
  const deviation = Math.sqrt(variance);
  return Math.round(Math.min(100, Math.max(0, 100 - (deviation / PITCH_STABILITY_MAX_DEVIATION_CENTS) * 100)));
}

export function getSuccessfulHoldProgress(heldMs: number, requiredMs: number): SustainProgress {
  const durationMs = Math.max(0, requiredMs);
  const elapsedMs = Math.min(durationMs, Math.max(0, heldMs));
  return { elapsedMs, durationMs, percent: durationMs ? (elapsedMs / durationMs) * 100 : 0 };
}

export function isPitchStale(lastValidTimestamp: number | null, nowMs: number, timeoutMs = STALE_PITCH_TIMEOUT_MS): boolean {
  return lastValidTimestamp === null || nowMs - lastValidTimestamp >= timeoutMs;
}
