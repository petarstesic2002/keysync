/**
 * Finds the offset of a specific chunk in a RIFF/WAV file buffer.
 * @param {Buffer} buffer - The buffer containing the RIFF/WAV file data.
 * @param {string} chunkId - The 4-character chunk ID to search for (e.g., 'fmt', 'data').
 * @returns {number} The byte offset of the chunk within the buffer, or -1 if not found.
 */
export function findChunk(buffer: Buffer, chunkId: string): number{
    let offset = 12;
    while(offset < buffer.length - 8){
        const currentChunkId = buffer.toString('ascii', offset, offset + 4);
        const chunkSize =   buffer.readUInt32LE(offset + 4);
        if(currentChunkId === chunkId)
            return offset;
        offset += 8 + chunkSize;
        if(chunkSize % 2 !== 0)
            offset++;
    }
    return -1;
}

/**
 * Decodes PCM audio data into separate Float32Arrays for each channel.
 * @param {Buffer} data - The buffer containing raw PCM audio data.
 * @param {number} numChannels - Number of audio channels (e.g., 1 for mono, 2 for stereo).
 * @param {number} bitDepth - Bit depth of the audio samples (8, 16, 24, or 32 bits).
 * @returns {Float32Array[]} An array of Float32Arrays, one per channel, with normalized samples (-1 to 1).
 */
export function decodePcmData(
    data: Buffer,
    numChannels: number,
    bitDepth: number
): Float32Array[] {
    const bytesPerSample = bitDepth / 8;
    const samples = data.length / (bytesPerSample * numChannels);

    const channels: Float32Array[] = [];
    for(let c = 0; c < numChannels; c++)
        channels.push(new Float32Array(samples));
    for(let i = 0; i < samples; i++){
        for(let c = 0; c < numChannels; c++){
            const offset = (i * numChannels + c) * bytesPerSample;
            channels[c][i] = readSample(data, offset, bitDepth);
        }
    }
    return channels;
}

/**
 * Reads and normalizes an audio sample from a buffer at a specific offset.
 * @param {Buffer} buffer - The buffer containing the audio data.
 * @param {number} offset - Byte offset to read from.
 * @param {number} bitDepth - Bit depth of the sample (8, 16, 24, or 32 bits).
 * @returns {number} Normalized sample value (-1 to 1 for 8/16/24-bit, full range for 32-bit).
 * @throws {Error} If the bit depth is unsupported.
 */
export function readSample(buffer: Buffer, offset: number, bitDepth: number): number{
    switch(bitDepth){
        case 8:
            return (buffer.readUint8(offset) - 128) / 128;
        case 16:
            return buffer.readUint16LE(offset) / 32768;
        case 24:
            return (
                (buffer.readUint8(offset + 2)) << 16
                | buffer.readUint16LE(offset)
            ) / 8388608;
        case 32:
            return buffer.readUint32LE(offset);
        default:
            throw new Error(`Unsupported bit depth: ${bitDepth}.`);
    }
}