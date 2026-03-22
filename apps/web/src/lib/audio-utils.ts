export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private workletModuleUrl: string | null = null;
  public input: MediaStreamAudioSourceNode | null = null;
  private onDataAvailable: (data: ArrayBuffer) => void;
  private onVolumeChange: ((volume: number) => void) | null = null;

  constructor(
    onDataAvailable: (data: ArrayBuffer) => void,
    onVolumeChange?: (volume: number) => void
  ) {
    this.onDataAvailable = onDataAvailable;
    this.onVolumeChange = onVolumeChange || null;
  }

  async start() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.input = this.audioContext.createMediaStreamSource(this.mediaStream);

      if (this.audioContext.audioWorklet) {
        this.workletModuleUrl = this.createWorkletModuleUrl();
        await this.audioContext.audioWorklet.addModule(this.workletModuleUrl);

        this.workletNode = new AudioWorkletNode(this.audioContext, "orbis-recorder-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1,
        });

        this.workletNode.port.onmessage = (event) => {
          const payload = event.data as { pcm?: ArrayBuffer; rms?: number };
          if (typeof payload.rms === "number" && this.onVolumeChange) {
            this.onVolumeChange(payload.rms);
          }
          if (payload.pcm) {
            this.onDataAvailable(payload.pcm);
          }
        };

        this.input.connect(this.workletNode);
        this.workletNode.connect(this.audioContext.destination);
        return;
      }

      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.emitAudioFrame(inputData);
      };

      this.input.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      throw error;
    }
  }

  private emitAudioFrame(inputData: Float32Array) {
    if (this.onVolumeChange) {
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.onVolumeChange(rms);
    }

    const pcmData = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.onDataAvailable(pcmData.buffer);
  }

  private createWorkletModuleUrl(): string {
    const code = `
class OrbisRecorderProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0] && inputs[0][0];
    const output = outputs[0] && outputs[0][0];

    if (output) {
      output.fill(0);
    }

    if (!input) {
      return true;
    }

    let sum = 0;
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      sum += sample * sample;
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    const rms = Math.sqrt(sum / input.length);
    this.port.postMessage({ pcm: pcm.buffer, rms }, [pcm.buffer]);
    return true;
  }
}

registerProcessor('orbis-recorder-processor', OrbisRecorderProcessor);
`;

    return URL.createObjectURL(new Blob([code], { type: "application/javascript" }));
  }

  stop() {
    if (this.processor && this.input) {
      this.input.disconnect();
      this.processor.disconnect();
    }
    if (this.workletNode && this.input) {
      this.input.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode.disconnect();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.workletModuleUrl) {
      URL.revokeObjectURL(this.workletModuleUrl);
    }
    this.processor = null;
    this.workletNode = null;
    this.workletModuleUrl = null;
    this.input = null;
    this.mediaStream = null;
    this.audioContext = null;
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private scheduledTime = 0;

  constructor() {}

  async init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async play(data: ArrayBuffer) {
    if (!this.audioContext) {
      await this.init();
    }

    // Convert PCM16 to Float32
    const pcmData = new Int16Array(data);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0;
    }

    const buffer = this.audioContext!.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);

    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);

    const currentTime = this.audioContext!.currentTime;
    if (this.scheduledTime < currentTime) {
      this.scheduledTime = currentTime;
    }

    source.start(this.scheduledTime);
    this.scheduledTime += buffer.duration;
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.scheduledTime = 0;
  }
}
