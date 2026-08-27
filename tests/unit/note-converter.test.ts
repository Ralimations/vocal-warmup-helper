import { describe, expect, it } from "vitest";
import {
  frequencyToMidi,
  frequencyToPitchFrame,
  midiToNote,
  noteToMidi,
} from "@/features/audio/note-converter";

describe("note conversion", () => {
  it("maps concert A4 to MIDI 69 and back", () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 5);
    expect(midiToNote(69)).toEqual({ noteName: "A", octave: 4, cents: 0 });
  });

  it("maps named notes to MIDI values", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("F#3")).toBe(54);
  });

  it("builds a pitch frame with cents offset", () => {
    const frame = frequencyToPitchFrame(440 * 2 ** (8 / 1200), 0.95, 0.2, 0);

    expect(`${frame.noteName}${frame.octave}`).toBe("A4");
    expect(frame.cents).toBeCloseTo(8, 0);
    expect(frame.frequency).toBeGreaterThan(440);
  });
});
