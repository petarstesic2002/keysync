import { isBrowser } from "./environment";

import { AudioFormat, AudioData } from ".";

export async function decodeAudio(buffer: ArrayBuffer | Buffer<ArrayBufferLike>, format: AudioFormat): Promise<AudioData> {
    const method = await import('./browser/convert');
    if (!isBrowser){
        return await method.decodeAudioBrowserAsync(buffer, format);
    } else {

    }
}