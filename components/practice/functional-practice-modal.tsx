"use client";

import { useEffect, useRef, useState } from "react";
import { exercises } from "@/data/exercises";
import { routineTemplates } from "@/data/routine-templates";
import { AudioEngine } from "@/features/audio/audio-engine";
import { ReferenceTonePlayer } from "@/features/audio/reference-tone-player";
import { PracticeEngine, type ActivePracticeSession } from "@/features/practice/practice-engine";
import { getReferenceTransitionId } from "@/features/practice/reference-tone-scheduler";
import { calculatePitchStability, centsFromTarget, getPitchInputState, getSustainProgress, isUsablePitchFrame, PITCH_TRAIL_WINDOW_MS, STALE_PITCH_TIMEOUT_MS, trimPitchTrail, type PitchInputState, type PitchObservation } from "@/features/practice/pitch-feedback";
import { usePracticeStore } from "@/stores/practice-store";
import { PitchMeter } from "@/components/practice/pitch-meter";
import type { PitchFrame } from "@/types/domain";

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function formatSeconds(milliseconds: number): string {
  return (milliseconds / 1000).toFixed(1);
}

interface VisualState {
  cents: number | null;
  nowMs: number;
  pitch: PitchFrame | null;
  stability: number;
  trail: PitchObservation[];
  voiceState: string;
}

const initialVisualState: VisualState = { cents: null, nowMs: 0, pitch: null, stability: 0, trail: [], voiceState: "No voice detected" };

