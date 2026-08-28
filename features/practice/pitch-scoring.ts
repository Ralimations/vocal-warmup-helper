import type { PitchFrame } from "@/types/domain";
import type { TargetNote } from "@/features/practice/target-note-sequence";

export interface TimedPitchFrame {
  frame: PitchFrame;
  elapsedMs: number;
}

export interface PitchScore {
  accuracy: number;
  averageCentsError: number;
  validFrameCount: number;
  highestMidi?: number;
  lowestMidi?: number;
  noteScores?: PitchNoteScore[];
}

export interface PitchNoteScore {
  targetId: string;
  accuracy: number;
  averageCentsError: number;
  validFrameCount: number;
}

export const MIN_PITCH_CONFIDENCE = 0.35;
export const MIN_PITCH_AMPLITUDE = 0.005;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function scorePitchFrames(samples: TimedPitchFrame[], targets: TargetNote[], toleranceCents = 50): PitchScore {
  const deviations: number[] = [];
  const detectedMidis: number[] = [];
  const deviationsByTarget = new Map<string, number[]>();

  for (const sample of samples) {
    if (sample.frame.confidence < MIN_PITCH_CONFIDENCE || sample.frame.amplitude < MIN_PITCH_AMPLITUDE) continue;
    const target = targets.find((candidate) => sample.elapsedMs >= candidate.pitchEvaluationStartMs && sample.elapsedMs < candidate.pitchEvaluationEndMs);
    if (!target) continue;
    const deviation = 1200 * Math.log2(sample.frame.frequency / target.frequency);
    if (!Number.isFinite(deviation)) continue;
    deviationsByTarget.set(target.id, [...(deviationsByTarget.get(target.id) ?? []), deviation]);
    detectedMidis.push(sample.frame.midiNumber);
  }

  const noteScores = Array.from(deviationsByTarget.entries()).map(([targetId, targetDeviations]) => {
    const sorted = [...targetDeviations].sort((left, right) => left - right);
    const median = sorted[Math.floor(sorted.length / 2)];
    const averageCentsError = Math.abs(median);
    return { targetId, accuracy: Math.round(clamp(100 * (1 - averageCentsError / toleranceCents), 0, 100)), averageCentsError: Math.round(averageCentsError * 10) / 10, validFrameCount: targetDeviations.length };
  });
  deviations.push(...noteScores.map((score) => score.averageCentsError));
  if (deviations.length === 0) return { accuracy: 0, averageCentsError: 0, validFrameCount: 0, noteScores: [] };
  const averageCentsError = deviations.reduce((total, deviation) => total + deviation, 0) / deviations.length;
  return {
    accuracy: Math.round(clamp(100 * (1 - averageCentsError / toleranceCents), 0, 100)),
    averageCentsError: Math.round(averageCentsError * 10) / 10,
    validFrameCount: detectedMidis.length,
    highestMidi: Math.max(...detectedMidis),
    lowestMidi: Math.min(...detectedMidis),
    noteScores,
  };
}
