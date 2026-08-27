import type { MicrophoneStatus } from "@/types/domain";

export class MicrophoneManager {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  async start(): Promise<{ analyser: AnalyserNode; context: AudioContext; source: MediaStreamAudioSourceNode }> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone is unavailable in this browser.");
    this.stop();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("Web Audio is unavailable in this browser.");
      this.context = new AudioContextConstructor();
      if (this.context.state === "suspended") await this.context.resume();
      this.source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source.connect(this.analyser);
      return { analyser: this.analyser, context: this.context, source: this.source };
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  stop(): void { this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null; this.source?.disconnect(); this.source = null; this.analyser?.disconnect(); this.analyser = null; void this.context?.close(); this.context = null; }
  get status(): MicrophoneStatus { if (!this.stream) return "idle"; return this.stream.active ? "active" : "error"; }
}
