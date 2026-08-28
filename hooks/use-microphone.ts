"use client";
import { useCallback, useRef } from "react";
import { AudioEngine } from "@/features/audio/audio-engine";
import { usePracticeStore } from "@/stores/practice-store";

export function useMicrophone() {
  const engine = useRef<AudioEngine | null>(null);
  const setDetectedPitch = usePracticeStore((state) => state.setDetectedPitch);
  const setMicrophoneStatus = usePracticeStore((state) => state.setMicrophoneStatus);

  const start = useCallback(async () => {
    if (engine.current) return;

    setMicrophoneStatus("requesting");
    const nextEngine = new AudioEngine();
    engine.current = nextEngine;

    try {
      await nextEngine.start((observation) => setDetectedPitch(observation.frame));
      setMicrophoneStatus("active");
    } catch (error) {
      nextEngine.stop();
      if (engine.current === nextEngine) engine.current = null;
      setMicrophoneStatus(error instanceof DOMException && error.name === "NotAllowedError" ? "denied" : "error");
      throw error;
    }
  }, [setDetectedPitch, setMicrophoneStatus]);

  const stop = useCallback(() => {
    engine.current?.stop();
    engine.current = null;
    setDetectedPitch(null);
    setMicrophoneStatus("idle");
  }, [setDetectedPitch, setMicrophoneStatus]);

  return { start, stop };
}
