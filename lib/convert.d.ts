/**
 * Supported audio formats
 * @enum {string}
 */
export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'flac';
/**
 * Options for audio conversion
 * @interface
 */
export interface AudioConversionOptions {
    sampleRate?: number;
    bitDepth?: number;
    channels?: number;
    quality?: number;
    outputFile?: string;
}
/**
 * Decoded audio data structure
 * @interface
 */
export interface AudioData {
    sampleRate: number;
    channelData: Float32Array[];
    numChannels: number;
    duration: number;
    bitDepth: number;
}
/**
 * Decodes audio data from various formats into standardized PCM format
 * @param {Buffer} buffer - Input audio data buffer
 * @param {AudioFormat} format - Source audio format
 * @returns {Promise<AudioData>} Decoded audio data
 * @throws {Error} When unsupported format is provided or decoding fails
 * @example
 * const audioData = await decodeAudio(fileBuffer, 'mp3');
 */
export declare function decodeAudio(buffer: Buffer, format: AudioFormat): Promise<AudioData>;
