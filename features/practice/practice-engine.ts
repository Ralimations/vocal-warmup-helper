import { midiToNote } from "@/features/audio/note-converter";
import { centsFromTarget, isUsablePitchFrame, MAX_STABLE_FREQUENCY_DELTA_CENTS, STALE_PITCH_TIMEOUT_MS, SUCCESS_THRESHOLD_CENTS } from "@/features/practice/pitch-feedback";
import { buildTargetNotes, type TargetNote, type TargetNotePhase } from "@/features/practice/target-note-sequence";
import { scorePitchFrames, type PitchScore, type TimedPitchFrame } from "@/features/practice/pitch-scoring";
import type { Exercise, PitchFrame, PracticeStatus, Routine, RoutineExercise } from "@/types/domain";

export const SUSTAIN_GRACE_MS = 250;
export const SUSTAIN_RESET_MS = 1200;
export const MIN_STABLE_TARGET_FRAMES = 2;

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
  completedTargetCount: number;
  skippedTargetCount: number;
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
  currentTargetElapsedMs: number;
  successfulHoldMs: number;
  requiredHoldMs: number;
  progress: number;
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

type PitchState = "successful" | "warming-up" | "out-of-tune" | "silent";

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
  private lastPitchAtMs: number | null = null;
  private outOfTuneSinceMs: number | null = null;
  private pitchState: PitchState = "silent";
  private stableTargetFrames = 0;
  private lastVoicedFrequency: number | null = null;
  private targetCompleted = false;
  private completedTargetCount = 0;
  private skippedTargetCount = 0;

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
    this.selectExercise(this.session.currentExerciseIndex - 1);
    return this.emit();
  }

  next(): ActivePracticeSession {
    if (this.session.currentTargetIndex >= 0 && this.session.currentTargetIndex < this.session.targetNotes.length - 1) return this.advanceTarget(false);
    return this.advanceExercise(false);
  }

  previousNote(): ActivePracticeSession {
    if (this.session.currentTargetIndex <= 0) return this.session;
    this.selectTarget(this.session.currentTargetIndex - 1);
    return this.emit();
  }

  nextNote(): ActivePracticeSession { return this.next(); }

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

  addPitchFrame(frame: PitchFrame | null): void {
    if (this.session.status !== "active") return;
    const now = Date.now();
    this.lastPitchAtMs = now;
    const target = this.session.currentTargetNote;
    const phase = this.phaseForCurrentTarget();
    if (!frame || !isUsablePitchFrame(frame) || !target) {
      this.resetVoicedCandidate();
      this.setPitchState("silent", now);
      return;
    }

    const deviation = centsFromTarget(frame.frequency, target.frequency);
    const holdTolerance = this.session.currentExercise.pitchHoldToleranceCents ?? SUCCESS_THRESHOLD_CENTS;
    const withinSuccessZone = Math.abs(deviation) <= holdTolerance;
    if (withinSuccessZone) {
      if (this.lastVoicedFrequency !== null && Math.abs(centsFromTarget(frame.frequency, this.lastVoicedFrequency)) > MAX_STABLE_FREQUENCY_DELTA_CENTS) this.stableTargetFrames = 0;
      this.stableTargetFrames += 1;
      this.lastVoicedFrequency = frame.frequency;
      this.setPitchState(this.stableTargetFrames >= MIN_STABLE_TARGET_FRAMES ? "successful" : "warming-up", now);
    } else {
      this.resetVoicedCandidate();
      this.setPitchState("out-of-tune", now);
    }
    if (phase !== "sing" || this.targetCompleted) return;

    const currentSamples = this.samplesByExercise[this.session.currentExerciseIndex];
    const singStartOffset = target.singStartMs - target.startMs;
    const singDuration = Math.max(1, target.singEndMs - target.singStartMs);
    const scoreElapsedMs = this.session.currentExercise.completionMode === "pitch-sequence"
      ? this.session.exerciseElapsedMs
      : target.singStartMs + Math.min(singDuration - 1, Math.max(0, this.session.currentTargetElapsedMs - singStartOffset));
    currentSamples.push({ frame, elapsedMs: scoreElapsedMs });
    this.session = { ...this.session, exercises: this.session.exercises.map((exercise, index) => index === this.session.currentExerciseIndex ? { ...exercise, score: scorePitchFrames(currentSamples, exercise.targetNotes, this.pitchTolerance) } : exercise) };
  }

  reset(): ActivePracticeSession {
    this.clearTimer();
    this.samplesByExercise = this.routine.exerciseItems.map(() => []);
    this.targetCompleted = false;
    this.completedTargetCount = 0;
    this.skippedTargetCount = 0;
    this.resetPitchTracking();
    this.session = this.makeSession("idle", 0);
    return this.emit();
  }

  private tick(): void {
    const now = Date.now();
    const delta = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;
    const phaseBefore = this.phaseForCurrentTarget();
    this.session = { ...this.session, exerciseElapsedMs: this.session.exerciseElapsedMs + delta, elapsedMs: this.session.elapsedMs + delta, currentTargetElapsedMs: this.session.currentTargetElapsedMs + delta };
    const exercise = this.session.currentExercise;

    if (exercise.completionMode === "timed" || exercise.completionMode === "continuous") {
      if (this.session.exerciseElapsedMs >= this.session.currentRoutineExercise.duration * 1000) this.advanceExercise(false);
      else this.emit();
      return;
    }

    if (exercise.completionMode === "pitch-sequence") {
      this.updateClockDrivenTarget();
      if (this.session.exerciseElapsedMs >= this.session.currentRoutineExercise.duration * 1000) this.advanceExercise(false);
      else this.emit();
      return;
    }

    if (exercise.completionMode === "pitch-hold" && this.session.currentTargetNote && phaseBefore === "sing" && !this.targetCompleted) {
      this.advanceSuccessfulHold(delta, now);
    }

    const target = this.session.currentTargetNote;
    const targetEndMs = target ? target.endMs - target.startMs : 0;
    if (target && exercise.completionMode === "pitch-hold") {
      if (this.targetCompleted && this.session.currentTargetElapsedMs >= targetEndMs) this.advanceTarget(true);
      else this.emit();
      return;
    }
    this.emit();
  }

  private advanceSuccessfulHold(delta: number, now: number): void {
    const required = this.session.requiredHoldMs;
    const fresh = this.lastPitchAtMs !== null && now - this.lastPitchAtMs <= STALE_PITCH_TIMEOUT_MS;
    if (this.pitchState === "successful" && fresh) {
      if (this.outOfTuneSinceMs !== null) {
        const invalidDuration = now - this.outOfTuneSinceMs;
        if (invalidDuration >= SUSTAIN_RESET_MS) this.session = { ...this.session, successfulHoldMs: 0 };
        else if (invalidDuration <= SUSTAIN_GRACE_MS) { /* Preserve the hold through a brief natural wobble. */ }
      }
      this.outOfTuneSinceMs = null;
      const successfulHoldMs = Math.min(required, this.session.successfulHoldMs + delta);
      this.session = { ...this.session, successfulHoldMs };
      if (successfulHoldMs >= required) this.targetCompleted = true;
      return;
    }
    if (this.outOfTuneSinceMs === null) this.outOfTuneSinceMs = now;
    else if (now - this.outOfTuneSinceMs >= SUSTAIN_RESET_MS) this.session = { ...this.session, successfulHoldMs: 0 };
  }

  private advanceTarget(_successful: boolean): ActivePracticeSession {
    if (_successful) this.completedTargetCount += 1;
    else this.skippedTargetCount += 1;
    const nextIndex = this.session.currentTargetIndex + 1;
    if (nextIndex >= this.session.targetNotes.length) return this.advanceExercise(_successful);
    this.selectTarget(nextIndex);
    return this.emit();
  }

  private advanceExercise(_successful: boolean): ActivePracticeSession {
    if (this.session.currentExerciseIndex >= this.routine.exerciseItems.length - 1) return this.complete();
    this.selectExercise(this.session.currentExerciseIndex + 1);
    return this.emit();
  }

  private selectExercise(index: number): void {
    const item = this.routine.exerciseItems[index];
    const exercise = this.exerciseMap.get(item.exerciseId);
    if (!exercise) {
      this.session = { ...this.session, status: "error", error: `Exercise ${item.exerciseId} was not found.` };
      return;
    }
    const targetNotes = buildTargetNotes(exercise, item, this.tuning);
    this.session = { ...this.session, currentExerciseIndex: index, exerciseElapsedMs: 0, currentTargetElapsedMs: 0, successfulHoldMs: 0, requiredHoldMs: targetNotes[0] ? targetNotes[0].singEndMs - targetNotes[0].singStartMs : 0, currentExercise: exercise, currentRoutineExercise: item, targetNotes, currentTargetNote: targetNotes[0], currentTargetIndex: targetNotes.length ? 0 : -1 };
    this.targetCompleted = false;
    this.resetPitchTracking();
  }

  private selectTarget(index: number): void {
    const target = this.session.targetNotes[index];
    this.session = { ...this.session, currentTargetIndex: target ? index : -1, currentTargetNote: target, currentTargetElapsedMs: 0, successfulHoldMs: 0, requiredHoldMs: target ? Math.max(0, target.singEndMs - target.singStartMs) : 0 };
    this.targetCompleted = false;
    this.resetPitchTracking();
  }

  private updateClockDrivenTarget(): void {
    if (!this.session.targetNotes.length) return;
    const elapsed = this.session.exerciseElapsedMs;
    let index = this.session.targetNotes.findIndex((target) => elapsed >= target.startMs && elapsed < target.endMs);
    if (index < 0) {
      index = elapsed < this.session.targetNotes[0].startMs
        ? 0
        : this.session.targetNotes.findIndex((target) => target.startMs > elapsed);
      if (index < 0) index = this.session.targetNotes.length - 1;
    }
    const target = this.session.targetNotes[index];
    if (index !== this.session.currentTargetIndex) {
      this.session = { ...this.session, currentTargetIndex: index, currentTargetNote: target, currentTargetElapsedMs: Math.max(0, elapsed - target.startMs), successfulHoldMs: 0, requiredHoldMs: 0 };
      this.resetPitchTracking();
    } else {
      this.session = { ...this.session, currentTargetElapsedMs: Math.max(0, elapsed - target.startMs) };
    }
  }

  private makeSession(status: PracticeStatus, index: number): ActivePracticeSession {
    const item = this.routine.exerciseItems[index];
    const exercise = this.exerciseMap.get(item?.exerciseId);
    if (!item || !exercise) throw new Error("Routine contains an unknown exercise.");
    const targetNotes = buildTargetNotes(exercise, item, this.tuning);
    return { status, routineId: this.routine.id, currentExerciseIndex: index, elapsedMs: 0, exerciseElapsedMs: 0, currentTargetElapsedMs: 0, successfulHoldMs: 0, requiredHoldMs: targetNotes[0] ? targetNotes[0].singEndMs - targetNotes[0].singStartMs : 0, progress: 0, currentExercise: exercise, currentRoutineExercise: item, targetNotes, currentTargetNote: targetNotes[0], currentTargetIndex: targetNotes.length ? 0 : -1, phase: "idle", exercises: this.routine.exerciseItems.map((routineItem) => ({ exerciseId: routineItem.exerciseId, exerciseElapsedMs: 0, targetNotes: buildTargetNotes(this.exerciseMap.get(routineItem.exerciseId)!, routineItem, this.tuning), score: { accuracy: 0, averageCentsError: 0, validFrameCount: 0 } })) };
  }

  private makeSummary(): PracticeSessionSummary {
    const scores = this.session.exercises.map((exercise, index) => scorePitchFrames(this.samplesByExercise[index], exercise.targetNotes, this.pitchTolerance));
    const scored = scores.filter((score) => score.validFrameCount > 0);
    const averagePitchAccuracy = scored.length ? Math.round(scored.reduce((total, score) => total + score.accuracy, 0) / scored.length) : 0;
    const averageCentsError = scored.length ? Math.round(scored.reduce((total, score) => total + score.averageCentsError, 0) / scored.length * 10) / 10 : 0;
    const allMidis = scored.flatMap((score) => [score.highestMidi, score.lowestMidi]).filter((midi): midi is number => midi !== undefined);
    const highest = allMidis.length ? midiToNote(Math.max(...allMidis)) : undefined;
    const lowest = allMidis.length ? midiToNote(Math.min(...allMidis)) : undefined;
    return { routineId: this.routine.id, startedAt: this.session.startedAt ?? new Date().toISOString(), completedAt: new Date().toISOString(), durationSeconds: Math.round(this.session.elapsedMs / 1000), completedExercises: this.session.status === "complete" ? this.routine.exerciseItems.length : this.session.currentExerciseIndex, totalExercises: this.routine.exerciseItems.length, averagePitchAccuracy, averageCentsError, completedTargetCount: this.completedTargetCount, skippedTargetCount: this.skippedTargetCount, highestDetectedNote: highest ? `${highest.noteName}${highest.octave}` : undefined, lowestDetectedNote: lowest ? `${lowest.noteName}${lowest.octave}` : undefined, validFrameCount: scored.reduce((total, score) => total + score.validFrameCount, 0) };
  }

  private setPitchState(state: PitchState, now: number): void {
    this.pitchState = state;
    if (state !== "successful" && this.outOfTuneSinceMs === null) this.outOfTuneSinceMs = now;
  }

  private resetPitchTracking(): void {
    this.lastPitchAtMs = null;
    this.outOfTuneSinceMs = null;
    this.pitchState = "silent";
    this.resetVoicedCandidate();
  }

  private resetVoicedCandidate(): void {
    this.stableTargetFrames = 0;
    this.lastVoicedFrequency = null;
  }

  private clearTimer(): void { if (this.timer !== null) clearInterval(this.timer); this.timer = null; }
  private phaseForCurrentTarget(): TargetNotePhase | "idle" {
    const target = this.session.currentTargetNote;
    if (!target || this.session.status === "idle" || this.session.status === "complete") return "idle";
    if (this.session.currentExercise.completionMode === "pitch-sequence") {
      const elapsed = this.session.exerciseElapsedMs;
      if (elapsed < target.referenceStartMs) return "prepare";
      if (elapsed < target.singStartMs) return "reference";
      if (elapsed < target.singEndMs) return "sing";
      return "transition";
    }
    const elapsed = this.session.currentTargetElapsedMs;
    const referenceStart = target.referenceStartMs - target.startMs;
    const singStart = target.singStartMs - target.startMs;
    const singEnd = target.singEndMs - target.startMs;
    const transitionStart = target.transitionStartMs - target.startMs;
    const targetEnd = target.endMs - target.startMs;
    if (elapsed < referenceStart) return "prepare";
    if (elapsed < singStart) return "reference";
    if (!this.targetCompleted || elapsed < singEnd) return "sing";
    if (elapsed < transitionStart) return "evaluate";
    if (elapsed < targetEnd) return "transition";
    return "transition";
  }

  private emit(): ActivePracticeSession {
    const durationMs = Math.max(1, this.session.currentRoutineExercise.duration * 1000);
    const rawProgress = this.session.currentExercise.completionMode === "pitch-hold"
      ? this.session.requiredHoldMs ? this.session.successfulHoldMs / this.session.requiredHoldMs : 0
      : this.session.currentExercise.completionMode === "manual" ? 0 : this.session.exerciseElapsedMs / durationMs;
    this.session = { ...this.session, phase: this.phaseForCurrentTarget(), progress: Math.min(1, Math.max(0, rawProgress)) };
    this.onChange?.(this.session);
    return this.session;
  }
}
