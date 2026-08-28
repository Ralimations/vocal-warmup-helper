import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { buildTargetNotes } from "@/features/practice/target-note-sequence";

describe("target note sequencing", () => {
  it("expands an interval pattern into timed notes", () => {
    const exercise = exercises.find((item) => item.id === "five-note-major")!;
    const item = { exerciseId: exercise.id, order: 0, duration: 1, tempo: 60, startNote: "C4", endNote: "G4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };
    const countInFreeExercise = { ...exercise, countInBeats: 0 };
    const notes = buildTargetNotes(countInFreeExercise, item);

    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ note: "C4", startMs: 0, endMs: 1000, cycleIndex: 0, patternIndex: 0 });
  });

  it("transposes each pattern cycle within the requested range", () => {
    const exercise = { ...exercises.find((item) => item.id === "five-note-major")!, pattern: [0, 2] };
    const item = { exerciseId: exercise.id, order: 0, duration: 30, tempo: 60, startNote: "C4", endNote: "G4", transpositionStep: 2, referenceVolume: 0.5, restAfter: 0 };
    const notes = buildTargetNotes(exercise, item);

    expect(notes.map((note) => note.note)).toEqual(["C4", "D4", "D4", "E4", "E4", "F#4"]);
    expect(notes[0].frequency).toBeCloseTo(261.63, 1);
  });

  it("adds a two-beat count-in, one-beat notes, and rest before the next phrase", () => {
    const exercise = exercises.find((item) => item.id === "five-note-major")!;
    const item = { exerciseId: exercise.id, order: 0, duration: 9, tempo: 100, startNote: "C4", endNote: "G4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };
    const notes = buildTargetNotes(exercise, item);

    expect(notes.slice(0, 9).map((note) => note.startMs)).toEqual([1200, 1800, 2400, 3000, 3600, 4200, 4800, 5400, 6000]);
    expect(notes[9].startMs).toBe(7200);
    expect(notes[0].pitchEvaluationStartMs).toBe(1320);
    expect(notes[0].pitchEvaluationEndMs).toBe(1680);
  });

  it("uses the configured reference tuning for target frequencies", () => {
    const exercise = { ...exercises.find((item) => item.id === "humming")!, completionMode: "pitch-hold" as const, pattern: [0] };
    const item = { exerciseId: exercise.id, order: 0, duration: 3, tempo: 60, startNote: "A4", endNote: "A4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };

    expect(buildTargetNotes(exercise, item, 442)[0].frequency).toBeCloseTo(442, 3);
  });

  it("uses the exercise sing duration while preserving tempo timing", () => {
    const exercise = { ...exercises.find((item) => item.id === "humming")!, completionMode: "pitch-hold" as const, pattern: [0], singDurationMs: 1500 };
    const item = { exerciseId: exercise.id, order: 0, duration: 6, tempo: 60, startNote: "C4", endNote: "C4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };
    const note = buildTargetNotes(exercise, item)[0];

    expect(note.singEndMs - note.singStartMs).toBe(1500);
  });

  it("keeps faster scale timing BPM-aware without shortening its configured window", () => {
    const exercise = { ...exercises.find((item) => item.id === "five-note-major")!, pattern: [0], singDurationMs: 1200 };
    const item = { exerciseId: exercise.id, order: 0, duration: 5, tempo: 240, startNote: "C4", endNote: "C4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };
    const note = buildTargetNotes(exercise, item)[0];

    expect(note.singEndMs - note.singStartMs).toBe(250);
  });
});
