import decode from 'audio-decode';
import { Worker } from 'worker_threads';
import path from 'path';
import { AudioFormat, AudioData } from '../types/keysync-types';

/**
 * Decodes audio data from various formats into standardized PCM format
 * @param {Buffer} buffer - Input audio data buffer
 * @param {AudioFormat} format - Source audio format
 * @returns {Promise<AudioData>} Decoded audio data
 * @throws {Error} When unsupported format is provided or decoding fails
 * @example
 * const audioData = await decodeAudioAsync(fileBuffer, 'mp3');
 */
export async function decodeAudioAsync(
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

/**
 * Decodes compressed audio formats (MP3/FLAC/OGG) using Web Audio API compatible decoder
 * @private
 * @param {Buffer} buffer - Input audio buffer
 * @returns {Promise<AudioData>} Decoded audio data
 * @throws {Error} When decoding fails
 */
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