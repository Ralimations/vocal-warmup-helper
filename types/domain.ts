export type NoteName = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";
export type ExerciseCategory = "preparation" | "warmup" | "pitch" | "scale" | "range" | "cooldown";
export type PracticeStatus = "idle" | "requesting" | "active" | "paused" | "complete" | "error";
export type MicrophoneStatus = "idle" | "requesting" | "active" | "denied" | "unavailable" | "error";

export interface PitchFrame { timestamp: number; frequency: number; midiNumber: number; noteName: NoteName; octave: number; cents: number; confidence: number; amplitude: number; }
export interface PitchDetectionResult { frequency: number; confidence: number; amplitude: number; }
export interface VocalRange { lowest: string; highest: string; semitones: number; octaves: number; }
export interface Exercise { id: string; name: string; slug: string; description: string; instructions: string; category: ExerciseCategory; difficulty: "gentle" | "steady" | "focused"; pattern: number[]; defaultTempo: number; defaultDuration: number; supportsPitchTracking: boolean; supportsTransposition: boolean; referenceToneEnabled: boolean; }
export interface RoutineExercise { exerciseId: string; order: number; duration: number; tempo: number; startNote: string; endNote: string; transpositionStep: number; referenceVolume: number; restAfter: number; }
export interface Routine { id: string; name: string; description: string; exerciseItems: RoutineExercise[]; estimatedDuration: number; createdAt: string; updatedAt: string; isBuiltIn: boolean; }
export interface PracticeSession { id: string; routineId: string; startedAt: string; completedAt?: string; durationSeconds: number; completedExercises: number; totalExercises: number; averagePitchAccuracy: number; averageCentsError: number; highestDetectedNote?: string; lowestDetectedNote?: string; highestConfirmedNote?: string; lowestConfirmedNote?: string; }
export interface SingerProfile { id: string; displayName: string; profileImage?: string; bio: string; voiceType: string; comfortableRange: VocalRange; confirmedRange: VocalRange; favoriteGenres: string[]; vocalHighlights: string[]; favoriteSongs: string[]; totalPracticeMinutes: number; currentStreak: number; sessionCount: number; }
export interface Song { id: string; title: string; artist: string; show?: string; originalKey: string; userKey: string; lowestNote: string; highestNote: string; status: "Want to Learn" | "Learning" | "Practicing" | "Performance Ready" | "Recorded" | "Archived"; notes: string; favorite: boolean; }
export interface Achievement { id: string; name: string; description: string; category: "practice" | "time" | "consistency" | "range" | "accuracy"; icon: string; rarity: "common" | "rare" | "special"; }
export interface AppSettings { id: string; referenceTuning: number; pitchTolerance: number; pitchSmoothing: number; guideVolume: number; metronomeVolume: number; reducedMotion: boolean; recordingEnabled: boolean; }
