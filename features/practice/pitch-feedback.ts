import type { PitchFrame } from "@/types/domain";
import type { TargetNote } from "@/features/practice/target-note-sequence";

export const TUNER_DISPLAY_RANGE_CENTS = 50;
export const TUNER_IN_TUNE_RANGE_CENTS = 10;
export const PITCH_TRAIL_WINDOW_MS = 5000;
export const STALE_PITCH_TIMEOUT_MS = 700;
export const PITCH_MIN_CONFIDENCE = 0.35;
export const PITCH_MIN_AMPLITUDE = 0.005;
export const PITCH_STABILITY_MAX_DEVIATION_CENTS = 35;

export type TunerState = "NO SIGNAL" | "FLAT" | "IN TUNE" | "SHARP";
export type PitchInputState = "No voice detected" | "Too quiet" | "Pitch uncertain" | "Detected";

export interface PitchObservation {
  timestamp: number;
  cents: number;
  confidence?: number;
  amplitude?: number;
  valid?: boolean;
}

export interface SustainProgress {
  elapsedMs: number;
  durationMs: number;
  percent: number;
}

export function isUsablePitchFrame(frame: PitchFrame): boolean {
  return frame.confidence >= PITCH_MIN_CONFIDENCE && frame.amplitude >= PITCH_MIN_AMPLITUDE && Number.isFinite(frame.frequency);
}

export function getPitchInputState(frame: PitchFrame | null): PitchInputState {
  if (!frame) return "No voice detected";
  if (frame.amplitude < PITCH_MIN_AMPLITUDE) return "Too quiet";
  if (frame.confidence < PITCH_MIN_CONFIDENCE) return "Pitch uncertain";
  return "Detected";
}

export function centsFromTarget(frequency: number, targetFrequency: number): number {
  if (frequency <= 0 || targetFrequency <= 0) return 0;
  return Math.round(1200 * Math.log2(frequency / targetFrequency) * 10) / 10;
}

export function getTunerState(cents: number | null): TunerState {
  if (cents === null || !Number.isFinite(cents)) return "NO SIGNAL";
  if (cents < -TUNER_IN_TUNE_RANGE_CENTS) return "FLAT";
  if (cents > TUNER_IN_TUNE_RANGE_CENTS) return "SHARP";
  return "IN TUNE";
}

export function clampCents(cents: number, range = TUNER_DISPLAY_RANGE_CENTS): number {
  return Math.min(range, Math.max(-range, cents));
}

export function centsToMeterPercent(cents: number | null, range = TUNER_DISPLAY_RANGE_CENTS): number | null {
  if (cents === null || !Number.isFinite(cents)) return null;
  return ((clampCents(cents, range) + range) / (range * 2)) * 100;
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

export function getSustainProgress(elapsedMs: number, target: TargetNote | undefined): SustainProgress {
  if (!target) return { elapsedMs: 0, durationMs: 0, percent: 0 };
  const durationMs = Math.max(0, target.singEndMs - target.singStartMs);
  const progressMs = Math.min(durationMs, Math.max(0, elapsedMs - target.singStartMs));
  return { elapsedMs: progressMs, durationMs, percent: durationMs ? (progressMs / durationMs) * 100 : 0 };
}

export function isPitchStale(lastValidTimestamp: number | null, nowMs: number, timeoutMs = STALE_PITCH_TIMEOUT_MS): boolean {
  return lastValidTimestamp === null || nowMs - lastValidTimestamp >= timeoutMs;
}
