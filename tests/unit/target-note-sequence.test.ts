import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { buildTargetNotes } from "@/features/practice/target-note-sequence";

describe("target note sequencing", () => {
  it("expands an interval pattern into timed notes", () => {
    const exercise = exercises.find((item) => item.id === "five-note-major")!;
    const item = { exerciseId: exercise.id, order: 0, duration: 1, tempo: 60, startNote: "C4", endNote: "G4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };
    const notes = buildTargetNotes(exercise, item);

    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ note: "C4", startMs: 0, endMs: 1000, cycleIndex: 0, patternIndex: 0 });
  });

  it("transposes each pattern cycle within the requested range", () => {
    const exercise = { ...exercises.find((item) => item.id === "humming")!, pattern: [0, 2] };
    const item = { exerciseId: exercise.id, order: 0, duration: 24, tempo: 60, startNote: "C4", endNote: "G4", transpositionStep: 2, referenceVolume: 0.5, restAfter: 0 };
    const notes = buildTargetNotes(exercise, item);

    expect(notes.map((note) => note.note)).toEqual(["C4", "D4", "D4", "E4", "E4", "F#4"]);
    expect(notes[0].frequency).toBeCloseTo(261.63, 1);
  });

  it("uses the configured reference tuning for target frequencies", () => {
    const exercise = { ...exercises.find((item) => item.id === "humming")!, pattern: [0] };
    const item = { exerciseId: exercise.id, order: 0, duration: 3, tempo: 60, startNote: "A4", endNote: "A4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 };

    expect(buildTargetNotes(exercise, item, 442)[0].frequency).toBeCloseTo(442, 3);
  });
});
