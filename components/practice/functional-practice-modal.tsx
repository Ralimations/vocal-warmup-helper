"use client";

import { useEffect, useRef, useState } from "react";
import { exercises } from "@/data/exercises";
import { routineTemplates } from "@/data/routine-templates";
import { AudioEngine, type AudioObservation } from "@/features/audio/audio-engine";
import { ReferenceTonePlayer } from "@/features/audio/reference-tone-player";
import { PracticeEngine, type ActivePracticeSession } from "@/features/practice/practice-engine";
import { calculatePitchStability, centsFromTarget, getPitchInputState, getPracticeSignalState, getSuccessfulHoldProgress, getTunerState, isUsablePitchFrame, PITCH_TRAIL_WINDOW_MS, smoothPitchFrame, STALE_PITCH_TIMEOUT_MS, trimPitchHistory, trimPitchTrail, type PitchHistoryPoint, type PitchInputState, type PitchObservation } from "@/features/practice/pitch-feedback";
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

function formatOffset(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return "—";
  return `${cents > 0 ? "+" : ""}${Math.round(cents)}`;
}

interface VisualState {
  cents: number | null;
  history: PitchHistoryPoint[];
  inputState: PitchInputState;
  nowMs: number;
  pitch: PitchFrame | null;
  stability: number;
  stabilityObservations: PitchObservation[];
  voiceState: string;
  soundDetected: boolean;
  pitchDetected: boolean;
}

const initialVisualState: VisualState = { cents: null, history: [], inputState: "No voice detected", nowMs: 0, pitch: null, stability: 0, stabilityObservations: [], voiceState: "No voice detected", soundDetected: false, pitchDetected: false };

