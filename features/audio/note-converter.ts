import type { NoteName, PitchFrame } from "@/types/domain";

export const NOTE_NAMES: NoteName[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function frequencyToMidi(frequency: number): number { return 69 + 12 * Math.log2(frequency / 440); }
export function midiToFrequency(midi: number): number { return 440 * Math.pow(2, (midi - 69) / 12); }
export function midiToNote(midi: number): { noteName: NoteName; octave: number; cents: number } { const nearest = Math.round(midi); return { noteName: NOTE_NAMES[((nearest % 12) + 12) % 12], octave: Math.floor(nearest / 12) - 1, cents: Math.round((midi - nearest) * 100) }; }
export function frequencyToPitchFrame(frequency: number, confidence: number, amplitude: number, timestamp = performance.now()): PitchFrame { const midi = frequencyToMidi(frequency); const note = midiToNote(midi); return { timestamp, frequency, midiNumber: midi, noteName: note.noteName, octave: note.octave, cents: note.cents, confidence, amplitude }; }
export function noteToMidi(note: string): number { const match = note.match(/^([A-G](?:#|b)?)(-?\d+)$/); if (!match) throw new Error(`Invalid note: ${note}`); const normalized = match[1].replace("b", "#"); const index = NOTE_NAMES.indexOf(normalized as NoteName); if (index < 0) throw new Error(`Invalid note: ${note}`); return (Number(match[2]) + 1) * 12 + index; }
