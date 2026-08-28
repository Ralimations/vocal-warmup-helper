import { buildTargetNotes, type TargetNote, type TargetNotePhase } from "@/features/practice/target-note-sequence";
import { scorePitchFrames, type PitchScore, type TimedPitchFrame } from "@/features/practice/pitch-scoring";
import { midiToNote } from "@/features/audio/note-converter";
import type { Exercise, PitchFrame, PracticeStatus, Routine, RoutineExercise } from "@/types/domain";

export interface ExercisePracticeState {
  exerciseId: string;
  exerciseElapsedMs: number;
  targetNotes: TargetNote[];
  score: PitchScore;
}

export interface PracticeSessionSummary {
  routineId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  completedExercises: number;
  totalExercises: number;
  averagePitchAccuracy: number;
  averageCentsError: number;
  highestDetectedNote?: string;
  lowestDetectedNote?: string;
  validFrameCount: number;
}

export interface ActivePracticeSession {
  status: PracticeStatus;
  routineId: string;
  startedAt?: string;
  currentExerciseIndex: number;
  elapsedMs: number;
  exerciseElapsedMs: number;
  currentExercise: Exercise;
  currentRoutineExercise: RoutineExercise;
  targetNotes: TargetNote[];
  currentTargetNote?: TargetNote;
  currentTargetIndex: number;
  phase: TargetNotePhase | "idle";
  exercises: ExercisePracticeState[];
  summary?: PracticeSessionSummary;
  error?: string;
}

interface PracticeEngineOptions {
  routine: Routine;
  exercises: Exercise[];
  tuning?: number;
  pitchTolerance?: number;
  tickMs?: number;
  onChange?: (session: ActivePracticeSession) => void;
}

export class PracticeEngine {
  private readonly routine: Routine;
  private readonly exerciseMap: Map<string, Exercise>;
  private readonly tuning: number;
  private readonly pitchTolerance: number;
  private readonly tickMs: number;
  private readonly onChange?: (session: ActivePracticeSession) => void;
  private timer: ReturnType<typeof setInterval> | null = null;
  private session: ActivePracticeSession;
  private samplesByExercise: TimedPitchFrame[][];
  private lastTickAt = 0;

  constructor(options: PracticeEngineOptions) {
    this.routine = options.routine;
    this.exerciseMap = new Map(options.exercises.map((exercise) => [exercise.id, exercise]));
    this.tuning = options.tuning ?? 440;
    this.pitchTolerance = options.pitchTolerance ?? 50;
    this.tickMs = options.tickMs ?? 50;
    this.onChange = options.onChange;
    this.samplesByExercise = this.routine.exerciseItems.map(() => []);
    this.session = this.makeSession("idle", 0);
  }

  get snapshot(): ActivePracticeSession { return this.session; }

  start(): ActivePracticeSession {
    if (this.session.status === "active") return this.session;
    if (this.session.status === "complete" || this.session.summary) this.reset();
    this.session = { ...this.session, status: "active", startedAt: this.session.startedAt ?? new Date().toISOString(), error: undefined };
    this.lastTickAt = Date.now();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return this.emit();
  }

  pause(): ActivePracticeSession {
    if (this.session.status !== "active") return this.session;
    this.clearTimer();
    this.session = { ...this.session, status: "paused" };
    return this.emit();
  }

  resume(): ActivePracticeSession {
    if (this.session.status !== "paused") return this.session;
    this.session = { ...this.session, status: "active" };
    this.lastTickAt = Date.now();
    this.timer = setInterval(() => this.tick(), this.tickMs);
    return this.emit();
  }

  previous(): ActivePracticeSession {
    if (this.session.currentExerciseIndex === 0) return this.session;
    this.session = this.selectExercise(this.session.currentExerciseIndex - 1);
    return this.emit();
  }

  next(): ActivePracticeSession {
    if (this.session.currentExerciseIndex >= this.routine.exerciseItems.length - 1) return this.complete();
    this.session = this.selectExercise(this.session.currentExerciseIndex + 1);
    return this.emit();
  }

  previousNote(): ActivePracticeSession {
    const index = this.targetIndex();
    if (index <= 0) return this.session;
    this.session = { ...this.session, exerciseElapsedMs: this.session.targetNotes[index - 1].prepareStartMs };
    return this.emit();
  }

  nextNote(): ActivePracticeSession {
    const index = this.targetIndex();
    if (index < 0 || index >= this.session.targetNotes.length - 1) return this.next();
    this.session = { ...this.session, exerciseElapsedMs: this.session.targetNotes[index + 1].prepareStartMs };
    return this.emit();
  }

  stop(): PracticeSessionSummary | undefined {
    this.clearTimer();
    const summary = this.makeSummary();
    this.session = { ...this.session, status: "idle", summary };
    this.emit();
    return summary;
  }

  dispose(): void { this.clearTimer(); }

  complete(): ActivePracticeSession {
    this.clearTimer();
    this.session = { ...this.session, status: "complete", currentExerciseIndex: this.routine.exerciseItems.length - 1 };
    const summary = this.makeSummary();
    this.session = { ...this.session, summary };
    return this.emit();
  }

