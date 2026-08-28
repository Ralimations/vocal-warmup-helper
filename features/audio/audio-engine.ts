import { frequencyToPitchFrame } from "@/features/audio/note-converter";
import { MicrophoneManager } from "@/features/audio/microphone-manager";
import { calculateRms, SoundActivityTracker, YinPitchDetector } from "@/features/audio/pitch-detector";
import type { PitchFrame } from "@/types/domain";

export interface AudioObservation {
  frame: PitchFrame | null;
  soundDetected: boolean;
  amplitude: number;
}

export class AudioEngine {
  private readonly microphone = new MicrophoneManager(); private readonly detector = new YinPitchDetector(); private readonly activity = new SoundActivityTracker(); private frameId: number | null = null; private worklet: AudioWorkletNode | null = null; private workletSink: GainNode | null = null;
  async start(onObservation: (observation: AudioObservation) => void): Promise<void> {
    if (this.frameId !== null || this.worklet !== null) throw new Error("Audio engine is already running.");
    this.activity.reset();
    const { analyser, context, source } = await this.microphone.start();
    const processSamples = (samples: Float32Array, timestamp: number) => { const amplitude = calculateRms(samples); const result = this.detector.detect(samples, context.sampleRate); onObservation({ frame: result ? frequencyToPitchFrame(result.frequency, result.confidence, result.amplitude, timestamp) : null, soundDetected: this.activity.update(amplitude), amplitude }); };
    if (context.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      try {
        await context.audioWorklet.addModule("/worklets/pitch.worklet.js");
        this.worklet = new AudioWorkletNode(context, "pitch-worklet");
        this.worklet.port.onmessage = (event: MessageEvent<Float32Array>) => processSamples(event.data, performance.now());
        this.workletSink = context.createGain();
        this.workletSink.gain.value = 0;
        source.connect(this.worklet).connect(this.workletSink).connect(context.destination);
        return;
      } catch {
        this.worklet?.disconnect();
        this.worklet = null;
        this.workletSink?.disconnect();
        this.workletSink = null;
      }
    }
    const samples = new Float32Array(analyser.fftSize); let lastFrame = 0;
    const tick = (time: number) => { if (time - lastFrame >= 33) { analyser.getFloatTimeDomainData(samples); processSamples(samples, time); lastFrame = time; } this.frameId = requestAnimationFrame(tick); };
    this.frameId = requestAnimationFrame(tick);
  }
  stop(): void { if (this.frameId !== null) cancelAnimationFrame(this.frameId); this.frameId = null; this.worklet?.port.close(); this.worklet?.disconnect(); this.worklet = null; this.workletSink?.disconnect(); this.workletSink = null; this.microphone.stop(); }
}
