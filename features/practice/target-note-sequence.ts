import { midiToFrequency, midiToNote, noteToMidi } from "@/features/audio/note-converter";
import type { Exercise, RoutineExercise } from "@/types/domain";

export interface TargetNote {
  id: string;
  note: string;
  midi: number;
  frequency: number;
  prepareStartMs: number;
  referenceStartMs: number;
  singStartMs: number;
  singEndMs: number;
  evaluateStartMs: number;
  transitionStartMs: number;
  startMs: number;
  endMs: number;
  cycleIndex: number;
  patternIndex: number;
}

export const TARGET_NOTE_TIMING = {
  prepareMs: 650,
  referenceMs: 700,
  evaluateMs: 300,
  transitionMs: 350,
} as const;

export type TargetNotePhase = "prepare" | "reference" | "sing" | "evaluate" | "transition";

export function buildTargetNotes(exercise: Exercise, item: RoutineExercise, tuning = 440): TargetNote[] {
  if (!exercise.supportsPitchTracking || exercise.pattern.length === 0 || item.duration <= 0) return [];

  const startMidi = noteToMidi(item.startNote);
  const endMidi = noteToMidi(item.endNote);
  const direction = endMidi >= startMidi ? 1 : -1;
  const span = Math.max(...exercise.pattern) * direction;
  const beatMs = 60000 / Math.max(1, item.tempo || exercise.defaultTempo);
  const transitionMs = Math.max(TARGET_NOTE_TIMING.transitionMs, Math.min(500, Math.round(beatMs * 0.25)));
  const singDurationMs = Math.max(exercise.singDurationMs, Math.round(beatMs * 2));
  const noteDuration = TARGET_NOTE_TIMING.prepareMs + TARGET_NOTE_TIMING.referenceMs + singDurationMs + TARGET_NOTE_TIMING.evaluateMs + transitionMs;
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
      const startMs = elapsedMs + patternIndex * noteDuration;
      if (startMs >= item.duration * 1000) return;
      const midi = cycleStart + interval * direction;
      const note = midiToNote(midi);
      const prepareStartMs = startMs;
      const referenceStartMs = prepareStartMs + TARGET_NOTE_TIMING.prepareMs;
      const singStartMs = referenceStartMs + TARGET_NOTE_TIMING.referenceMs;
      const singEndMs = Math.min(item.duration * 1000, singStartMs + singDurationMs);
      const evaluateStartMs = singEndMs;
      const transitionStartMs = evaluateStartMs + TARGET_NOTE_TIMING.evaluateMs;
      notes.push({
        id: `${exercise.id}-${cycleIndex}-${patternIndex}`,
        note: `${note.noteName}${note.octave}`,
        midi,
        frequency: midiToFrequency(midi) * (tuning / 440),
        prepareStartMs,
        referenceStartMs,
        singStartMs,
        singEndMs,
        evaluateStartMs,
        transitionStartMs,
        startMs: prepareStartMs,
        endMs: Math.min(item.duration * 1000, singEndMs + TARGET_NOTE_TIMING.evaluateMs + transitionMs),
        cycleIndex,
        patternIndex,
      });
    });

    elapsedMs += noteDuration * exercise.pattern.length;
  }

  return notes;
}
