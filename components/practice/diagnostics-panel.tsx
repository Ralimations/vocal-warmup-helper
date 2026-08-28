"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAudioDiagnosticsText, type AudioDiagnostics } from "@/features/audio/audio-diagnostics";

interface BrowserDiagnostics {
  userAgent: string;
  platform: string;
}

const initialBrowserDiagnostics: BrowserDiagnostics = { userAgent: "Unavailable", platform: "Unavailable" };

function formatValue(value: number | null, suffix = "", digits = 2): string {
  return value === null || !Number.isFinite(value) ? "Unavailable" : `${value.toFixed(digits)}${suffix}`;
}

async function copyPlainText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

export function DiagnosticsPanel({ diagnostics, onClose }: { diagnostics: AudioDiagnostics; onClose: () => void }) {
  const [browser, setBrowser] = useState<BrowserDiagnostics>(initialBrowserDiagnostics);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBrowser({ userAgent: navigator.userAgent || "Unavailable", platform: navigator.platform || "Unavailable" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const plainText = useMemo(() => formatAudioDiagnosticsText(browser, diagnostics), [browser, diagnostics]);

  const copy = async () => {
    try {
      await copyPlainText(plainText);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <section className="practice-diagnostics" aria-labelledby="diagnostics-title">
      <div className="practice-diagnostics-heading">
        <div>
          <strong id="diagnostics-title">Diagnostics</strong>
          <p className="muted">Read-only browser and microphone details for alpha bug reports.</p>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <dl className="practice-diagnostics-grid">
        <div><dt>User agent</dt><dd>{browser.userAgent}</dd></div>
        <div><dt>Platform</dt><dd>{browser.platform}</dd></div>
        <div><dt>Microphone</dt><dd>{diagnostics.microphoneLabel}</dd></div>
        <div><dt>AudioContext sample rate</dt><dd>{formatValue(diagnostics.sampleRate, " Hz", 0)}</dd></div>
        <div><dt>AudioWorklet</dt><dd>{diagnostics.audioWorklet}</dd></div>
        <div><dt>Base latency</dt><dd>{formatValue(diagnostics.baseLatency === null ? null : diagnostics.baseLatency * 1000, " ms")}</dd></div>
        <div><dt>Output latency</dt><dd>{formatValue(diagnostics.outputLatency === null ? null : diagnostics.outputLatency * 1000, " ms")}</dd></div>
        <div><dt>Current RMS</dt><dd>{formatValue(diagnostics.currentRms, "", 5)}</dd></div>
        <div><dt>YIN confidence</dt><dd>{formatValue(diagnostics.yinConfidence, "", 3)}</dd></div>
        <div><dt>Sound detected</dt><dd>{diagnostics.soundDetected ? "true" : "false"}</dd></div>
        <div><dt>Pitch detected</dt><dd>{diagnostics.pitchDetected ? "true" : "false"}</dd></div>
        <div><dt>Frequency</dt><dd>{formatValue(diagnostics.frequency, " Hz")}</dd></div>
        <div><dt>Note</dt><dd>{diagnostics.pitch ? `${diagnostics.pitch.noteName}${diagnostics.pitch.octave}` : "Unavailable"}</dd></div>
      </dl>
      <div className="practice-diagnostics-actions">
        <button type="button" onClick={copy}>Copy diagnostics</button>
        {copyState === "copied" && <span role="status">Copied</span>}
        {copyState === "error" && <span role="status" className="practice-error">Clipboard access is unavailable.</span>}
      </div>
      <p className="muted">Headphones are recommended for baseline testing. Microphone audio is processed locally and recordings are not stored. Allow microphone permission and test in a quiet room where practical.</p>
    </section>
  );
}
