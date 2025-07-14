import { parentPort, workerData } from "worker_threads";
import { decodePcmData, findChunk } from "../audio-utils";
import { AudioData } from "../convert";

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

    return{
        sampleRate,
        numChannels,
        channelData,
        duration: dataSize / (sampleRate * numChannels * (bitDepth / 8)),
        bitDepth
    }
}

try{
    const result = decodeWav(workerData.buffer);
    parentPort?.postMessage({ result });
}catch(err){
    parentPort?.postMessage({ error: err instanceof Error ? err.message : String(err) });
}