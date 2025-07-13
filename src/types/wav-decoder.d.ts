declare module 'wav-decoder' {
    export function decode(buffer: Buffer | ArrayBuffer): Promise<{
        sampleRate: number;
        channelData: Float32Array[];
        length: number;
    }>;
}