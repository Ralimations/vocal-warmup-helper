import type { PitchDetectionResult } from "@/types/domain";

function frequencyDeltaCents(frequency: number, referenceFrequency: number): number {
  return 1200 * Math.log2(frequency / referenceFrequency);
}

export interface IPitchDetector { detect(samples: Float32Array, sampleRate: number): PitchDetectionResult | null; }

export const MIN_STABLE_VOICED_FRAMES = 3;
export const MAX_STABLE_FREQUENCY_DELTA_CENTS = 50;
export const MIN_PERIODICITY_CONFIDENCE = 0.75;

/** Replaceable YIN-style detector with a short periodic-signal debounce. */
export class YinPitchDetector implements IPitchDetector {
  private voicedCandidates: PitchDetectionResult[] = [];

  constructor(private readonly threshold = .14) {}

  detect(samples: Float32Array, sampleRate: number): PitchDetectionResult | null {
    const candidate = this.detectCandidate(samples, sampleRate);
    if (!candidate) {
      this.voicedCandidates = [];
      return null;
    }

    const previous = this.voicedCandidates.at(-1);
    if (previous && Math.abs(frequencyDeltaCents(candidate.frequency, previous.frequency)) > MAX_STABLE_FREQUENCY_DELTA_CENTS) this.voicedCandidates = [];
    this.voicedCandidates.push(candidate);
    this.voicedCandidates = this.voicedCandidates.slice(-MIN_STABLE_VOICED_FRAMES);
    if (this.voicedCandidates.length < MIN_STABLE_VOICED_FRAMES) return null;

    return {
      frequency: this.voicedCandidates.reduce((total, frame) => total + frame.frequency, 0) / this.voicedCandidates.length,
      confidence: this.voicedCandidates.reduce((total, frame) => total + frame.confidence, 0) / this.voicedCandidates.length,
      amplitude: this.voicedCandidates.reduce((total, frame) => total + frame.amplitude, 0) / this.voicedCandidates.length,
    };
  }

  private detectCandidate(samples: Float32Array, sampleRate: number): PitchDetectionResult | null {
    let amplitude = 0; for (const sample of samples) amplitude += sample * sample; amplitude = Math.sqrt(amplitude / samples.length);
    if (amplitude < .005) return null;
    const size = Math.floor(samples.length / 2); const difference = new Float32Array(size);
    for (let tau = 1; tau < size; tau++) { let sum = 0; for (let i = 0; i < size; i++) { const delta = samples[i] - samples[i + tau]; sum += delta * delta; } difference[tau] = sum; }
    const normalized = new Float32Array(size); let running = 0; normalized[0] = 1;
    for (let tau = 1; tau < size; tau++) { running += difference[tau]; normalized[tau] = difference[tau] * tau / Math.max(running, Number.EPSILON); }
    let tau = 2; while (tau < size && normalized[tau] > this.threshold) tau++; if (tau >= size - 1) return null;
    while (tau + 1 < size && normalized[tau + 1] < normalized[tau]) tau++;
    const frequency = sampleRate / tau; if (frequency < 70 || frequency > 1000) return null;
    const confidence = Math.max(0, Math.min(1, 1 - normalized[tau]));
    if (confidence < MIN_PERIODICITY_CONFIDENCE) return null;
    return { frequency, confidence, amplitude };
  }
}
