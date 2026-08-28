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
  pitchEvaluationStartMs: number;
  pitchEvaluationEndMs: number;
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
export const DEFAULT_PITCH_HOLD_DURATION_MS = 1500;

export type TargetNotePhase = "prepare" | "reference" | "sing" | "evaluate" | "transition";

export function buildTargetNotes(exercise: Exercise, item: RoutineExercise, tuning = 440): TargetNote[] {
  if (!exercise.supportsPitchTracking || !["pitch-hold", "pitch-sequence"].includes(exercise.completionMode) || exercise.pattern.length === 0 || item.duration <= 0) return [];

  const startMidi = noteToMidi(item.startNote);
  const endMidi = noteToMidi(item.endNote);
  const direction = endMidi >= startMidi ? 1 : -1;
  const pattern = exercise.completionMode === "pitch-hold" ? exercise.pattern.slice(0, 1) : exercise.pattern;
  const span = Math.max(...pattern) * direction;
  const beatMs = 60000 / Math.max(1, item.tempo || exercise.defaultTempo);
  const isSequence = exercise.completionMode === "pitch-sequence";
  const beatsPerNote = Math.max(1, exercise.beatsPerNote ?? 1);
  const noteDuration = isSequence ? beatMs * beatsPerNote : 0;
  const countInMs = isSequence ? Math.max(0, exercise.countInBeats ?? 0) * beatMs : 0;
  const restBetweenSequencesMs = isSequence ? Math.max(0, exercise.restBetweenSequencesMs ?? 0) : 0;
  const singDurationMs = exercise.singDurationMs > 0 ? exercise.singDurationMs : DEFAULT_PITCH_HOLD_DURATION_MS;
  const holdNoteDuration = TARGET_NOTE_TIMING.prepareMs + TARGET_NOTE_TIMING.referenceMs + singDurationMs + TARGET_NOTE_TIMING.evaluateMs + TARGET_NOTE_TIMING.transitionMs;
  const notes: TargetNote[] = [];

  for (let cycleIndex = 0, elapsedMs = countInMs; elapsedMs < item.duration * 1000; cycleIndex += 1) {
    const cycleOffset = cycleIndex * item.transpositionStep * direction;
    const cycleStart = startMidi + cycleOffset;
    const cycleEnd = cycleStart + span;
    const inRange = direction > 0
      ? cycleStart >= startMidi && cycleEnd <= endMidi
      : cycleStart <= startMidi && cycleEnd >= endMidi;
    if (!inRange) break;

    pattern.forEach((interval, patternIndex) => {
      const startMs = elapsedMs + patternIndex * (isSequence ? noteDuration : holdNoteDuration);
      if (startMs >= item.duration * 1000) return;
      const midi = cycleStart + interval * direction;
      const note = midiToNote(midi);
      const prepareStartMs = startMs;
      const referenceStartMs = isSequence ? Math.max(0, startMs - beatMs) : prepareStartMs + TARGET_NOTE_TIMING.prepareMs;
      const singStartMs = isSequence ? startMs : referenceStartMs + TARGET_NOTE_TIMING.referenceMs;
      const singEndMs = isSequence ? Math.min(item.duration * 1000, startMs + noteDuration) : Math.min(item.duration * 1000, singStartMs + singDurationMs);
      const evaluateStartMs = isSequence ? startMs + noteDuration * Math.min(0.7, Math.max(0.2, exercise.pitchEvaluationStartRatio ?? 0.2)) : singStartMs;
      const pitchEvaluationEndMs = isSequence ? startMs + noteDuration * Math.min(0.9, Math.max(0.5, exercise.pitchEvaluationEndRatio ?? 0.8)) : singEndMs;
      const transitionStartMs = isSequence ? pitchEvaluationEndMs : evaluateStartMs + TARGET_NOTE_TIMING.evaluateMs;
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
        pitchEvaluationStartMs: evaluateStartMs,
        pitchEvaluationEndMs,
        startMs: prepareStartMs,
        endMs: isSequence ? singEndMs : Math.min(item.duration * 1000, singEndMs + TARGET_NOTE_TIMING.evaluateMs + TARGET_NOTE_TIMING.transitionMs),
        cycleIndex,
        patternIndex,
      });
    });

    if (exercise.completionMode === "pitch-hold") break;
    elapsedMs += noteDuration * pattern.length + restBetweenSequencesMs;
  }

  return notes;
}
