"use client";

import { useEffect, useRef, useState } from "react";
import { exercises } from "@/data/exercises";
import { routineTemplates } from "@/data/routine-templates";
import { AudioEngine } from "@/features/audio/audio-engine";
import { ReferenceTonePlayer } from "@/features/audio/reference-tone-player";
import { PracticeEngine, type ActivePracticeSession } from "@/features/practice/practice-engine";
import { getReferenceTransitionId } from "@/features/practice/reference-tone-scheduler";
import { usePracticeStore } from "@/stores/practice-store";

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function FunctionalPracticeModal({ onClose }: { onClose: () => void }) {
  const routine = routineTemplates[1];
  const engineRef = useRef<PracticeEngine | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const tonePlayer = useRef(new ReferenceTonePlayer());
  const referenceIdRef = useRef<string | null>(null);
  const [snapshot, setSnapshot] = useState<ActivePracticeSession>(() => new PracticeEngine({ routine, exercises }).snapshot);
  const [error, setError] = useState("");
  const [guideToneOn, setGuideToneOn] = useState(true);
  const [guideVolume, setGuideVolume] = useState(0.18);
  const [voiceState, setVoiceState] = useState("No voice detected");
  const detectedPitch = usePracticeStore((state) => state.detectedPitch);
  const setDetectedPitch = usePracticeStore((state) => state.setDetectedPitch);

  useEffect(() => {
    const engine = new PracticeEngine({ routine, exercises, onChange: setSnapshot });
    engineRef.current = engine;
    const player = tonePlayer.current;
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
      engine.dispose();
      player.stop();
      setDetectedPitch(null);
    };
  }, [routine, setDetectedPitch]);

  const begin = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      engine.start();
      const audio = new AudioEngine();
      audioRef.current = audio;
      await audio.start((frame) => {
        setDetectedPitch(frame);
        if (!frame) {
          setVoiceState("No voice detected");
          return;
        }
        setVoiceState(frame.confidence < 0.5 ? "Pitch uncertain" : `${frame.noteName}${frame.octave} detected`);
        engine.addPitchFrame(frame);
      });
      setVoiceState("Listening");
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
      setVoiceState("Listening");
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
    setVoiceState("Paused");
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
    setVoiceState("Complete");
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
  const detectedNote = detectedPitch ? `${detectedPitch.noteName}${detectedPitch.octave}` : "—";
  const detectedCents = detectedPitch ? `${detectedPitch.cents > 0 ? "+" : ""}${detectedPitch.cents} cents` : "—";

  return (
    <div className="practice-backdrop" role="dialog" aria-modal="true" aria-labelledby="practice-title">
      <section className="practice-panel">
        <button type="button" className="practice-close" onClick={stop} aria-label="Close practice">×</button>
        <p className="muted">{routine.name} · Exercise {snapshot.currentExerciseIndex + 1} of {routine.exerciseItems.length}</p>
        <h2 id="practice-title">{isComplete ? "Warmup complete" : snapshot.currentExercise.name}</h2>
        <p>{isComplete ? "The session summary is available below." : snapshot.currentExercise.instructions}</p>

        <div className="practice-meta">
          <span>Exercise: {formatTime(snapshot.exerciseElapsedMs)}</span>
          <span>Routine: {formatTime(snapshot.elapsedMs)}</span>
        </div>

        <div className="practice-targets" aria-label="Target note sequence">
          {snapshot.targetNotes.map((target, index) => (
            <span key={target.id} className={`practice-target ${index === snapshot.currentTargetIndex ? "current" : ""}`}>
              {index < snapshot.currentTargetIndex ? "✓ " : ""}{target.note}
            </span>
          ))}
          {snapshot.targetNotes.length === 0 && <span className="muted">No pitch target for this exercise.</span>}
        </div>

        <div className="practice-readout">
          <div><small>Target</small><strong>{current?.note ?? "—"}</strong><small>{current ? `${current.frequency.toFixed(2)} Hz` : "No pitch target"}</small></div>
          <div><small>You</small><strong>{detectedNote}</strong><small>{detectedCents}</small></div>
        </div>

        <div className="practice-status" aria-live="polite">
          {voiceState} · {isRunning ? "Listening" : isPaused ? "Paused" : isComplete ? "Complete" : "Ready"}
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
