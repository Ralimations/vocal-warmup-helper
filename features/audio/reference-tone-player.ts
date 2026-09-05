import { midiToFrequency, noteToMidi } from "@/features/audio/note-converter";

const TONE_ATTACK_SECONDS = 0.04;
const TONE_RELEASE_SECONDS = 0.12;
const PIANO_DECAY_SECONDS = 1.8;

interface PianoVoice {
  note: string;
  oscillators: OscillatorNode[];
  output: GainNode;
}

export class ReferenceTonePlayer {
  private context: AudioContext | null = null;
  private voice: PianoVoice | null = null;

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
    if (this.voice?.note === note) {
      this.setVolume(volume);
      return;
    }
    this.stop();
    const now = this.context.currentTime;
    const frequency = midiToFrequency(noteToMidi(note));
    const output = this.context.createGain();
    const oscillators = [1, 2, 3].map((harmonic, index) => {
      const oscillator = this.context!.createOscillator();
      const partialGain = this.context!.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency * harmonic;
      partialGain.gain.setValueAtTime([1, 0.28, 0.11][index], now);
      oscillator.connect(partialGain);
      partialGain.connect(output);
      oscillator.start(now);
      oscillator.stop(now + PIANO_DECAY_SECONDS + TONE_RELEASE_SECONDS * 4);
      return oscillator;
    });
    const voice: PianoVoice = { note, oscillators, output };
    this.voice = voice;
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + TONE_ATTACK_SECONDS);
    output.gain.exponentialRampToValueAtTime(0.0001, now + PIANO_DECAY_SECONDS);
    output.connect(this.context.destination);
    oscillators[0].onended = () => {
      if (this.voice === voice) this.voice = null;
    };
  }

  replay(note: string, volume = 0.18): void {
    this.stop();
    this.start(note, volume);
  }

  setVolume(volume: number): void {
    if (!this.context || !this.voice) return;
    this.voice.output.gain.cancelScheduledValues(this.context.currentTime);
    this.voice.output.gain.setTargetAtTime(Math.max(0.0001, volume), this.context.currentTime, TONE_ATTACK_SECONDS);
    this.voice.output.gain.setTargetAtTime(0.0001, this.context.currentTime + 0.35, 0.45);
  }

  duck(): void {
    if (!this.context || !this.voice) return;
    this.voice.output.gain.cancelScheduledValues(this.context.currentTime);
    this.voice.output.gain.setTargetAtTime(0.0001, this.context.currentTime, TONE_RELEASE_SECONDS);
  }

  stop(): void {
    if (!this.context || !this.voice) return;
    const voice = this.voice;
    const context = this.context;
    voice.output.gain.cancelScheduledValues(context.currentTime);
    voice.output.gain.setTargetAtTime(0.0001, context.currentTime, TONE_RELEASE_SECONDS);
    this.voice = null;
    voice.oscillators.forEach((oscillator) => {
      try { oscillator.stop(context.currentTime + TONE_RELEASE_SECONDS * 4); } catch { /* Voice may already be stopping after its natural decay. */ }
    });
  }

  close(): void {
    this.stop();
    void this.context?.close();
    this.context = null;
  }
}
