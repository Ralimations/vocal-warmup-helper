"use client";

import { create } from "zustand";
import type { MicrophoneStatus, PitchFrame, PracticeStatus } from "@/types/domain";

interface PracticeState {
  status: PracticeStatus;
  microphoneStatus: MicrophoneStatus;
  currentRoutineId: string;
  currentExerciseIndex: number;
  currentTargetNote: string;
  detectedPitch: PitchFrame | null;
  elapsedTime: number;
  isPaused: boolean;
  setStatus: (status: PracticeStatus) => void;
  setMicrophoneStatus: (status: MicrophoneStatus) => void;
  setDetectedPitch: (pitch: PitchFrame | null) => void;
  setTargetNote: (note: string) => void;
  setElapsedTime: (seconds: number) => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  status: "idle", microphoneStatus: "idle", currentRoutineId: "general-warmup", currentExerciseIndex: 0, currentTargetNote: "E4", detectedPitch: null, elapsedTime: 0, isPaused: false,
  setStatus: (status) => set({ status }), setMicrophoneStatus: (microphoneStatus) => set({ microphoneStatus }), setDetectedPitch: (detectedPitch) => set({ detectedPitch }), setTargetNote: (currentTargetNote) => set({ currentTargetNote }), setElapsedTime: (elapsedTime) => set({ elapsedTime }),
  reset: () => set({ status: "idle", microphoneStatus: "idle", detectedPitch: null, elapsedTime: 0, isPaused: false }),
}));
