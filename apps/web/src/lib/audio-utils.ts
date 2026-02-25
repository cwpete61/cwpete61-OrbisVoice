import { useEffect, useRef } from 'react';

export class AudioRecorder {
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    public input: MediaStreamAudioSourceNode | null = null;
    private onDataAvailable: (data: ArrayBuffer) => void;
    private onVolumeChange: ((volume: number) => void) | null = null;

    constructor(onDataAvailable: (data: ArrayBuffer) => void, onVolumeChange?: (volume: number) => void) {
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
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Calculate volume
                if (this.onVolumeChange) {
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) {
                        sum += inputData[i] * inputData[i];
                    }
                    const rms = Math.sqrt(sum / inputData.length);
                    this.onVolumeChange(rms);
                }

                // Convert float32 to int16 PCM
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                this.onDataAvailable(pcmData.buffer);
            };

            this.input.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
        } catch (error) {
            console.error('Error starting audio recording:', error);
            throw error;
        }
    }

    stop() {
        if (this.processor && this.input) {
            this.input.disconnect();
            this.processor.disconnect();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.processor = null;
        this.input = null;
        this.mediaStream = null;
        this.audioContext = null;
    }
}

export class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private scheduledTime = 0;

    constructor() { }

    async init() {
        if (!this.audioContext) {
            this.audioContext = new AudioContext({ sampleRate: 24000 });
        }
        if (this.audioContext.state === 'suspended') {
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
