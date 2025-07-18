/**
 * Finds the offset of a specific chunk in a RIFF/WAV file buffer.
 * @param {Buffer} buffer - The buffer containing the RIFF/WAV file data.
 * @param {string} chunkId - The 4-character chunk ID to search for (e.g., 'fmt', 'data').
 * @returns {number} The byte offset of the chunk within the buffer, or -1 if not found.
 */
export declare function findChunk(buffer: Buffer, chunkId: string): number;
/**
 * Decodes PCM audio data into separate Float32Arrays for each channel.
 * @param {Buffer} data - The buffer containing raw PCM audio data.
 * @param {number} numChannels - Number of audio channels (e.g., 1 for mono, 2 for stereo).
 * @param {number} bitDepth - Bit depth of the audio samples (8, 16, 24, or 32 bits).
 * @returns {Float32Array[]} An array of Float32Arrays, one per channel, with normalized samples (-1 to 1).
 */
export declare function decodePcmData(data: Buffer, numChannels: number, bitDepth: number): Float32Array[];
/**
 * Reads and normalizes an audio sample from a buffer at a specific offset.
 * @param {Buffer} buffer - The buffer containing the audio data.
 * @param {number} offset - Byte offset to read from.
 * @param {number} bitDepth - Bit depth of the sample (8, 16, 24, or 32 bits).
 * @returns {number} Normalized sample value (-1 to 1 for 8/16/24-bit, full range for 32-bit).
 * @throws {Error} If the bit depth is unsupported.
 */
export declare function readSample(buffer: Buffer, offset: number, bitDepth: number): number;
