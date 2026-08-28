import { describe, expect, it } from "vitest";
import { calculatePitchStability, centsToMeterPercent, getPitchInputState, getSustainProgress, getTunerState, isPitchStale, trimPitchTrail, type PitchObservation } from "@/features/practice/pitch-feedback";
import { exercises } from "@/data/exercises";
import { buildTargetNotes } from "@/features/practice/target-note-sequence";

describe("pitch feedback", () => {
  it("classifies flat, in-tune, and sharp pitch", () => {
    expect(getTunerState(-11)).toBe("FLAT");
    expect(getTunerState(10)).toBe("IN TUNE");
    expect(getTunerState(11)).toBe("SHARP");
  });

  it("clamps the tuner marker to the visible range", () => {
    expect(centsToMeterPercent(-100)).toBe(0);
    expect(centsToMeterPercent(100)).toBe(100);
    expect(centsToMeterPercent(0)).toBe(50);
  });

  it("trims the pitch trail to its time window", () => {
    const observations: PitchObservation[] = [
      { timestamp: 0, cents: -2 },
      { timestamp: 1000, cents: 1 },
      { timestamp: 5000, cents: 3 },
      { timestamp: 5001, cents: 4 },
      { timestamp: 4000, cents: Number.NaN },
    ];

    expect(trimPitchTrail(observations, 5000).map((observation) => observation.timestamp)).toEqual([0, 1000, 5000]);
  });

  it("reports stable pitch separately from accuracy", () => {
    expect(calculatePitchStability([{ timestamp: 1, cents: 15 }, { timestamp: 2, cents: 15 }, { timestamp: 3, cents: 16 }])).toBeGreaterThan(95);
    expect(calculatePitchStability([{ timestamp: 1, cents: -35 }, { timestamp: 2, cents: 35 }, { timestamp: 3, cents: -30 }, { timestamp: 4, cents: 30 }])).toBeLessThan(25);
  });

  it("excludes silent, uncertain, and invalid observations from stability", () => {
    expect(calculatePitchStability([
      { timestamp: 1, cents: 0, confidence: 0.2 },
      { timestamp: 2, cents: 0, amplitude: 0.001 },
      { timestamp: 3, cents: Number.NaN },
      { timestamp: 4, cents: 8 },
    ])).toBe(100);
  });

  it("calculates sustain progress only within the singing window", () => {
    const exercise = { ...exercises.find((item) => item.id === "humming")!, pattern: [0] };
    const target = buildTargetNotes(exercise, { exerciseId: exercise.id, order: 0, duration: 6, tempo: 60, startNote: "C4", endNote: "C4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 })[0];
    expect(getSustainProgress(target.singStartMs - 1, target).percent).toBe(0);
    expect(getSustainProgress(target.singStartMs + 1500, target).percent).toBe(50);
    expect(getSustainProgress(target.singEndMs + 1, target).percent).toBe(100);
  });

  it("identifies stale pitch and input states", () => {
    expect(isPitchStale(null, 1000)).toBe(true);
    expect(isPitchStale(100, 799)).toBe(false);
    expect(isPitchStale(100, 800)).toBe(true);
    expect(getPitchInputState(null)).toBe("No voice detected");
    expect(getPitchInputState({ timestamp: 0, frequency: 1, midiNumber: 0, noteName: "C", octave: 0, cents: 0, confidence: 0.9, amplitude: 0.001 })).toBe("Too quiet");
  });
});
