class PitchWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    this.buffer.push(...channel);
    while (this.buffer.length >= 2048) {
      this.port.postMessage(new Float32Array(this.buffer.splice(0, 2048)));
    }
    return true;
  }
}

registerProcessor("pitch-worklet", PitchWorkletProcessor);
