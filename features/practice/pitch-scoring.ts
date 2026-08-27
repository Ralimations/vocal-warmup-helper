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
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function scorePitchFrames(samples: TimedPitchFrame[], targets: TargetNote[], toleranceCents = 50): PitchScore {
  const deviations: number[] = [];
  const detectedMidis: number[] = [];

  for (const sample of samples) {
    if (sample.frame.confidence < 0.5 || sample.frame.amplitude < 0.01) continue;
    const target = targets.find((candidate) => sample.elapsedMs >= candidate.startMs && sample.elapsedMs < candidate.endMs);
    if (!target) continue;
    deviations.push(Math.abs((sample.frame.midiNumber - target.midi) * 100));
    detectedMidis.push(sample.frame.midiNumber);
  }

  if (deviations.length === 0) return { accuracy: 0, averageCentsError: 0, validFrameCount: 0 };
  const averageCentsError = deviations.reduce((total, deviation) => total + deviation, 0) / deviations.length;
  return {
    accuracy: Math.round(clamp(100 * (1 - averageCentsError / toleranceCents), 0, 100)),
    averageCentsError: Math.round(averageCentsError * 10) / 10,
    validFrameCount: deviations.length,
    highestMidi: Math.max(...detectedMidis),
    lowestMidi: Math.min(...detectedMidis),
  };
}
