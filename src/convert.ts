import decode from 'audio-decode';
import { Worker } from 'worker_threads';
import path from 'path';

/**
 * Supported audio formats
 */
export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'flac';

/**
 * Options for audio conversion
 */
export interface AudioConversionOptions {
    sampleRate?: number;
    bitDepth?: number;
    channels?: number;
    quality?: number;
    outputFile?: string;
};

export interface AudioData {
    sampleRate: number;
    channelData: Float32Array[];
    numChannels: number;
    duration: number;
    bitDepth: number;
};

export async function decodeAudio(
    buffer: Buffer,
    format: AudioFormat
): Promise<AudioData> {
    switch(format){
        case 'wav':
            return await decodeWavAsync(buffer);
        case 'mp3':
        case 'flac':
        case 'ogg':
            return await decodeToCommonFormatAsync(buffer);
        default:
            throw new Error(`Unsupported audio format: ${format}`);
    }
}

async function decodeToCommonFormatAsync(buffer: Buffer): Promise<AudioData> {
    try{
        const arrBuffer: ArrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
        );
        const audioBuffer = await decode(arrBuffer);
        
        const channelData: Float32Array[] = [];
        for(let c = 0; c < audioBuffer.numberOfChannels; c++)
            channelData.push(audioBuffer.getChannelData(0));

        return{
            sampleRate: audioBuffer.sampleRate,
            channelData,
            numChannels: audioBuffer.numberOfChannels,
            duration: audioBuffer.duration,
            bitDepth: 32
        };
    } catch(err){
        throw new Error(`MP3 decoding failed: ${err instanceof Error ? err.message : String(err)}`);
    }
}

async function decodeWavAsync(buffer: Buffer): Promise<AudioData>{
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            path.join(__dirname, 'wav-decoder-worker.ts'), 
            { 
                workerData: { buffer },
                transferList: [buffer.buffer]
            }
        );

        worker.on('message', (message) => {
            if(message.error){
                reject(new Error(message.error));
            }else{
                resolve(message.result);
            }
            worker.terminate();
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
            if(code !== 0)
                reject(new Error(`Worker stopped with the exit code ${code}`));
        });
    });
}