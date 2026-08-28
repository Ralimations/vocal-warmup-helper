import { describe, expect, it, vi } from "vitest";
import { exercises } from "@/data/exercises";
import { PracticeEngine, SUSTAIN_RESET_MS } from "@/features/practice/practice-engine";
import { getSuccessfulHoldProgress } from "@/features/practice/pitch-feedback";
import type { Exercise, PitchFrame, Routine } from "@/types/domain";

const pitchHoldExercise: Exercise = { ...exercises.find((exercise) => exercise.id === "humming")!, id: "test-pitch-hold", name: "Test Pitch Hold", completionMode: "pitch-hold", pattern: [0], singDurationMs: 1500 };
const pitchSequenceExercise: Exercise = { ...exercises.find((exercise) => exercise.id === "five-note-major")!, id: "test-pitch-sequence", name: "Test Pitch Sequence", completionMode: "pitch-sequence", pattern: [0, 2], singDurationMs: 1200 };
const testExercises = [...exercises, pitchHoldExercise, pitchSequenceExercise];

const routine: Routine = {
  id: "test-routine",
  name: "Test Routine",
  description: "Testing",
  exerciseItems: [{ exerciseId: pitchHoldExercise.id, order: 0, duration: 20, tempo: 60, startNote: "C4", endNote: "C4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 }],
  estimatedDuration: 20,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  isBuiltIn: false,
};

const frame = (midiNumber = 60, frequency = 261.63): PitchFrame => ({ timestamp: 0, frequency, midiNumber, noteName: "C", octave: 4, cents: 0, confidence: 0.95, amplitude: 0.2 });
const offsetFrame = (cents: number) => frame(60, 261.63 * 2 ** (cents / 1200));
const flatFrame = () => offsetFrame(-36);
const sharpFrame = () => offsetFrame(36);

function enterSingPhase(engine: PracticeEngine): void {
  engine.start();
  vi.advanceTimersByTime(1400);
}

function feed(engine: PracticeEngine, nextFrame: PitchFrame | null, count: number): void {
  for (let index = 0; index < count; index += 1) {
    engine.addPitchFrame(nextFrame);
    vi.advanceTimersByTime(50);
  }
}

describe("PracticeEngine", () => {
  it("does not complete a pitch target because time elapsed alone", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    engine.start();
    vi.advanceTimersByTime(12000);

    expect(engine.snapshot.status).toBe("active");
    expect(engine.snapshot.currentTargetIndex).toBe(0);
    expect(engine.snapshot.successfulHoldMs).toBe(0);
    engine.stop();
    vi.useRealTimers();
  });

  it("does not accumulate flat, sharp, silent, or wrong-note input", () => {
    vi.useFakeTimers();
    for (const input of [flatFrame(), sharpFrame(), null, frame(61, 277.18)]) {
      const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
      enterSingPhase(engine);
      feed(engine, input, 20);
      expect(engine.snapshot.successfulHoldMs).toBe(0);
      engine.stop();
    }
    vi.useRealTimers();
  });

  it("counts human vocal offsets through ±25 cents as successful hold but not ±26", () => {
    vi.useFakeTimers();
    for (const offset of [5, 15, 24]) {
      const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
      enterSingPhase(engine);
      feed(engine, offsetFrame(offset), 20);
      expect(engine.snapshot.successfulHoldMs).toBeGreaterThan(0);
      engine.stop();
    }
    const close = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    enterSingPhase(close);
    feed(close, offsetFrame(26), 20);
    expect(close.snapshot.successfulHoldMs).toBe(0);
    close.stop();
    vi.useRealTimers();
  });

  it("allows pitch-hold exercises to configure acceptance independently of tuner labels", () => {
    vi.useFakeTimers();
    const configuredExercise: Exercise = { ...pitchHoldExercise, id: "strict-pitch-hold", pitchHoldToleranceCents: 15 };
    const configuredRoutine = { ...routine, exerciseItems: [{ ...routine.exerciseItems[0], exerciseId: configuredExercise.id }] };
    const engine = new PracticeEngine({ routine: configuredRoutine, exercises: [...testExercises, configuredExercise], tickMs: 50 });
    enterSingPhase(engine);
    feed(engine, offsetFrame(20), 20);
    expect(engine.snapshot.successfulHoldMs).toBe(0);
    engine.stop();
    vi.useRealTimers();
  });

  it("requires a short run of stable frames before starting hold", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    enterSingPhase(engine);
    engine.addPitchFrame(frame());
    vi.advanceTimersByTime(50);
    expect(engine.snapshot.successfulHoldMs).toBe(0);
    engine.addPitchFrame(frame());
    vi.advanceTimersByTime(50);
    expect(engine.snapshot.successfulHoldMs).toBeGreaterThan(0);
    engine.stop();
    vi.useRealTimers();
  });

  it("does not turn one isolated pitch observation into sustained-note progress", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    enterSingPhase(engine);
    engine.addPitchFrame(frame());
    vi.advanceTimersByTime(1000);
    expect(engine.snapshot.successfulHoldMs).toBe(0);
    engine.stop();
    vi.useRealTimers();
  });

  it("uses the configured 1500 ms pitch-hold requirement and advances after success", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    expect(engine.snapshot.requiredHoldMs).toBe(1500);
    enterSingPhase(engine);
    feed(engine, frame(), 32);

    expect(engine.snapshot.successfulHoldMs).toBe(1500);
    expect(engine.snapshot.currentTargetIndex).toBe(0);
    vi.advanceTimersByTime(500);
    expect(engine.snapshot.status).toBe("complete");
    expect(engine.snapshot.progress).toBe(1);
    engine.stop();
    vi.useRealTimers();
  });

  it("preserves progress through grace, pauses during longer loss, and resets after extended loss", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    enterSingPhase(engine);
    feed(engine, frame(), 20);
    const beforeWobble = engine.snapshot.successfulHoldMs;
    feed(engine, flatFrame(), 2);
    feed(engine, frame(), 2);
    expect(engine.snapshot.successfulHoldMs).toBeGreaterThanOrEqual(beforeWobble);
    feed(engine, flatFrame(), 8);
    expect(engine.snapshot.successfulHoldMs).toBeGreaterThanOrEqual(beforeWobble);
    feed(engine, flatFrame(), Math.ceil(SUSTAIN_RESET_MS / 50) + 2);
    expect(engine.snapshot.successfulHoldMs).toBe(0);
    engine.stop();
    vi.useRealTimers();
  });

  it("pauses and resumes successful sustain without advancing while paused", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    enterSingPhase(engine);
    feed(engine, frame(), 20);
    const beforePause = engine.snapshot.successfulHoldMs;
    const sustainBeforePause = getSuccessfulHoldProgress(engine.snapshot.successfulHoldMs, engine.snapshot.requiredHoldMs);
    engine.pause();
    vi.advanceTimersByTime(500);

    expect(engine.snapshot.successfulHoldMs).toBe(beforePause);
    expect(getSuccessfulHoldProgress(engine.snapshot.successfulHoldMs, engine.snapshot.requiredHoldMs)).toEqual(sustainBeforePause);
    engine.resume();
    feed(engine, frame(), 10);
    expect(engine.snapshot.successfulHoldMs).toBeGreaterThan(beforePause);
    engine.stop();
    vi.useRealTimers();
  });

  it("keeps a pitch target in sing until a valid hold succeeds", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises: testExercises, tickMs: 50 });
    enterSingPhase(engine);
    vi.advanceTimersByTime(4000);
    expect(engine.snapshot.phase).toBe("sing");
    feed(engine, frame(), 32);
    vi.advanceTimersByTime(500);
    expect(engine.snapshot.status).toBe("complete");
    engine.stop();
    vi.useRealTimers();
  });

  it("scores valid pitch during the active target without emitting on every frame", () => {
    const scoringRoutine = { ...routine, exerciseItems: [{ ...routine.exerciseItems[0], duration: 5 }] };
    const changes: number[] = [];
    const engine = new PracticeEngine({ routine: scoringRoutine, exercises: testExercises, onChange: () => changes.push(1) });
    vi.useFakeTimers();
    engine.start();
    vi.advanceTimersByTime(1400);
    const changesBeforeFrames = changes.length;
    engine.addPitchFrame(frame(60));
    engine.addPitchFrame(frame(60.1, 261.63 * 2 ** (10 / 1200)));
    const completed = engine.complete();
    vi.useRealTimers();

    expect(completed.summary?.averagePitchAccuracy).toBeGreaterThan(70);
    expect(completed.summary?.averageCentsError).toBeGreaterThan(0);
    expect(changes.length).toBe(changesBeforeFrames + 1);
  });

  it("allows manual skipping without awarding successful hold", () => {
    vi.useFakeTimers();
    const sequenceRoutine = { ...routine, exerciseItems: [{ ...routine.exerciseItems[0], exerciseId: pitchSequenceExercise.id, endNote: "D4" }] };
    const engine = new PracticeEngine({ routine: sequenceRoutine, exercises: testExercises, tickMs: 50 });
    enterSingPhase(engine);
    engine.nextNote();
    expect(engine.snapshot.currentTargetIndex).toBe(1);
    expect(engine.snapshot.successfulHoldMs).toBe(0);
    expect(engine.stop()?.skippedTargetCount).toBe(1);
    vi.useRealTimers();
  });

  it("completes timed breathing without pitch input", () => {
    vi.useFakeTimers();
    const breathingRoutine = { ...routine, exerciseItems: [{ ...routine.exerciseItems[0], exerciseId: "breathing", duration: 1 }] };
    const engine = new PracticeEngine({ routine: breathingRoutine, exercises: testExercises, tickMs: 50 });
    engine.start();
    vi.advanceTimersByTime(1000);
    expect(engine.snapshot.status).toBe("complete");
    expect(engine.snapshot.currentExercise.completionMode).toBe("timed");
    engine.stop();
    vi.useRealTimers();
  });

  it("keeps continuous humming and lip trills timer-driven", () => {
    vi.useFakeTimers();
    for (const exerciseId of ["humming", "lip-trills"]) {
      const continuousRoutine = { ...routine, exerciseItems: [{ ...routine.exerciseItems[0], exerciseId, duration: 1 }] };
      const engine = new PracticeEngine({ routine: continuousRoutine, exercises: testExercises, tickMs: 50 });
      expect(engine.snapshot.currentExercise.completionMode).toBe("continuous");
      engine.start();
      engine.addPitchFrame(offsetFrame(100));
      vi.advanceTimersByTime(1000);
      expect(engine.snapshot.status).toBe("complete");
      engine.stop();
    }
    vi.useRealTimers();
  });

  it("keeps pitch-sequence targets independently success-gated", () => {
    vi.useFakeTimers();
    const sequenceRoutine = { ...routine, exerciseItems: [{ ...routine.exerciseItems[0], exerciseId: pitchSequenceExercise.id, duration: 20, endNote: "D4" }] };
    const engine = new PracticeEngine({ routine: sequenceRoutine, exercises: testExercises, tickMs: 50 });
    expect(engine.snapshot.currentExercise.completionMode).toBe("pitch-sequence");
    expect(engine.snapshot.targetNotes.length).toBeGreaterThan(1);
    engine.start();
    for (let index = 0; index < 240; index += 1) {
      engine.addPitchFrame(flatFrame());
      vi.advanceTimersByTime(50);
    }
    expect(engine.snapshot.status).toBe("active");
    expect(engine.snapshot.currentTargetIndex).toBeGreaterThan(0);
    expect(engine.snapshot.progress).toBeGreaterThan(0);
    engine.stop();
    vi.useRealTimers();
  });
});
