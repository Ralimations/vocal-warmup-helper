import { frequencyToPitchFrame } from "@/features/audio/note-converter";
import { MicrophoneManager } from "@/features/audio/microphone-manager";
import { YinPitchDetector } from "@/features/audio/pitch-detector";
import type { PitchFrame } from "@/types/domain";

export class AudioEngine {
  private readonly microphone = new MicrophoneManager(); private readonly detector = new YinPitchDetector(); private frameId: number | null = null;
  async start(onPitch: (frame: PitchFrame | null) => void): Promise<void> { const { analyser, context } = await this.microphone.start(); const samples = new Float32Array(analyser.fftSize); let lastFrame = 0; const tick = (time: number) => { if (time - lastFrame >= 33) { analyser.getFloatTimeDomainData(samples); const result = this.detector.detect(samples, context.sampleRate); onPitch(result ? frequencyToPitchFrame(result.frequency, result.confidence, result.amplitude, time) : null); lastFrame = time; } this.frameId = requestAnimationFrame(tick); }; this.frameId = requestAnimationFrame(tick); }
  stop(): void { if (this.frameId !== null) cancelAnimationFrame(this.frameId); this.frameId = null; this.microphone.stop(); }
}
