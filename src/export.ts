import fs from 'fs/promises';
import path from 'path';
import { getEncoder } from './encoder-factory';
import type { AudioData } from './convert';

export interface ExportOptions{
    format?: 'wav' | 'mp3' | 'ogg' | 'flac';
    bitDepth?: number;
    quality?: number;
    channels?: number;
};

export async function exportAudioToFileAsync(
    audioData: AudioData,
    outputPath: string,
    options: ExportOptions
) : Promise<string> {
    const format = options.format || path.extname(outputPath.slice(1).toLowerCase() as 'wav' | 'mp3' | 'ogg');
    if(!['wav', 'mp3', 'ogg'].includes(format))
        throw new Error(`Unsupported format: ${format}`);
    const encoder = getEncoder(format as 'wav' | 'mp3' | 'ogg');
    const buffer = await encoder.encode(
        audioData.channelData,
        {
            sampleRate: audioData.sampleRate,
            bitDepth: options.bitDepth || audioData.bitDepth,
            channels: options.channels || audioData.numChannels,
            quality: options.quality || 80
        }
    );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}