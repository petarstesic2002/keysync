import { isBrowser } from "./shared/environment";

import { AudioFormat, AudioData } from "./node";

export async function decodeAudio(buffer: ArrayBuffer | Buffer<ArrayBufferLike>, format: AudioFormat): Promise<AudioData> {

    if (!isBrowser){
        const method = await import('./browser/convert');
        return await method.decodeAudioBrowserAsync(buffer, format);
    } else {
        const method = await import('./node/convert');
        return await method.decodeAudioNodeAsync(buffer as Buffer<ArrayBufferLike>, format);
    }
}