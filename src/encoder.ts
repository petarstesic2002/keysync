import { strict } from "assert";

export interface EncodeOptions {
    sampleRate: number;
    bitDepth?: number;
    channels?: number;
    quality?: number;
};

export interface AudioEncoder {
    encode(channelData: Float32Array[], options: EncodeOptions): Promise<Buffer>;
};

export class WavEncoder implements AudioEncoder {
    async encode(channelData: Float32Array[], options: EncodeOptions): Promise<Buffer> {
        const { sampleRate, bitDepth = 16, channels = channelData.length } = options;
        const samples = channelData[0].length;
        const blockAlign = channels * (bitDepth / 8);
        const byteRate = sampleRate * blockAlign;
        const dataSize = samples * blockAlign;

        const buffer = Buffer.alloc(44 + dataSize);

        buffer.write('RIFF', 0);
        buffer.writeUint32LE(36 + dataSize, 4);
        buffer.write('WAVE', 8);
        buffer.write('fmt ', 12);
        buffer.writeUint32LE(16, 16);
        buffer.writeUint16LE(1, 20);
        buffer.writeUint16LE(channels, 22);
        buffer.writeUint32LE(sampleRate, 24);
        buffer.writeUint32LE(byteRate, 28);
        buffer.writeUint16LE(blockAlign, 32);
        buffer.writeUint16LE(bitDepth, 34);
        buffer.write('data', 36);
        buffer.writeUint32LE(dataSize, 40);

        const bytesPerSample = bitDepth / 8;
        for(let i = 0; i < samples; i++){
            for(let c = 0; c < channels; c++){
                const sample = channelData[c][i];
                const offset = 44 + (i * channels + c) * bytesPerSample;
                writeSample(buffer, sample, offset, bitDepth);
            }
        }
        return buffer;
    }
}

function writeSample(buffer: Buffer, sample: number, offset: number, bitDepth: number): void {
    const scaled = Math.max(-1, Math.min(1, sample)); // Clamp to [-1, 1]

    switch(bitDepth){
        case 8:
            buffer.writeUint8(Math.floor((scaled + 1) * 127.5), offset);
        break;
        case 16:
            buffer.writeUint16LE(Math.floor(scaled * 32767), offset);
        break;
        case 24:
            buffer.writeIntLE(
                Math.floor(scaled * 8388607),
                offset,
                3
            );
        break;
        case 32:
            buffer.writeFloatLE(scaled, offset);
        break;
    }
}