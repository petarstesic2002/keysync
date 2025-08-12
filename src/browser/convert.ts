import decode from 'audio-decode';
import { AudioData, AudioFormat } from '../shared/types/keysync-types';

export async function decodeAudioBrowserAsync(buffer: ArrayBuffer, format: AudioFormat): Promise<AudioData> {
    try {
        const audioBuffer: AudioBuffer = await decode(buffer);
        const channelData:  Float32Array[] = [];
        for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
            channelData.push(audioBuffer.getChannelData(c));
        }

        return {
            sampleRate: audioBuffer.sampleRate,
            channelData: channelData,
            numChannels: audioBuffer.numberOfChannels,
            duration: audioBuffer.duration,
            bitDepth: 32
        };
    } catch (err) {
        throw new Error(`Audio decoding failed: ${err instanceof Error ? err.message : String(err)}`);
    }
}