  addPitchFrame(frame: PitchFrame): void {
    if (this.session.status !== "active") return;
    if (frame.confidence < 0.35 || frame.amplitude < 0.005) return;
    const currentSamples = this.samplesByExercise[this.session.currentExerciseIndex];
    const target = this.session.targetNotes.find((candidate) => this.session.exerciseElapsedMs >= candidate.singStartMs && this.session.exerciseElapsedMs < candidate.singEndMs);
    if (!target) return;
    currentSamples.push({ frame, elapsedMs: this.session.exerciseElapsedMs });
    this.session = { ...this.session, exercises: this.session.exercises.map((exercise, index) => index === this.session.currentExerciseIndex ? { ...exercise, score: scorePitchFrames(currentSamples, exercise.targetNotes, this.pitchTolerance) } : exercise) };
  }

  reset(): ActivePracticeSession {
    this.clearTimer();
    this.samplesByExercise = this.routine.exerciseItems.map(() => []);
    this.session = this.makeSession("idle", 0);
    return this.emit();
  }

  private tick(): void {
    const now = Date.now();
    const delta = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;
    const nextExerciseElapsedMs = this.session.exerciseElapsedMs + delta;
    const nextElapsedMs = this.session.elapsedMs + delta;
    const durationMs = this.session.currentRoutineExercise.duration * 1000;
    this.session = { ...this.session, exerciseElapsedMs: nextExerciseElapsedMs, elapsedMs: nextElapsedMs };
    if (nextExerciseElapsedMs >= durationMs) this.next();
    else this.emit();
  }

  private selectExercise(index: number): ActivePracticeSession {
    const item = this.routine.exerciseItems[index];
    const exercise = this.exerciseMap.get(item.exerciseId);
    if (!exercise) return { ...this.session, status: "error", error: `Exercise ${item.exerciseId} was not found.` };
    return { ...this.session, currentExerciseIndex: index, exerciseElapsedMs: 0, currentExercise: exercise, currentRoutineExercise: item, targetNotes: buildTargetNotes(exercise, item, this.tuning), currentTargetNote: undefined };
  }

  private makeSession(status: PracticeStatus, index: number): ActivePracticeSession {
    const item = this.routine.exerciseItems[index];
    const exercise = this.exerciseMap.get(item?.exerciseId);
    if (!item || !exercise) throw new Error("Routine contains an unknown exercise.");
    const targetNotes = buildTargetNotes(exercise, item, this.tuning);
    return { status, routineId: this.routine.id, currentExerciseIndex: index, elapsedMs: 0, exerciseElapsedMs: 0, currentExercise: exercise, currentRoutineExercise: item, targetNotes, currentTargetNote: targetNotes[0], currentTargetIndex: targetNotes.length ? 0 : -1, phase: "idle", exercises: this.routine.exerciseItems.map((routineItem) => ({ exerciseId: routineItem.exerciseId, exerciseElapsedMs: 0, targetNotes: buildTargetNotes(this.exerciseMap.get(routineItem.exerciseId)!, routineItem, this.tuning), score: { accuracy: 0, averageCentsError: 0, validFrameCount: 0 } })) };
  }

  private makeSummary(): PracticeSessionSummary {
    const scores = this.session.exercises.map((exercise, index) => scorePitchFrames(this.samplesByExercise[index], exercise.targetNotes, this.pitchTolerance));
    const scored = scores.filter((score) => score.validFrameCount > 0);
    const averagePitchAccuracy = scored.length ? Math.round(scored.reduce((total, score) => total + score.accuracy, 0) / scored.length) : 0;
    const averageCentsError = scored.length ? Math.round(scored.reduce((total, score) => total + score.averageCentsError, 0) / scored.length * 10) / 10 : 0;
    const allMidis = scored.flatMap((score) => [score.highestMidi, score.lowestMidi]).filter((midi): midi is number => midi !== undefined);
    const highest = allMidis.length ? midiToNote(Math.max(...allMidis)) : undefined;
    const lowest = allMidis.length ? midiToNote(Math.min(...allMidis)) : undefined;
    return { routineId: this.routine.id, startedAt: this.session.startedAt ?? new Date().toISOString(), completedAt: new Date().toISOString(), durationSeconds: Math.round(this.session.elapsedMs / 1000), completedExercises: this.session.status === "complete" ? this.routine.exerciseItems.length : this.session.currentExerciseIndex, totalExercises: this.routine.exerciseItems.length, averagePitchAccuracy, averageCentsError, highestDetectedNote: highest ? `${highest.noteName}${highest.octave}` : undefined, lowestDetectedNote: lowest ? `${lowest.noteName}${lowest.octave}` : undefined, validFrameCount: scored.reduce((total, score) => total + score.validFrameCount, 0) };
  }

  private clearTimer(): void { if (this.timer !== null) clearInterval(this.timer); this.timer = null; }
  private emit(): ActivePracticeSession { const currentTargetIndex = this.targetIndex(); const currentTargetNote = currentTargetIndex >= 0 ? this.session.targetNotes[currentTargetIndex] : undefined; const phase: TargetNotePhase | "idle" = !currentTargetNote || this.session.status === "idle" || this.session.status === "complete" ? "idle" : this.session.exerciseElapsedMs < currentTargetNote.referenceStartMs ? "prepare" : this.session.exerciseElapsedMs < currentTargetNote.singStartMs ? "reference" : this.session.exerciseElapsedMs < currentTargetNote.singEndMs ? "sing" : this.session.exerciseElapsedMs < currentTargetNote.transitionStartMs ? "evaluate" : "transition"; this.session = { ...this.session, currentTargetIndex, currentTargetNote, phase }; this.onChange?.(this.session); return this.session; }
  private targetIndex(): number { return this.session.targetNotes.findIndex((target) => this.session.exerciseElapsedMs >= target.prepareStartMs && this.session.exerciseElapsedMs < target.endMs); }
}
