import { frequencyToPitchFrame } from "@/features/audio/note-converter";
import { MicrophoneManager } from "@/features/audio/microphone-manager";
import { calculateRms, SoundActivityTracker, YinPitchDetector } from "@/features/audio/pitch-detector";
import { initialAudioDiagnostics, type AudioDiagnostics } from "@/features/audio/audio-diagnostics";
import type { PitchFrame } from "@/types/domain";

export interface AudioObservation {
  frame: PitchFrame | null;
  soundDetected: boolean;
  amplitude: number;
  diagnostics: AudioDiagnostics;
}

export class AudioEngine {
  private readonly microphone = new MicrophoneManager(); private readonly detector = new YinPitchDetector(); private readonly activity = new SoundActivityTracker(); private frameId: number | null = null; private worklet: AudioWorkletNode | null = null; private workletSink: GainNode | null = null; private diagnostics: AudioDiagnostics = { ...initialAudioDiagnostics };
  getDiagnostics(): AudioDiagnostics { return { ...this.diagnostics }; }
  async start(onObservation: (observation: AudioObservation) => void): Promise<void> {
    if (this.frameId !== null || this.worklet !== null) throw new Error("Audio engine is already running.");
    this.activity.reset();
    const { analyser, context, source, microphoneLabel } = await this.microphone.start();
    const contextWithLatency = context as AudioContext & { baseLatency?: number; outputLatency?: number };
    this.diagnostics = { ...initialAudioDiagnostics, microphoneLabel, sampleRate: context.sampleRate, baseLatency: contextWithLatency.baseLatency ?? null, outputLatency: contextWithLatency.outputLatency ?? null };
    const processSamples = (samples: Float32Array, timestamp: number) => {
      const amplitude = calculateRms(samples);
      const result = this.detector.detect(samples, context.sampleRate);
      const soundDetected = this.activity.update(amplitude);
      const frame = result ? frequencyToPitchFrame(result.frequency, result.confidence, result.amplitude, timestamp) : null;
      this.diagnostics = { ...this.diagnostics, currentRms: amplitude, yinConfidence: result?.confidence ?? this.detector.getLastConfidence(), soundDetected, pitchDetected: frame !== null, frequency: frame?.frequency ?? null, pitch: frame };
      onObservation({ frame, soundDetected, amplitude, diagnostics: this.getDiagnostics() });
    };
    if (context.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      try {
        await context.audioWorklet.addModule("/worklets/pitch.worklet.js");
        this.worklet = new AudioWorkletNode(context, "pitch-worklet");
        this.diagnostics = { ...this.diagnostics, audioWorklet: "active" };
        this.worklet.port.onmessage = (event: MessageEvent<Float32Array>) => processSamples(event.data, performance.now());
        this.workletSink = context.createGain();
        this.workletSink.gain.value = 0;
        source.connect(this.worklet).connect(this.workletSink).connect(context.destination);
        return;
      } catch {
        this.diagnostics = { ...this.diagnostics, audioWorklet: "fallback" };
        this.worklet?.disconnect();
        this.worklet = null;
        this.workletSink?.disconnect();
        this.workletSink = null;
      }
    } else {
      this.diagnostics = { ...this.diagnostics, audioWorklet: "unsupported" };
    }
    const samples = new Float32Array(analyser.fftSize); let lastFrame = 0;
    const tick = (time: number) => { if (time - lastFrame >= 33) { analyser.getFloatTimeDomainData(samples); processSamples(samples, time); lastFrame = time; } this.frameId = requestAnimationFrame(tick); };
    this.frameId = requestAnimationFrame(tick);
  }
  stop(): void { if (this.frameId !== null) cancelAnimationFrame(this.frameId); this.frameId = null; this.worklet?.port.close(); this.worklet?.disconnect(); this.worklet = null; this.workletSink?.disconnect(); this.workletSink = null; this.microphone.stop(); }
}
