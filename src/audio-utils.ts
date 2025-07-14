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