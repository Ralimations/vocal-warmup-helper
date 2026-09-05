import { describe, expect, it } from "vitest";
import { getFallingNotePosition, getPianoRollRange } from "@/components/practice/falling-note-guide";
import type { TargetNote } from "@/features/practice/target-note-sequence";

function target(midi: number, singStartMs = 1000, singEndMs = 1500): TargetNote {
  return { id: `note-${midi}`, note: "C4", midi, frequency: 261.63, prepareStartMs: 0, referenceStartMs: 300, singStartMs, singEndMs, evaluateStartMs: singStartMs, transitionStartMs: singEndMs, pitchEvaluationStartMs: singStartMs, pitchEvaluationEndMs: singEndMs, startMs: 0, endMs: singEndMs + 300, cycleIndex: 0, patternIndex: 0 };
}

describe("falling note guide layout", () => {
  it("keeps at least one octave visible and expands to include targets", () => {
    expect(getPianoRollRange([target(60)])).toEqual({ minMidi: 54, maxMidi: 66 });
    expect(getPianoRollRange([target(60), target(72)])).toEqual({ minMidi: 58, maxMidi: 74 });
  });

  it("moves a note down to the strike line as its sing time approaches", () => {
    const note = target(60);
    const early = getFallingNotePosition(note, 0);
    const atStart = getFallingNotePosition(note, 1000);
    expect(early.y).toBeLessThan(atStart.y);
    expect(atStart.y + atStart.height).toBeCloseTo(190);
  });
});
