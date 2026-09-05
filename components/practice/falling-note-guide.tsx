"use client";

import { memo } from "react";
import type { TargetNote, TargetNotePhase } from "@/features/practice/target-note-sequence";

const VIEW_WIDTH = 700;
const ROLL_TOP = 12;
const STRIKE_LINE_Y = 190;
const KEYBOARD_TOP = 202;
const VIEW_HEIGHT = 260;
const LOOKAHEAD_MS = 3500;
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

export function getPianoRollRange(notes: TargetNote[], detectedMidi?: number): { minMidi: number; maxMidi: number } {
  const midis = [...notes.map((note) => note.midi), ...(detectedMidi === undefined ? [] : [detectedMidi])];
  const lowest = midis.length ? Math.floor(Math.min(...midis)) : 60;
  const highest = midis.length ? Math.ceil(Math.max(...midis)) : 72;
  let minMidi = lowest - 2;
  let maxMidi = highest + 2;
  const missingLanes = Math.max(0, 12 - (maxMidi - minMidi));
  minMidi -= Math.floor(missingLanes / 2);
  maxMidi += Math.ceil(missingLanes / 2);
  return { minMidi, maxMidi };
}

export function getFallingNotePosition(note: TargetNote, elapsedMs: number): { y: number; height: number } {
  const timeUntilStart = note.singStartMs - elapsedMs;
  const pixelsPerMs = (STRIKE_LINE_Y - ROLL_TOP) / LOOKAHEAD_MS;
  const height = Math.max(12, Math.min(72, (note.singEndMs - note.singStartMs) * pixelsPerMs));
  return { y: STRIKE_LINE_Y - timeUntilStart * pixelsPerMs - height, height };
}

interface FallingNoteGuideProps {
  notes: TargetNote[];
  elapsedMs: number;
  currentTargetId?: string;
  detectedMidi?: number;
  phase: TargetNotePhase | "idle";
}

function FallingNoteGuideView({ notes, elapsedMs, currentTargetId, detectedMidi, phase }: FallingNoteGuideProps) {
  const { minMidi, maxMidi } = getPianoRollRange(notes, detectedMidi);
  const laneCount = maxMidi - minMidi + 1;
  const laneWidth = VIEW_WIDTH / laneCount;
  const visibleNotes = notes.filter((note) => note.singStartMs - elapsedMs <= LOOKAHEAD_MS && note.singEndMs - elapsedMs >= -900);
  const detectedPosition = detectedMidi === undefined ? null : ((detectedMidi - minMidi) + 0.5) * laneWidth;

  return (
    <section className="falling-note-guide" aria-label="Falling piano note guide">
      <div className="falling-note-heading">
        <span>Piano guide</span>
        <span>{phase === "sing" ? "Sing at the strike line" : "Watch the notes fall to the keys"}</span>
      </div>
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={`Upcoming vocal notes: ${visibleNotes.map((note) => note.note).join(", ") || "none"}`}>
        <rect width={VIEW_WIDTH} height={KEYBOARD_TOP} className="piano-roll-background" />
        {Array.from({ length: laneCount }, (_, index) => {
          const midi = minMidi + index;
          return <rect key={`lane-${midi}`} x={index * laneWidth} y={0} width={laneWidth} height={KEYBOARD_TOP} className={BLACK_KEYS.has(midi % 12) ? "piano-roll-lane black" : "piano-roll-lane"} />;
        })}
        {visibleNotes.map((note) => {
          const position = getFallingNotePosition(note, elapsedMs);
          const x = (note.midi - minMidi) * laneWidth + 2;
          return (
            <g key={note.id} className={note.id === currentTargetId ? "falling-note current" : "falling-note"}>
              <rect x={x} y={position.y} width={Math.max(5, laneWidth - 4)} height={position.height} rx="4" />
              <text x={x + Math.max(5, laneWidth - 4) / 2} y={position.y + Math.min(position.height - 3, 14)}>{note.note}</text>
            </g>
          );
        })}
        <line x1="0" y1={STRIKE_LINE_Y} x2={VIEW_WIDTH} y2={STRIKE_LINE_Y} className="piano-strike-line" />
        <text x="8" y={STRIKE_LINE_Y - 7} className="piano-strike-label">SING</text>
        {detectedPosition !== null && detectedPosition >= 0 && detectedPosition <= VIEW_WIDTH && (
          <g className="detected-note-marker" transform={`translate(${detectedPosition} ${STRIKE_LINE_Y})`}>
            <circle r="8" />
            <line y1="-13" y2="13" />
          </g>
        )}
        {Array.from({ length: laneCount }, (_, index) => {
          const midi = minMidi + index;
          const isBlack = BLACK_KEYS.has(midi % 12);
          const isTarget = notes.some((note) => note.id === currentTargetId && note.midi === midi);
          const isDetected = detectedMidi !== undefined && Math.round(detectedMidi) === midi;
          return (
            <g key={`key-${midi}`} className={`piano-key ${isBlack ? "black" : "white"} ${isTarget ? "target" : ""} ${isDetected ? "detected" : ""}`}>
              <rect x={index * laneWidth + 1} y={KEYBOARD_TOP} width={Math.max(4, laneWidth - 2)} height={VIEW_HEIGHT - KEYBOARD_TOP - 1} rx="2" />
              {midi % 12 === 0 && <text x={(index + 0.5) * laneWidth} y={VIEW_HEIGHT - 8}>C{Math.floor(midi / 12) - 1}</text>}
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export const FallingNoteGuide = memo(FallingNoteGuideView);
