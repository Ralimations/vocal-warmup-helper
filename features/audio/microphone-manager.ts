import type { MicrophoneStatus } from "@/types/domain";

export class MicrophoneManager {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  async start(): Promise<{ analyser: AnalyserNode; context: AudioContext }> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone is unavailable in this browser.");
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
    this.context = new AudioContext(); const source = this.context.createMediaStreamSource(this.stream); this.analyser = this.context.createAnalyser(); this.analyser.fftSize = 2048; source.connect(this.analyser); return { analyser: this.analyser, context: this.context };
  }
  stop(): void { this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null; this.analyser?.disconnect(); this.analyser = null; void this.context?.close(); this.context = null; }
  get status(): MicrophoneStatus { if (!this.stream) return "idle"; return this.stream.active ? "active" : "error"; }
}
