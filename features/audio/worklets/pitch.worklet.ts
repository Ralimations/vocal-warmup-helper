class PitchWorkletProcessor extends AudioWorkletProcessor {
  private buffer: number[] = [];
  process(inputs: Float32Array[][]): boolean { const channel = inputs[0]?.[0]; if (!channel) return true; this.buffer.push(...channel); if (this.buffer.length >= 2048) { this.port.postMessage(new Float32Array(this.buffer.splice(0, 2048))); } return true; }
}
registerProcessor("pitch-worklet", PitchWorkletProcessor);
