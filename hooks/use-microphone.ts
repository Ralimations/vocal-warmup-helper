"use client";
import { useRef } from "react";
import { AudioEngine } from "@/features/audio/audio-engine";
import { usePracticeStore } from "@/stores/practice-store";

export function useMicrophone() { const engine = useRef<AudioEngine | null>(null); const setDetectedPitch = usePracticeStore((state) => state.setDetectedPitch); const setMicrophoneStatus = usePracticeStore((state) => state.setMicrophoneStatus); const start = async () => { setMicrophoneStatus("requesting"); engine.current = new AudioEngine(); try { await engine.current.start(setDetectedPitch); setMicrophoneStatus("active"); } catch (error) { setMicrophoneStatus(error instanceof DOMException && error.name === "NotAllowedError" ? "denied" : "error"); engine.current.stop(); throw error; } }; const stop = () => { engine.current?.stop(); engine.current = null; setDetectedPitch(null); setMicrophoneStatus("idle"); }; return { start, stop }; }
