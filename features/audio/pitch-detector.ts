import type { PitchDetectionResult } from "@/types/domain";

export interface IPitchDetector { detect(samples: Float32Array, sampleRate: number): PitchDetectionResult | null; }

/** Replaceable YIN-style detector. It ignores low-confidence and near-silence frames. */
export class YinPitchDetector implements IPitchDetector {
  constructor(private readonly threshold = .14) {}
  detect(samples: Float32Array, sampleRate: number): PitchDetectionResult | null {
    let amplitude = 0; for (const sample of samples) amplitude += sample * sample; amplitude = Math.sqrt(amplitude / samples.length);
    if (amplitude < .01) return null;
    const size = Math.floor(samples.length / 2); const difference = new Float32Array(size);
    for (let tau = 1; tau < size; tau++) { let sum = 0; for (let i = 0; i < size; i++) { const delta = samples[i] - samples[i + tau]; sum += delta * delta; } difference[tau] = sum; }
    const normalized = new Float32Array(size); let running = 0; normalized[0] = 1;
    for (let tau = 1; tau < size; tau++) { running += difference[tau]; normalized[tau] = difference[tau] * tau / Math.max(running, Number.EPSILON); }
    let tau = 2; while (tau < size && normalized[tau] > this.threshold) tau++; if (tau >= size - 1) return null;
    while (tau + 1 < size && normalized[tau + 1] < normalized[tau]) tau++;
    const frequency = sampleRate / tau; if (frequency < 70 || frequency > 1000) return null;
    return { frequency, confidence: Math.max(0, Math.min(1, 1 - normalized[tau])), amplitude };
  }
}
