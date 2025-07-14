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
    progressCallback?: (progress: number) => void;
};

interface AudioData {
    sampleRate: number;
    channelData: Float32Array[];
    numChannels: number;
    duration: number;
    bitDepth: number;
};

function decodeWav(buffer: Buffer): AudioData{
    if(buffer.toString('ascii', 0, 4) !== 'RIFF')
        throw new Error('Invalid WAV file: Missing RIFF header.');
    if(buffer.toString('ascii', 8, 12) !== 'WAVE')
        throw new Error('Invalid WAV file: Missing WAVE format.');

    const fmtChunkOffset = findChunk(buffer, 'fmt ');
    if(fmtChunkOffset === -1)
        throw new Error('Invalid WAV file: Missing fmt chunk.');
    
    const audioFormat = buffer.readUint16LE(fmtChunkOffset + 8);
    if(audioFormat !== 1)
        throw new Error('Only PCM (uncompressed) WAV files are supported.');

    const numChannels = buffer.readUint16LE(fmtChunkOffset + 10);
    const sampleRate = buffer.readUint32LE(fmtChunkOffset + 12);
    const bitDepth = buffer.readUint16LE(fmtChunkOffset + 22);
    
    const dataChunkOffset = findChunk(buffer, 'data');
    if(dataChunkOffset === -1)
        throw new Error('Invalid WAV file: Missing data chunk');
    
    const dataSize = buffer.readUint32LE(dataChunkOffset + 4);
    const start = dataChunkOffset + 8;

    const channelData = decodePcmData(
        buffer.subarray(start, start + dataSize),
        numChannels,
        bitDepth
    );

    return {
        sampleRate,
        numChannels,
        channelData,
        duration: dataSize / (sampleRate * numChannels * (bitDepth / 8)),
        bitDepth
    };
}

function findChunk(buffer: Buffer, chunkId: string): number{
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

function decodePcmData(
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

function readSample(buffer: Buffer, offset: number, bitDepth: number): number{
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