import { midiToFrequency, midiToNote, noteToMidi } from "@/features/audio/note-converter";
import type { Exercise, RoutineExercise } from "@/types/domain";

export interface TargetNote {
  note: string;
  midi: number;
  frequency: number;
  startMs: number;
  endMs: number;
  cycleIndex: number;
  patternIndex: number;
}

export function buildTargetNotes(exercise: Exercise, item: RoutineExercise, tuning = 440): TargetNote[] {
  if (!exercise.supportsPitchTracking || exercise.pattern.length === 0 || item.duration <= 0) return [];

  const startMidi = noteToMidi(item.startNote);
  const endMidi = noteToMidi(item.endNote);
  const direction = endMidi >= startMidi ? 1 : -1;
  const span = Math.max(...exercise.pattern) * direction;
  const beatMs = 60000 / Math.max(1, item.tempo || exercise.defaultTempo);
  const patternDuration = beatMs * exercise.pattern.length;
  const notes: TargetNote[] = [];

  for (let cycleIndex = 0, elapsedMs = 0; elapsedMs < item.duration * 1000; cycleIndex += 1) {
    const cycleOffset = cycleIndex * item.transpositionStep * direction;
    const cycleStart = startMidi + cycleOffset;
    const cycleEnd = cycleStart + span;
    const inRange = direction > 0
      ? cycleStart >= startMidi && cycleEnd <= endMidi
      : cycleStart <= startMidi && cycleEnd >= endMidi;
    if (!inRange) break;

    exercise.pattern.forEach((interval, patternIndex) => {
      const startMs = elapsedMs + patternIndex * beatMs;
      if (startMs >= item.duration * 1000) return;
      const midi = cycleStart + interval * direction;
      const note = midiToNote(midi);
      notes.push({
        note: `${note.noteName}${note.octave}`,
        midi,
        frequency: midiToFrequency(midi) * (tuning / 440),
        startMs,
        endMs: Math.min(item.duration * 1000, startMs + beatMs),
        cycleIndex,
        patternIndex,
      });
    });

    elapsedMs += patternDuration;
  }

  return notes;
}
