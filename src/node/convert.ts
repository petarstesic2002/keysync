import decode from 'audio-decode';
import { Worker } from 'worker_threads';
import path from 'path';
import { AudioFormat, AudioData } from '../shared/types/keysync-types';
import { decodeAudioBrowserAsync } from '../browser/convert';

/**
 * Decodes audio data from various formats into standardized PCM format
 * @param {Buffer} buffer - Input audio data buffer
 * @param {AudioFormat} format - Source audio format
 * @returns {Promise<AudioData>} Decoded audio data
 * @throws {Error} When unsupported format is provided or decoding fails
 * @example
 * const audioData = await decodeAudioAsync(fileBuffer, 'mp3');
 */
export async function decodeAudioNodeAsync(
    buffer: Buffer,
    format: AudioFormat
): Promise<AudioData> {
    switch(format){
        case 'wav':
            return await decodeWavAsync(buffer);
        case 'mp3':
        case 'flac':
        case 'ogg':
            return await decodeAudioBrowserAsync(
                buffer.buffer.slice(
                    buffer.byteOffset,
                    buffer.byteOffset + buffer.byteLength
                ),
                format
            );
        default:
            throw new Error(`Unsupported audio format: ${format}`);
    }
}

/**
 * Decodes WAV files using a worker thread for better performance
 * @private
 * @param {Buffer} buffer - WAV file data buffer
 * @returns {Promise<AudioData>} Decoded audio data
 * @throws {Error} When worker fails or WAV decoding fails
 */
async function decodeWavAsync(buffer: Buffer): Promise<AudioData>{
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            path.join(__dirname, 'wav-decoder-worker.ts'), 
            { 
                workerData: {
                    buffer: buffer.buffer,
                },
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