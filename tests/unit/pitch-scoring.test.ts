import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { buildTargetNotes } from "@/features/practice/target-note-sequence";
import { scorePitchFrames } from "@/features/practice/pitch-scoring";
import type { PitchFrame } from "@/types/domain";

const frame = (frequency: number, midiNumber = 60): PitchFrame => ({ timestamp: 0, frequency, midiNumber, noteName: "C", octave: 4, cents: 0, confidence: 0.95, amplitude: 0.2 });

describe("pitch scoring", () => {
  it("evaluates each scale note independently using its stable middle window", () => {
    const exercise = { ...exercises.find((item) => item.id === "five-note-major")!, countInBeats: 0, pattern: [0, 2] };
    const item = { exerciseId: exercise.id, order: 0, duration: 3, tempo: 60, startNote: "C4", endNote: "D4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };
    const targets = buildTargetNotes(exercise, item);
    const first = targets[0];
    const second = targets[1];
    const samples = [
      { frame: frame(first.frequency * 2 ** (100 / 1200)), elapsedMs: first.startMs + 50 },
      { frame: frame(first.frequency * 2 ** (10 / 1200)), elapsedMs: first.pitchEvaluationStartMs + 20 },
      { frame: frame(first.frequency * 2 ** (-10 / 1200)), elapsedMs: first.pitchEvaluationEndMs - 20 },
      { frame: frame(first.frequency * 2 ** (100 / 1200)), elapsedMs: first.singEndMs - 20 },
      { frame: frame(second.frequency * 2 ** (5 / 1200), 62), elapsedMs: second.pitchEvaluationStartMs + 20 },
    ];

    const score = scorePitchFrames(samples, targets);

    expect(score.noteScores).toHaveLength(2);
    expect(score.noteScores?.[0].validFrameCount).toBe(2);
    expect(score.noteScores?.[0].averageCentsError).toBe(10);
    expect(score.noteScores?.[1].validFrameCount).toBe(1);
  });
});
