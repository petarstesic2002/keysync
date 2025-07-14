import { AudioEncoderBase, WavEncoder } from "./encoder";

export function getEncoder(format: 'wav' | 'mp3' | 'flac' | 'ogg') : AudioEncoderBase {
    switch(format){
        case 'wav':
            return new WavEncoder();
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}