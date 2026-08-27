"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mic2, Pause, Play, Volume2, X } from "lucide-react";
import { exercises } from "@/data/exercises";
import { routineTemplates } from "@/data/routine-templates";
import { AudioEngine } from "@/features/audio/audio-engine";
import { ReferenceTonePlayer } from "@/features/audio/reference-tone-player";
import { PracticeEngine, type ActivePracticeSession } from "@/features/practice/practice-engine";
import { usePracticeStore } from "@/stores/practice-store";
import { cn } from "@/lib/utils";

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function FunctionalPracticeModal({ onClose }: { onClose: () => void }) {
  const routine = routineTemplates[1];
  const engineRef = useRef<PracticeEngine | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const tonePlayer = useRef(new ReferenceTonePlayer());
  const exerciseMap = exercises;
  const [snapshot, setSnapshot] = useState<ActivePracticeSession>(() => new PracticeEngine({ routine, exercises: exerciseMap }).snapshot);
  const [error, setError] = useState("");
  const [lastPitch, setLastPitch] = useState<string | null>(null);
  const setDetectedPitch = usePracticeStore((state) => state.setDetectedPitch);

  useEffect(() => {
    const engine = new PracticeEngine({ routine, exercises: exerciseMap, onChange: setSnapshot });
    engineRef.current = engine;
    const player = tonePlayer.current;
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
      engine.dispose();
      player.stop();
      setDetectedPitch(null);
    };
  }, [exerciseMap, routine, setDetectedPitch]);

  const start = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    setError("");
    try {
      if (engine.snapshot.status === "paused") {
        engine.resume();
        return;
      }
      if (engine.snapshot.status === "active") return;
      engine.start();
      const audio = new AudioEngine();
      audioRef.current = audio;
      await audio.start((frame) => {
        if (!frame) return;
        setDetectedPitch(frame);
        setLastPitch(`${frame.noteName}${frame.octave} ${frame.cents > 0 ? "+" : ""}${frame.cents}¢`);
        engine.addPitchFrame(frame);
      });
    } catch (cause) {
      audioRef.current?.stop();
      audioRef.current = null;
      engine.stop();
      setError(cause instanceof Error ? cause.message : "Microphone access was not available.");
    }
  };

  const pause = () => engineRef.current?.pause();
  const resume = () => engineRef.current?.resume();
  const previous = () => engineRef.current?.previous();
  const next = () => engineRef.current?.next();
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
  };

  const current = snapshot?.currentTargetNote;
  const isRunning = snapshot?.status === "active";
  const isPaused = snapshot?.status === "paused";
  const isComplete = snapshot?.status === "complete";

  return <div className="fixed inset-0 z-50 grid place-items-center bg-void/85 p-5 backdrop-blur-lg">
    <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rotate-[-1deg] rounded-[25px_8px] border-5 border-yellow bg-plum p-8 shadow-[14px_14px_0_#FF3AF2,28px_28px_0_#00F5D4]">
      <button onClick={stop} className="absolute right-4 top-3 text-3xl font-black text-yellow" aria-label="Close"><X /></button>
      <p className="eyebrow">{routine.name.toUpperCase()} · {formatTime(snapshot?.currentRoutineExercise.duration ? snapshot.currentRoutineExercise.duration * 1000 : 0)}</p>
      <div className="mt-2 flex items-end justify-between gap-4"><div><h2 className="font-heading text-5xl font-black [text-shadow:3px_3px_0_#FF3AF2]">{isComplete ? "Warmup complete." : snapshot?.currentExercise.name ?? "Find your center."}</h2><p className="mt-3 text-sm leading-relaxed">{isComplete ? "Nice work. Your summary is ready locally in memory." : snapshot?.currentExercise.instructions}</p></div><div className="shrink-0 text-right font-heading text-3xl font-black text-cyan"><span className="block">{formatTime(snapshot?.exerciseElapsedMs ?? 0)}<small className="ml-1 font-body text-[9px] uppercase tracking-widest text-yellow">Exercise</small></span><span className="mt-1 block text-lg text-pink">{formatTime(snapshot?.elapsedMs ?? 0)}<small className="ml-1 font-body text-[9px] uppercase tracking-widest text-yellow">Routine</small></span></div></div>
      <div className="mt-6 flex items-center gap-2"><span className="h-3 flex-1 rounded-full border-2 border-void bg-yellow"><i className="block h-full rounded-full bg-pink" style={{ width: `${((snapshot?.currentExerciseIndex ?? 0) / routine.exerciseItems.length) * 100}%` }} /></span><b className="text-xs text-yellow">{(snapshot?.currentExerciseIndex ?? 0) + 1}/{routine.exerciseItems.length}</b></div>
      <div className="my-9 text-center"><p className="eyebrow">TARGET NOTE</p><div className="mt-2 font-heading text-8xl font-black text-yellow [text-shadow:5px_5px_0_#FF3AF2,10px_10px_0_#00F5D4]">{current?.note ?? "—"}</div><p className="mt-2 text-xs font-bold text-cyan">{current ? `${current.frequency.toFixed(1)} Hz · ${snapshot?.currentExercise.pattern.length ?? 0}-note pattern` : "Breathing exercise · no pitch target"}</p></div>
      <div className="flex items-center justify-between rounded-xl border-3 border-cyan bg-void p-3 text-xs font-bold"><span>{lastPitch ? `You: ${lastPitch}` : "Microphone is off"}</span><span className="text-yellow">{isRunning ? "● Listening" : isPaused ? "Ⅱ Paused" : isComplete ? "✓ Complete" : "● Ready"}</span></div>
      {error && <p className="mt-3 text-xs font-bold text-orange">{error}</p>}
      {isComplete && snapshot?.summary && <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border-3 border-yellow bg-void p-3 text-center text-xs"><span><b className="block font-heading text-2xl text-cyan">{snapshot.summary.averagePitchAccuracy}%</b>Accuracy</span><span><b className="block font-heading text-2xl text-pink">{snapshot.summary.averageCentsError}</b>Avg cents</span><span><b className="block font-heading text-2xl text-yellow">{formatTime(snapshot.summary.durationSeconds * 1000)}</b>Duration</span></div>}
      {!isComplete && <div className="mt-6 grid grid-cols-2 gap-3"><button className="accent-button" onClick={isPaused ? resume : start}><span>{isPaused ? <Play className="mr-2 h-4 w-4 fill-current" /> : <Mic2 className="mr-2 h-4 w-4" />}</span>{isPaused ? "Resume" : isRunning ? "Listening" : "Enable mic"}</button><button className="outline-button" onClick={() => tonePlayer.current.play(current?.note ?? "E4", 1.2, snapshot?.currentRoutineExercise.referenceVolume ?? .18)} disabled={!current}><Volume2 className="mr-2 h-4 w-4" /> Hear target</button></div>}
      {!isComplete && <div className="mt-4 flex items-center justify-between gap-2"><button className="outline-button min-h-10 px-3" onClick={previous} disabled={(snapshot?.currentExerciseIndex ?? 0) === 0}><ChevronLeft className="h-4 w-4" /> Previous</button><button className="outline-button min-h-10 px-3" onClick={next}>Next <ChevronRight className="h-4 w-4" /></button></div>}
      <div className="mt-5 flex items-center justify-between gap-3"><button className="text-xs font-black text-cyan" onClick={stop}>{isComplete ? "Close summary" : "Stop session"}</button>{isRunning && <button className={cn("text-xs font-black text-yellow", !isRunning && "hidden")} onClick={pause}><Pause className="mr-1 inline h-4 w-4" /> Pause</button>}{isComplete ? <button className="accent-button min-h-10 px-5" onClick={onClose}>Done</button> : <button className="text-xs font-black text-yellow" onClick={complete}>Complete now</button>}</div>
    </div>
  </div>;
}