export function FunctionalPracticeModal({ onClose }: { onClose: () => void }) {
  const routine = routineTemplates[1];
  const engineRef = useRef<PracticeEngine | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const tonePlayer = useRef(new ReferenceTonePlayer());
  const referenceIdRef = useRef<string | null>(null);
  const visualRef = useRef<VisualState>(initialVisualState);
  const visualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetIdRef = useRef<string | null>(null);
  const [snapshot, setSnapshot] = useState<ActivePracticeSession>(() => new PracticeEngine({ routine, exercises }).snapshot);
  const [visual, setVisual] = useState<VisualState>(initialVisualState);
  const [error, setError] = useState("");
  const [guideToneOn, setGuideToneOn] = useState(true);
  const [guideVolume, setGuideVolume] = useState(0.18);
  const setDetectedPitch = usePracticeStore((state) => state.setDetectedPitch);

  const publishVisual = () => {
    if (visualTimerRef.current !== null) return;
    visualTimerRef.current = setTimeout(() => {
      visualTimerRef.current = null;
      setVisual({ ...visualRef.current, trail: [...visualRef.current.trail] });
    }, 50);
  };

  const setVisualVoiceState = (voiceState: string) => {
    visualRef.current = { ...visualRef.current, voiceState };
    publishVisual();
  };

  const armStalePitchTimer = () => {
    if (staleTimerRef.current !== null) clearTimeout(staleTimerRef.current);
    staleTimerRef.current = setTimeout(() => {
      visualRef.current = { ...visualRef.current, cents: null, pitch: null, voiceState: "No voice detected" };
      setDetectedPitch(null);
      publishVisual();
    }, STALE_PITCH_TIMEOUT_MS);
  };

  useEffect(() => {
    const engine = new PracticeEngine({ routine, exercises, onChange: setSnapshot });
    engineRef.current = engine;
    const player = tonePlayer.current;
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
      engine.dispose();
      player.stop();
      if (visualTimerRef.current !== null) clearTimeout(visualTimerRef.current);
      if (staleTimerRef.current !== null) clearTimeout(staleTimerRef.current);
      setDetectedPitch(null);
    };
  }, [routine, setDetectedPitch]);

  useEffect(() => {
    const targetId = snapshot.currentTargetNote?.id ?? null;
    if (targetIdRef.current === targetId) return;
    targetIdRef.current = targetId;
    visualRef.current = { ...visualRef.current, cents: null, pitch: null, stability: 0, trail: [], voiceState: "No voice detected" };
    publishVisual();
  }, [snapshot.currentTargetNote?.id]);

  useEffect(() => {
    if (snapshot.status !== "complete") return;
    audioRef.current?.stop();
    audioRef.current = null;
    visualRef.current = { ...visualRef.current, voiceState: "Complete" };
    publishVisual();
  }, [snapshot.status]);

  const handlePitchFrame = (frame: PitchFrame | null, engine: PracticeEngine) => {
    if (engine.snapshot.status !== "active") return;
    const inputState: PitchInputState = getPitchInputState(frame);
    const usable = frame !== null && isUsablePitchFrame(frame);
    setDetectedPitch(usable ? frame : null);
    if (!usable) {
      visualRef.current = { ...visualRef.current, cents: null, pitch: null, voiceState: inputState };
      publishVisual();
      return;
    }

    armStalePitchTimer();
    const target = engine.snapshot.currentTargetNote;
    const targetId = target?.id ?? null;
    if (targetIdRef.current !== targetId) {
      targetIdRef.current = targetId;
      visualRef.current = { ...visualRef.current, cents: null, pitch: null, stability: 0, trail: [] };
    }
    const cents = target ? centsFromTarget(frame.frequency, target.frequency) : null;
    const isSingPhase = engine.snapshot.phase === "sing" && target !== undefined;
    const nextTrail = isSingPhase && cents !== null
      ? trimPitchTrail([...visualRef.current.trail, { timestamp: frame.timestamp, cents, confidence: frame.confidence, amplitude: frame.amplitude }], frame.timestamp, PITCH_TRAIL_WINDOW_MS)
      : visualRef.current.trail;
    visualRef.current = {
      cents,
      nowMs: frame.timestamp,
      pitch: frame,
      stability: isSingPhase ? calculatePitchStability(nextTrail) : visualRef.current.stability,
      trail: nextTrail,
      voiceState: `${frame.noteName}${frame.octave} detected`,
    };
    engine.addPitchFrame(frame);
    publishVisual();
  };

  const begin = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      engine.start();
      const audio = new AudioEngine();
      audioRef.current = audio;
      await audio.start((frame) => handlePitchFrame(frame, engine));
      setVisualVoiceState("Listening...");
    } catch (cause) {
      audioRef.current?.stop();
      audioRef.current = null;
      engine.stop();
      setError(cause instanceof Error ? cause.message : "Microphone access was not available.");
    }
  };

  const start = async () => {
    setError("");
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.snapshot.status === "paused") {
      engine.resume();
      setVisualVoiceState("Listening...");
      return;
    }
    if (engine.snapshot.status === "active") return;
    try {
      await tonePlayer.current.unlock();
      await begin();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Audio could not be started.");
    }
  };

  const pause = () => {
    engineRef.current?.pause();
    setVisualVoiceState("Paused");
  };

  const previous = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.snapshot.currentTargetIndex > 0) engine.previousNote();
    else engine.previous();
  };

  const next = () => engineRef.current?.nextNote();

  const stop = () => {
    audioRef.current?.stop();
    audioRef.current = null;
    engineRef.current?.stop();
    onClose();
  };

  const complete = () => {
    const result = engineRef.current?.complete();
    audioRef.current?.stop();
    audioRef.current = null;
    if (result) setSnapshot(result);
    setVisualVoiceState("Complete");
  };

  const current = snapshot.currentTargetNote;
  useEffect(() => {
    if (!guideToneOn || !current) return;
    const referenceId = getReferenceTransitionId(snapshot.phase, current.id, referenceIdRef.current);
    if (!referenceId) return;
    referenceIdRef.current = referenceId;
    tonePlayer.current.play(current.note, 0.7, guideVolume);
  }, [current, guideToneOn, guideVolume, snapshot.phase]);

  const isRunning = snapshot.status === "active";
  const isPaused = snapshot.status === "paused";
  const isComplete = snapshot.status === "complete";
  const sustain = getSustainProgress(snapshot.exerciseElapsedMs, current);
  const detectedNote = visual.pitch ? `${visual.pitch.noteName}${visual.pitch.octave}` : "—";
  const sequence = snapshot.targetNotes;

  return (
    <div className="practice-backdrop" role="dialog" aria-modal="true" aria-labelledby="practice-title">
      <section className="practice-panel">
        <button type="button" className="practice-close" onClick={stop} aria-label="Close practice">×</button>
        <p className="muted">{routine.name} · Exercise {snapshot.currentExerciseIndex + 1} of {routine.exerciseItems.length}</p>
        <h2 id="practice-title">{isComplete ? "Warmup complete" : snapshot.currentExercise.name}</h2>
        <p>{isComplete ? "The session summary is available below." : snapshot.currentExercise.instructions}</p>

        <div className="practice-targets" aria-label="Target note sequence">
          {sequence.map((target, index) => (
            <span key={target.id} className={`practice-target ${index < snapshot.currentTargetIndex ? "done" : ""} ${index === snapshot.currentTargetIndex ? "current" : ""}`}>
              {index < snapshot.currentTargetIndex ? "✓ " : ""}{target.note}
            </span>
          ))}
          {sequence.length === 0 && <span className="muted">No pitch target for this exercise.</span>}
        </div>

        <div className="practice-target-card">
          <small>TARGET</small>
          <strong>{current?.note ?? "—"}</strong>
          <span>{current ? `${current.frequency.toFixed(2)} Hz` : "No pitch target"}</span>
        </div>

        <PitchMeter cents={visual.cents} trail={visual.trail} nowMs={visual.nowMs} />

        <div className="practice-user-card">
          <div>
            <small>YOU</small>
            <strong>{detectedNote}</strong>
            <span>{visual.voiceState}</span>
          </div>
          <div className="practice-stats">
            <span><b>{visual.stability}%</b>Pitch Stability</span>
            <span><b>{formatSeconds(sustain.elapsedMs)} / {formatSeconds(sustain.durationMs)}s</b>Sustain</span>
          </div>
          <div className="sustain-track" aria-label={`Sustain progress: ${formatSeconds(sustain.elapsedMs)} of ${formatSeconds(sustain.durationMs)} seconds`}>
            <span style={{ width: `${sustain.percent}%` }} />
          </div>
        </div>

        <div className="practice-status" aria-live="polite">
          {isRunning ? "Listening" : isPaused ? "Paused" : isComplete ? "Complete" : "Ready"} · {formatTime(snapshot.elapsedMs)} total
        </div>
        {error && <p className="practice-error">{error}</p>}

        {isComplete && snapshot.summary && (
          <div className="practice-summary">
            <span><strong>{snapshot.summary.averagePitchAccuracy}%</strong>Accuracy</span>
            <span><strong>{snapshot.summary.averageCentsError}</strong>Avg cents</span>
            <span><strong>{formatTime(snapshot.summary.durationSeconds * 1000)}</strong>Duration</span>
          </div>
        )}

        {!isComplete && (
          <>
            <div className="practice-actions">
              <button type="button" onClick={start}>{isPaused ? "Resume" : isRunning ? "Listening" : "Start practice"}</button>
              <button type="button" onClick={() => current && tonePlayer.current.play(current.note, 0.7, guideVolume)} disabled={!current}>Replay note</button>
              <button type="button" onClick={complete}>Complete</button>
            </div>
            <div className="practice-navigation">
              <button type="button" onClick={previous} disabled={snapshot.currentExerciseIndex === 0 && snapshot.currentTargetIndex <= 0}>Previous</button>
              <button type="button" onClick={next}>Next</button>
            </div>
            <div className="practice-options">
              <label><input type="checkbox" checked={guideToneOn} onChange={(event) => setGuideToneOn(event.target.checked)} /> Guide tone</label>
              <label>Volume <input aria-label="Guide tone volume" type="range" min="0" max="0.5" step="0.01" value={guideVolume} onChange={(event) => setGuideVolume(Number(event.target.value))} /></label>
              {isRunning && <button type="button" onClick={pause}>Pause</button>}
            </div>
          </>
        )}

        <div className="practice-navigation">
          <button type="button" onClick={stop}>{isComplete ? "Close" : "Stop session"}</button>
          {isComplete && <button type="button" onClick={onClose}>Done</button>}
        </div>
      </section>
    </div>
  );
}
