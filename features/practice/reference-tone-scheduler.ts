import type { TargetNotePhase } from "@/features/practice/target-note-sequence";

export function getReferenceTransitionId(phase: TargetNotePhase | "idle", targetId: string | undefined, lastPlayedId: string | null): string | null {
  if (phase !== "reference" || !targetId || targetId === lastPlayedId) return null;
  return targetId;
}
