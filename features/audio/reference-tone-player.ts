import { midiToFrequency, noteToMidi } from "@/features/audio/note-converter";

export class ReferenceTonePlayer {
  private context: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;

  async unlock(): Promise<void> {
    const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error("Web Audio is unavailable in this browser.");
    this.context ??= new AudioContextConstructor();
    if (this.context.state === "suspended") await this.context.resume();
  }

  play(note: string, duration = 1.2, volume = .18): void {
    if (!this.context) { void this.unlock().then(() => this.play(note, duration, volume)); return; }
    this.oscillator?.stop();
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    this.oscillator = oscillator;
    oscillator.type = "triangle";
    oscillator.frequency.value = midiToFrequency(noteToMidi(note));
    gain.gain.setValueAtTime(.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, this.context.currentTime + .03);
    gain.gain.exponentialRampToValueAtTime(.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.onended = () => { if (this.oscillator === oscillator) this.oscillator = null; };
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration + .05);
  }

  stop(): void { this.oscillator?.stop(); this.oscillator = null; void this.context?.close(); this.context = null; }
}
