import EssentiaModule from 'essentia.js/dist/essentia-wasm.module.js';
import EssentiaWASM from 'essentia.js/dist/essentia-wasm.wasm';
import {decode} from 'wav-decoder';

const Essentia = EssentiaModule.default ?? EssentiaModule;
const essentia = new Essentia(EssentiaWASM);

export interface AnalysisResult {
    bpm: number | null;
    key: string | null;
    scale: 'major' | 'minor' | null;
};

/**
 * Analyze a WAV buffer and return BPM, key and scale
 */
export async function analyzeAudioAsync(buffer: Buffer): Promise<AnalysisResult> {
    const decoded = await decode(buffer);
    const audio = decoded.channelData[0];
    const result: AnalysisResult = {
        bpm: null,
        key: null,
        scale: null
    };

    try{
        const rhythm = essentia.RhythmExtractor2013(audio, 44100);
        const keyInfo = essentia.KeyExtractor(audio, 44100);

        result.bpm = rhythm.bpm ?? null;
        result.key = keyInfo.key ?? null;
        result.scale = keyInfo.scale ?? null;
    } catch(err) {
        console.warn('Failed to analyze audio:', err);
    }
    return result;
}