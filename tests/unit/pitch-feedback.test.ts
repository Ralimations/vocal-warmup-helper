import { describe, expect, it } from "vitest";
import { calculatePitchStability, centsToMeterPercent, getPitchAxisLabels, getPitchInputState, getPracticeSignalState, getSuccessfulHoldProgress, getTunerState, isPitchStale, trimPitchHistory, trimPitchTrail, type PitchHistoryPoint, type PitchObservation } from "@/features/practice/pitch-feedback";
import { exercises } from "@/data/exercises";
import { buildTargetNotes } from "@/features/practice/target-note-sequence";

describe("pitch feedback", () => {
  it("uses friendly tiered tuning states", () => {
    expect(getTunerState(5)).toBe("CENTERED");
    expect(getTunerState(15)).toBe("IN TUNE");
    expect(getTunerState(-34)).toBe("SLIGHTLY FLAT");
    expect(getTunerState(34)).toBe("SLIGHTLY SHARP");
    expect(getTunerState(-36)).toBe("FLAT");
    expect(getTunerState(36)).toBe("SHARP");
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

  it("keeps absolute pitch history across target changes and generates note labels", () => {
    const history: PitchHistoryPoint[] = [{ timestamp: 1000, midi: 62 }, { timestamp: 2000, midi: 64 }];
    expect(trimPitchHistory(history, 2000)).toEqual(history);
    expect(getPitchAxisLabels(history, 64).map((label) => label.note)).toEqual(["G#4", "F#4", "E4", "D4", "C4"]);
  });

  it("does not create history points from silent or uncertain input", () => {
    expect(trimPitchHistory([
      { timestamp: 1000, midi: 64, confidence: 0.2 },
      { timestamp: 1000, midi: 64, amplitude: 0.001 },
      { timestamp: 1000, midi: Number.NaN },
      { timestamp: 1000, midi: 64, confidence: 0.9, amplitude: 0.1 },
    ], 1000)).toHaveLength(1);
  });

  it("reports stable pitch separately from accuracy", () => {
    expect(calculatePitchStability([{ timestamp: 1, cents: 15 }, { timestamp: 2, cents: 15 }, { timestamp: 3, cents: 16 }])).toBeGreaterThan(95);
    expect(calculatePitchStability([{ timestamp: 1, cents: -35 }, { timestamp: 2, cents: 35 }, { timestamp: 3, cents: -30 }, { timestamp: 4, cents: 30 }])).toBeLessThan(25);
    expect(calculatePitchStability([{ timestamp: 1, cents: -6 }, { timestamp: 2, cents: 6 }, { timestamp: 3, cents: -5 }, { timestamp: 4, cents: 5 }])).toBeGreaterThan(70);
  });

  it("excludes silent, uncertain, and invalid observations from stability", () => {
    expect(calculatePitchStability([
      { timestamp: 1, cents: 0, confidence: 0.2 },
      { timestamp: 2, cents: 0, amplitude: 0.001 },
      { timestamp: 3, cents: Number.NaN },
      { timestamp: 4, cents: 8 },
    ])).toBe(100);
  });

  it("calculates successful hold progress independently of elapsed phase time", () => {
    expect(getSuccessfulHoldProgress(0, 3000).percent).toBe(0);
    expect(getSuccessfulHoldProgress(1500, 3000).percent).toBe(50);
    expect(getSuccessfulHoldProgress(4000, 3000).percent).toBe(100);
  });

  it("identifies stale pitch and input states", () => {
    expect(isPitchStale(null, 1000)).toBe(true);
    expect(isPitchStale(100, 799)).toBe(false);
    expect(isPitchStale(100, 800)).toBe(true);
    expect(getPitchInputState(null)).toBe("No voice detected");
    expect(getPitchInputState({ timestamp: 0, frequency: 1, midiNumber: 0, noteName: "C", octave: 0, cents: 0, confidence: 0.9, amplitude: 0.001 })).toBe("Too quiet");
  });

  it("distinguishes sustained sound from a detected pitch", () => {
    const frame = { timestamp: 0, frequency: 440, midiNumber: 69, noteName: "A" as const, octave: 4, cents: 0, confidence: 0.9, amplitude: 0.1 };
    expect(getPracticeSignalState(true, null)).toEqual({ soundDetected: true, pitchDetected: false, label: "Sound detected · Pitch unavailable" });
    expect(getPracticeSignalState(false, null)).toEqual({ soundDetected: false, pitchDetected: false, label: "No voice detected" });
    expect(getPracticeSignalState(true, frame)).toEqual({ soundDetected: true, pitchDetected: true, label: "Pitch detected" });
  });
});
