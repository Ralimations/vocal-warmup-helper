"use client";

import { memo } from "react";
import { clampCents, centsToMeterPercent, getTunerState, PITCH_TRAIL_WINDOW_MS, TUNER_DISPLAY_RANGE_CENTS, type PitchObservation, type TunerState } from "@/features/practice/pitch-feedback";

interface PitchMeterProps {
  cents: number | null;
  trail: PitchObservation[];
  nowMs: number;
}

function formatCents(cents: number | null): string {
  if (cents === null || !Number.isFinite(cents)) return "—";
  return `${cents > 0 ? "+" : ""}${Math.round(cents)}¢`;
}

function PitchMeterView({ cents, trail, nowMs }: PitchMeterProps) {
  const state: TunerState = getTunerState(cents);
  const marker = centsToMeterPercent(cents);
  const trailStart = nowMs - PITCH_TRAIL_WINDOW_MS;
  const trailPoints = trail.map((observation) => {
    const x = Math.min(100, Math.max(0, ((observation.timestamp - trailStart) / PITCH_TRAIL_WINDOW_MS) * 100));
    const y = 50 - (clampCents(observation.cents, TUNER_DISPLAY_RANGE_CENTS) / TUNER_DISPLAY_RANGE_CENTS) * 38;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="pitch-meter" aria-label={`Pitch meter: ${state}, ${formatCents(cents)}`}>
      <div className="pitch-meter-header">
        <span>Tuner</span>
        <strong className={`tuner-state tuner-${state.toLowerCase().replace(" ", "-")}`}>{state}</strong>
        <b>{formatCents(cents)}</b>
      </div>
      <div className="meter-scale" aria-hidden="true">
        <span className="tuner-zone" />
        <span className="meter-center" />
        {marker !== null && <span className="meter-marker" style={{ left: `${marker}%` }} />}
        <span className="meter-label meter-label-left">−50¢</span>
        <span className="meter-label meter-label-quarter">−25¢</span>
        <span className="meter-label meter-label-ten-left">−10¢</span>
        <span className="meter-label meter-label-center">0</span>
        <span className="meter-label meter-label-ten-right">+10¢</span>
        <span className="meter-label meter-label-three-quarter">+25¢</span>
        <span className="meter-label meter-label-right">+50¢</span>
      </div>
      <div className="pitch-trail-heading"><span>Recent pitch</span><span>−50¢ to +50¢</span></div>
      <svg className="pitch-trail" viewBox="0 0 100 100" role="img" aria-label="Recent pitch trail">
        <line x1="0" y1="50" x2="100" y2="50" className="trail-center" />
        <line x1="0" y1="12" x2="100" y2="12" className="trail-guide" />
        <line x1="0" y1="88" x2="100" y2="88" className="trail-guide" />
        {trailPoints && <polyline points={trailPoints} className="trail-line" />}
      </svg>
      {trail.length === 0 && <p className="pitch-trail-empty">Sing during the target window to see your pitch trail.</p>}
    </div>
  );
}

export const PitchMeter = memo(PitchMeterView);