export function FunctionalPracticeModal({ onClose }: { onClose: () => void }) {
  const routine = routineTemplates[1];
  const engineRef = useRef<PracticeEngine | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const tonePlayer = useRef(new ReferenceTonePlayer());
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
      setVisual({ ...visualRef.current, history: [...visualRef.current.history], stabilityObservations: [...visualRef.current.stabilityObservations] });
    }, 50);
  };

  const setVisualVoiceState = (voiceState: string, inputState: PitchInputState = visualRef.current.inputState) => {
    visualRef.current = { ...visualRef.current, inputState, voiceState };
    publishVisual();
  };

  const armStalePitchTimer = () => {
    if (staleTimerRef.current !== null) clearTimeout(staleTimerRef.current);
    staleTimerRef.current = setTimeout(() => {
      visualRef.current = { ...visualRef.current, cents: null, inputState: "No voice detected", pitch: null, voiceState: "No voice detected", soundDetected: false, pitchDetected: false };
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
      player.close();
      if (visualTimerRef.current !== null) clearTimeout(visualTimerRef.current);
      if (staleTimerRef.current !== null) clearTimeout(staleTimerRef.current);
      setDetectedPitch(null);
    };
  }, [routine, setDetectedPitch]);

  useEffect(() => {
    const targetId = snapshot.currentTargetNote?.id ?? null;
    if (targetIdRef.current === targetId) return;
    targetIdRef.current = targetId;
    visualRef.current = { ...visualRef.current, cents: null, inputState: "No voice detected", pitch: null, stability: 0, stabilityObservations: [], voiceState: "No voice detected" };
    publishVisual();
  }, [snapshot.currentTargetNote?.id]);

  useEffect(() => {
    if (snapshot.status !== "complete") return;
    audioRef.current?.stop();
    audioRef.current = null;
    visualRef.current = { ...visualRef.current, inputState: "Detected", voiceState: "Complete" };
    publishVisual();
  }, [snapshot.status]);

  const handleAudioObservation = ({ frame, soundDetected }: AudioObservation, engine: PracticeEngine) => {
    if (engine.snapshot.status !== "active") return;
    const inputState = getPitchInputState(frame);
    const signalState = getPracticeSignalState(soundDetected, frame);
    const usable = frame !== null && isUsablePitchFrame(frame);
    const interpretedFrame = usable ? smoothPitchFrame(frame, visualRef.current.pitch, engine.snapshot.currentExercise.pitchSmoothing) : null;
    setDetectedPitch(interpretedFrame);
    engine.addPitchFrame(interpretedFrame);
    if (!interpretedFrame) {
      const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      const history = trimPitchHistory(visualRef.current.history, nowMs, PITCH_TRAIL_WINDOW_MS);
      const stabilityObservations = trimPitchTrail(visualRef.current.stabilityObservations, nowMs, PITCH_TRAIL_WINDOW_MS);
      visualRef.current = { ...visualRef.current, cents: null, history, inputState, nowMs, pitch: null, stability: stabilityObservations.length ? calculatePitchStability(stabilityObservations) : 0, stabilityObservations, voiceState: signalState.label, soundDetected, pitchDetected: false };
      publishVisual();
      return;
    }
    armStalePitchTimer();
    const target = engine.snapshot.currentTargetNote;
    const targetId = target?.id ?? null;
    if (targetIdRef.current !== targetId) {
      targetIdRef.current = targetId;
      visualRef.current = { ...visualRef.current, cents: null, stability: 0, stabilityObservations: [] };
    }
    const cents = target ? centsFromTarget(interpretedFrame.frequency, target.frequency) : null;
    const history = trimPitchHistory([...visualRef.current.history, { timestamp: interpretedFrame.timestamp, midi: interpretedFrame.midiNumber, confidence: interpretedFrame.confidence, amplitude: interpretedFrame.amplitude }], interpretedFrame.timestamp, PITCH_TRAIL_WINDOW_MS);
    const isSingPhase = engine.snapshot.phase === "sing" && target !== undefined;
    const stabilityObservations = isSingPhase && cents !== null
      ? trimPitchTrail([...visualRef.current.stabilityObservations, { timestamp: interpretedFrame.timestamp, cents, confidence: interpretedFrame.confidence, amplitude: interpretedFrame.amplitude }], interpretedFrame.timestamp, PITCH_TRAIL_WINDOW_MS)
      : visualRef.current.stabilityObservations;
    if (isSingPhase) tonePlayer.current.duck();
    visualRef.current = {
      cents,
      history,
      inputState: "Detected",
      nowMs: interpretedFrame.timestamp,
      pitch: interpretedFrame,
      stability: isSingPhase ? calculatePitchStability(stabilityObservations) : visualRef.current.stability,
      stabilityObservations,
      voiceState: `${interpretedFrame.noteName}${interpretedFrame.octave} detected`,
      soundDetected,
      pitchDetected: true,
    };
    publishVisual();
  };

  const begin = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const pitchOptional = engine.snapshot.currentExercise.completionMode === "timed" || engine.snapshot.currentExercise.completionMode === "continuous";
    try {
      engine.start();
      const audio = new AudioEngine();
      audioRef.current = audio;
      await audio.start((observation) => handleAudioObservation(observation, engine));
      setVisualVoiceState("Listening...", "No voice detected");
    } catch (cause) {
      audioRef.current?.stop();
      audioRef.current = null;
      if (pitchOptional) {
        setVisualVoiceState("In progress", "No voice detected");
      } else {
        engine.stop();
        setError(cause instanceof Error ? cause.message : "Microphone access was not available.");
      }
    }
  };

  const start = async () => {
    setError("");
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.snapshot.status === "paused") {
      engine.resume();
      setVisualVoiceState("Listening...", "No voice detected");
      return;
    }
    if (engine.snapshot.status === "active") return;
    try {
      if (isPitchExercise) await tonePlayer.current.unlock();
      await begin();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Audio could not be started.");
    }
  };

  const pause = () => {
    engineRef.current?.pause();
    tonePlayer.current.duck();
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
    tonePlayer.current.stop();
    engineRef.current?.stop();
    onClose();
  };

  const complete = () => {
    const result = engineRef.current?.complete();
    audioRef.current?.stop();
    audioRef.current = null;
    tonePlayer.current.stop();
    if (result) setSnapshot(result);
    setVisualVoiceState("Complete", "Detected");
  };

  const current = snapshot.currentTargetNote;
  useEffect(() => {
    if (!guideToneOn || !current || snapshot.phase === "idle" || snapshot.phase === "prepare") {
      tonePlayer.current.stop();
      return;
    }
    if (snapshot.phase === "reference") tonePlayer.current.start(current.note, guideVolume);
    else if (snapshot.phase === "sing") tonePlayer.current.duck();
    else tonePlayer.current.stop();
  }, [current, guideToneOn, guideVolume, snapshot.phase]);

  const isRunning = snapshot.status === "active";
  const isPaused = snapshot.status === "paused";
  const isComplete = snapshot.status === "complete";
  const completionMode = snapshot.currentExercise.completionMode;
  const isTimed = completionMode === "timed";
  const isPitchHold = completionMode === "pitch-hold";
  const isPitchSequence = completionMode === "pitch-sequence";
  const isPitchExercise = isPitchHold || isPitchSequence;
  const isContinuous = completionMode === "continuous";
  const hold = getSuccessfulHoldProgress(snapshot.successfulHoldMs, snapshot.requiredHoldMs);
  const tunerState = getTunerState(visual.cents);
  const targetName = current?.note ?? "the target";
  const guidance = isComplete
    ? "✓ EXERCISE COMPLETE"
    : isTimed
      ? `Time remaining · ${formatTime(Math.max(0, snapshot.currentRoutineExercise.duration * 1000 - snapshot.exerciseElapsedMs))}`
      : isContinuous
        ? !visual.soundDetected ? "Make a gentle sound when you are ready" : !visual.pitchDetected ? "Sound detected · Pitch unavailable" : `${visual.pitch ? `${visual.pitch.noteName}${visual.pitch.octave} detected` : "Sound detected"} · Keep the sound easy`
        : !current
          ? "Follow the exercise instructions"
          : isPitchSequence
            ? snapshot.phase === "prepare" || snapshot.phase === "reference"
              ? `Count in · Get ready for ${targetName}`
              : tunerState === "FLAT" || tunerState === "SLIGHTLY FLAT"
                ? "A little higher · Keep going"
                : tunerState === "SHARP" || tunerState === "SLIGHTLY SHARP"
                  ? "A little lower · Keep going"
                  : "Good · Keep going"
            : snapshot.phase === "prepare" || snapshot.phase === "reference"
              ? `Listen for ${targetName}`
              : visual.soundDetected && !visual.pitchDetected
                ? "Sound detected · Pitch unavailable"
                : visual.inputState === "No voice detected"
                ? `Sing ${targetName} to begin`
                : visual.inputState === "Too quiet"
                  ? `Too quiet — sing ${targetName} to begin`
                  : visual.inputState === "Pitch uncertain"
                    ? "Pitch uncertain — hold the note clearly"
                    : tunerState === "FLAT" || tunerState === "SLIGHTLY FLAT"
                      ? `${tunerState} — Raise your pitch slightly`
                      : tunerState === "SHARP" || tunerState === "SLIGHTLY SHARP"
                        ? `${tunerState} — Lower your pitch slightly`
                        : hold.percent >= 100 ? "✓ NOTE HELD" : `${tunerState} — Hold it... ${formatSeconds(hold.elapsedMs)} / ${formatSeconds(hold.durationMs)} sec`;

  return (
    <div className="practice-backdrop" role="dialog" aria-modal="true" aria-labelledby="practice-title">
      <section className="practice-panel">
        <button type="button" className="practice-close" onClick={stop} aria-label="Close practice">×</button>
        <p className="muted">{routine.name} · Exercise {snapshot.currentExerciseIndex + 1} of {routine.exerciseItems.length}</p>
        <h2 id="practice-title">{isComplete ? "Warmup complete" : snapshot.currentExercise.name}</h2>
        <p>{isComplete ? "The session summary is available below." : snapshot.currentExercise.instructions}</p>

        {isPitchExercise && <>
          <div className="practice-targets" aria-label="Target note sequence">
            {snapshot.targetNotes.map((target, index) => (
              <span key={target.id} className={`practice-target ${index < snapshot.currentTargetIndex ? "done" : ""} ${index === snapshot.currentTargetIndex ? "current" : ""}`}>
                {index < snapshot.currentTargetIndex ? "✓ " : ""}{target.note}
              </span>
            ))}
          </div>
          <div className="practice-target-card">
            <small>TARGET</small>
            <strong>{current?.note ?? "—"}</strong>
            <span>{current ? `${current.frequency.toFixed(2)} Hz` : "No pitch target"}</span>
          </div>
        </>}

        <div className="practice-guidance" aria-live="polite">{guidance}</div>
        {(isPitchExercise || isContinuous) && <PitchMeter cents={visual.cents} history={visual.history} nowMs={visual.nowMs} target={current} showTuner={isPitchExercise} informational={isContinuous} />}

        {!isTimed && <div className="practice-user-card">
          <div>
            <small>YOU</small>
            <strong>{visual.pitch ? `${visual.pitch.noteName}${visual.pitch.octave}` : "—"}</strong>
            <span>{visual.voiceState}{isPitchExercise ? ` · Pitch Offset: ${formatOffset(visual.cents)}` : ""}</span>
          </div>
          <div className="practice-stats">
            {isPitchExercise && <span><b>{visual.stabilityObservations.length ? `${visual.stability}%` : "—"}</b>Pitch Stability</span>}
            {isPitchHold && <span><b>{formatSeconds(hold.elapsedMs)} / {formatSeconds(hold.durationMs)} sec</b>Successful hold</span>}
            {isPitchSequence && <span><b>{Math.round(snapshot.progress * 100)}%</b>Sequence progress</span>}
          </div>
          {isPitchHold && <div className="sustain-track" aria-label={`Successful hold progress: ${formatSeconds(hold.elapsedMs)} of ${formatSeconds(hold.durationMs)} seconds`}>
            <span style={{ width: `${hold.percent}%` }} />
          </div>}
        </div>}

        <div className="practice-status">{isRunning ? (isTimed ? "In progress" : "Listening") : isPaused ? "Paused" : isComplete ? "Complete" : "Ready"} · {isTimed ? `${formatTime(snapshot.exerciseElapsedMs)} / ${formatTime(snapshot.currentRoutineExercise.duration * 1000)}` : `${formatTime(snapshot.elapsedMs)} total`}</div>
        {error && <p className="practice-error">{error}</p>}

        {isComplete && snapshot.summary && (
          <div className="practice-summary">
            <span><strong>{snapshot.summary.averagePitchAccuracy}%</strong>Accuracy</span>
            <span><strong>{snapshot.summary.averageCentsError}</strong>Avg offset</span>
            <span><strong>{formatTime(snapshot.summary.durationSeconds * 1000)}</strong>Duration</span>
          </div>
        )}

        {!isComplete && (
          <>
            <div className="practice-actions">
              <button type="button" onClick={start}>{isPaused ? "Resume" : isRunning ? "Listening" : "Start practice"}</button>
              {isPitchExercise && <button type="button" onClick={() => current && tonePlayer.current.start(current.note, guideVolume)} disabled={!current}>Replay guide</button>}
              {completionMode === "manual" && <button type="button" onClick={complete}>Complete</button>}
            </div>
            <div className="practice-navigation">
              <button type="button" onClick={previous} disabled={snapshot.currentExerciseIndex === 0 && snapshot.currentTargetIndex <= 0}>Previous</button>
              <button type="button" onClick={next}>{isPitchSequence ? "Skip target" : "Skip exercise"}</button>
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
