"use client";

import { memo } from "react";
import { centsToMeterPercent, getPitchAxisLabels, getTunerState, PITCH_TRAIL_WINDOW_MS, type PitchHistoryPoint, type TunerState } from "@/features/practice/pitch-feedback";
import type { TargetNote } from "@/features/practice/target-note-sequence";

interface PitchMeterProps {
  cents: number | null;
  history: PitchHistoryPoint[];
  nowMs: number;
  target?: TargetNote;
  showTuner?: boolean;
  informational?: boolean;
}

function formatOffset(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return "—";
  return `${cents > 0 ? "+" : ""}${Math.round(cents)}`;
}

function PitchMeterView({ cents, history, nowMs, target, showTuner = true, informational = false }: PitchMeterProps) {
  const state: TunerState = getTunerState(cents);
  const marker = centsToMeterPercent(cents);
  const labels = getPitchAxisLabels(history, target?.midi);
  const minMidi = labels[labels.length - 1]?.midi ?? 56;
  const maxMidi = labels[0]?.midi ?? 64;
  const midiRange = Math.max(1, maxMidi - minMidi);
  const historyStart = nowMs - PITCH_TRAIL_WINDOW_MS;
  const historyPoints = history.map((point) => {
    const x = Math.min(100, Math.max(0, ((point.timestamp - historyStart) / PITCH_TRAIL_WINDOW_MS) * 100));
    const y = ((maxMidi - point.midi) / midiRange) * 100;
    return `${x},${Math.min(100, Math.max(0, y))}`;
  }).join(" ");
  const targetPosition = target ? Math.min(100, Math.max(0, ((maxMidi - target.midi) / midiRange) * 100)) : null;

  return (
    <div className="pitch-meter">
      {showTuner && <>
        <div className="pitch-meter-header">
          <span>Tuner</span>
          <strong className={`tuner-state tuner-${state.toLowerCase().replaceAll(" ", "-")}`}>{state}</strong>
          <b aria-label="Pitch offset">Pitch Offset: {formatOffset(cents)}</b>
        </div>
        <div className="meter-scale" aria-label={`Pitch tuner: ${state}, pitch offset ${formatOffset(cents)}`}>
          <span className="tuner-zone" />
          <span className="tuner-centered-zone" />
          <span className="meter-center" />
          {marker !== null && <span className="meter-marker" style={{ left: `${marker}%` }} />}
          <span className="meter-label meter-label-left">−50</span>
          <span className="meter-label meter-label-quarter">−25</span>
          <span className="meter-label meter-label-ten-left">−10</span>
          <span className="meter-label meter-label-center">0</span>
          <span className="meter-label meter-label-ten-right">+10</span>
          <span className="meter-label meter-label-three-quarter">+25</span>
          <span className="meter-label meter-label-right">+50</span>
        </div>
      </>}
      <div className="pitch-trail-heading">
        <span>{informational ? "Approximate Pitch · informational · last 5 sec" : "Recent Pitch · last 5 sec"}</span>
        <span>Detected notes</span>
      </div>
      <div className="pitch-history-graph">
        <div className="pitch-axis" aria-hidden="true">
          {labels.map((label) => <span key={`${label.note}-${label.midi}`} style={{ top: `${label.percent}%` }}>{label.note}</span>)}
        </div>
        <svg className="pitch-trail" viewBox="0 0 100 100" role="img" aria-label="Recent absolute detected pitch history">
          {targetPosition !== null && <line x1="0" y1={targetPosition} x2="100" y2={targetPosition} className="target-guide" />}
          {targetPosition !== null && <text x="2" y={Math.max(5, targetPosition - 2)} className="target-label">TARGET</text>}
          <line x1="0" y1="50" x2="100" y2="50" className="trail-center" />
          {historyPoints && <polyline points={historyPoints} className="trail-line" />}
        </svg>
      </div>
      {history.length === 0 && <p className="pitch-trail-empty">The graph stays ready while you wait for a detected note.</p>}
    </div>
  );
}

export const PitchMeter = memo(PitchMeterView);
