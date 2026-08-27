import { describe, expect, it, vi } from "vitest";
import { exercises } from "@/data/exercises";
import { PracticeEngine } from "@/features/practice/practice-engine";
import type { PitchFrame, Routine } from "@/types/domain";

const routine: Routine = {
  id: "test-routine",
  name: "Test Routine",
  description: "Testing",
  exerciseItems: [{ exerciseId: "humming", order: 0, duration: 1, tempo: 60, startNote: "C4", endNote: "E4", transpositionStep: 0, referenceVolume: 0.5, restAfter: 0 }],
  estimatedDuration: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  isBuiltIn: false,
};

const frame = (midiNumber: number): PitchFrame => ({ timestamp: 0, frequency: 261.63, midiNumber, noteName: "C", octave: 4, cents: 0, confidence: 0.95, amplitude: 0.2 });

describe("PracticeEngine", () => {
  it("pauses and resumes without advancing the timer while paused", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises, tickMs: 100 });
    engine.start();
    vi.advanceTimersByTime(300);
    const elapsedBeforePause = engine.snapshot.elapsedMs;
    engine.pause();
    vi.advanceTimersByTime(500);

    expect(engine.snapshot.status).toBe("paused");
    expect(engine.snapshot.elapsedMs).toBe(elapsedBeforePause);
    engine.resume();
    vi.advanceTimersByTime(800);
    expect(engine.snapshot.status).toBe("complete");
    vi.useRealTimers();
  });

  it("automatically completes the final exercise", () => {
    vi.useFakeTimers();
    const engine = new PracticeEngine({ routine, exercises, tickMs: 100 });
    engine.start();
    vi.advanceTimersByTime(1100);

    expect(engine.snapshot.status).toBe("complete");
    expect(engine.snapshot.summary?.completedExercises).toBe(1);
    vi.useRealTimers();
  });

  it("aggregates pitch deviation into a session summary", () => {
    const engine = new PracticeEngine({ routine, exercises });
    engine.start();
    engine.addPitchFrame(frame(60));
    engine.addPitchFrame(frame(60.1));
    const completed = engine.complete();

    expect(completed.summary?.averagePitchAccuracy).toBeGreaterThan(70);
    expect(completed.summary?.averageCentsError).toBeGreaterThan(0);
  });
});
