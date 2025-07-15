import { strict } from "assert";

export interface EncodeOptions {
    sampleRate: number;
    bitDepth?: number;
    channels?: number;
    quality?: number;
};

export interface AudioEncoderBase {
    encode(channelData: Float32Array[], options: EncodeOptions): Promise<Buffer>;
};

export class WavEncoder implements AudioEncoderBase {
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
    const clamped = Math.max(-0.999969482421875, Math.min(0.999969482421875, sample));

    switch(bitDepth){
        case 8:
            buffer.writeUint8(Math.floor((clamped + 1) * 127.5), offset);
        break;
        case 16:
            buffer.writeUint16LE(Math.floor(clamped * 32767), offset);
        break;
        case 24:
            buffer.writeIntLE(
                Math.floor(clamped * 8388607),
                offset,
                3
            );
        break;
        case 32:
            buffer.writeFloatLE(clamped, offset);
        break;
    }
}