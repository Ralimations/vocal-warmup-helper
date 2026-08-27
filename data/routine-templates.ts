import type { Routine } from "@/types/domain";

const item = (exerciseId: string, order: number, duration: number): Routine["exerciseItems"][number] => ({ exerciseId, order, duration, tempo: 80, startNote: "C4", endNote: "G4", transpositionStep: 1, referenceVolume: .5, restAfter: 10 });
export const routineTemplates: Routine[] = [
  { id: "quick-warmup", name: "Quick Warmup", description: "A friendly five-minute hello for your voice.", exerciseItems: [item("breathing", 0, 60), item("humming", 1, 120), item("five-note-major", 2, 120)], estimatedDuration: 5, createdAt: "2026-08-01", updatedAt: "2026-08-01", isBuiltIn: true },
  { id: "general-warmup", name: "General Warmup", description: "The everyday sequence: breath, buzz, scales, cool down.", exerciseItems: [item("breathing", 0, 180), item("lip-trills", 1, 300), item("humming", 2, 300), item("five-note-major", 3, 420), item("cooldown", 4, 300)], estimatedDuration: 25, createdAt: "2026-08-01", updatedAt: "2026-08-01", isBuiltIn: true },
  { id: "recording-day", name: "Recording Day", description: "Wake up placement without tiring out the instrument.", exerciseItems: [item("breathing", 0, 120), item("humming", 1, 180), item("five-note-major", 2, 300), item("sirens", 3, 300)], estimatedDuration: 15, createdAt: "2026-08-01", updatedAt: "2026-08-01", isBuiltIn: true },
];
