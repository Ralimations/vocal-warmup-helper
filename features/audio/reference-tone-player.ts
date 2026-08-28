import { midiToFrequency, noteToMidi } from "@/features/audio/note-converter";

const TONE_ATTACK_SECONDS = 0.04;
const TONE_RELEASE_SECONDS = 0.12;

export class ReferenceTonePlayer {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private currentNote: string | null = null;

  async unlock(): Promise<void> {
    const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error("Web Audio is unavailable in this browser.");
    this.context ??= new AudioContextConstructor();
    if (this.context.state === "suspended") await this.context.resume();
  }

  start(note: string, volume = 0.18): void {
    if (!this.context) {
      void this.unlock().then(() => this.start(note, volume));
      return;
    }
    if (this.currentNote === note && this.oscillator) {
      this.setVolume(volume);
      return;
    }
    this.stop();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    this.oscillator = oscillator;
    this.gain = gain;
    this.currentNote = note;
    oscillator.type = "triangle";
    oscillator.frequency.value = midiToFrequency(noteToMidi(note));
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), this.context.currentTime + TONE_ATTACK_SECONDS);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.onended = () => {
      if (this.oscillator === oscillator) {
        this.oscillator = null;
        this.gain = null;
        this.currentNote = null;
      }
    };
    oscillator.start();
  }

  setVolume(volume: number): void {
    if (!this.context || !this.gain) return;
    this.gain.gain.cancelScheduledValues(this.context.currentTime);
    this.gain.gain.setTargetAtTime(Math.max(0.0001, volume), this.context.currentTime, TONE_ATTACK_SECONDS);
  }

  duck(): void {
    if (!this.context || !this.gain) return;
    this.gain.gain.cancelScheduledValues(this.context.currentTime);
    this.gain.gain.setTargetAtTime(0.0001, this.context.currentTime, TONE_RELEASE_SECONDS);
  }

  stop(): void {
    if (!this.context || !this.oscillator) return;
    const oscillator = this.oscillator;
    const context = this.context;
    this.gain?.gain.cancelScheduledValues(context.currentTime);
    this.gain?.gain.setTargetAtTime(0.0001, context.currentTime, TONE_RELEASE_SECONDS);
    this.oscillator = null;
    this.gain = null;
    this.currentNote = null;
    oscillator.stop(context.currentTime + TONE_RELEASE_SECONDS * 4);
  }

  close(): void {
    this.stop();
    void this.context?.close();
    this.context = null;
  }
}
