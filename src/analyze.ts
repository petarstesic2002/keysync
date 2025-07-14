import { Essentia } from 'essentia.js';
import { decode } from 'wav-decoder';
import EssentiaWASM from 'essentia.js/dist/essentia-wasm.es.js';

export interface AnalysisResult {
    bpm: number | null;
    key: string | null;
    scale: 'major' | 'minor' | null;
    confidence?: number;
};

let essentiaInstance: Essentia | null = null;

async function initEssentia(): Promise<Essentia> {
    if(essentiaInstance)
        return essentiaInstance;
    try{
        const wasmInstance = await EssentiaWASM;
        essentiaInstance = new Essentia(wasmInstance);
        return essentiaInstance;
    } catch(err){
        console.error('Failed to initialize Essentia:', err);
        throw err;
    }
}

/**
 * Clean up Essentia resources
 */
export function cleanupEssentia(): void{
    essentiaInstance?.shutdown();
    essentiaInstance = null;
}

/**
 * Analyze a WAV buffer and return BPM, key and scale
 * @param buffer Buffer<ArrayBufferLike>
 * @returns Promise<AnalysisResult>
 */
export async function analyzeAudioAsync(buffer: Buffer, chunkSize: number = 44100*30): Promise<AnalysisResult> {
    const decoded = await decode(buffer);
    const audio = decoded.channelData[0];

    const result: AnalysisResult = {
        bpm: null,
        key: null,
        scale: null
    };

    try{
        const essentia = await initEssentia();
        for(let i = 0; i < audio.length; i += chunkSize){
            const chunk = audio.slice(i, Math.min(i+chunkSize, audio.length));
            const chunkBuffer = new Float32Array(chunk);
            const vectorFloat = essentia.arrayToVector(chunkBuffer);

            if(!result.bpm){
                const rhythm = essentia.RhythmExtractor2013(vectorFloat);
                result.bpm = rhythm.bpm
            }
            const keyInfo = essentia.KeyExtractor(
                vectorFloat, // Float32Array
                true, // Apply detuning correction
                4096, // Frame size
                2048, // Hop size
                36, // HPCP size
                5000, // Max frequency (ignore very high frequencies)
                60, // Maximum spectral peaks to consider
                40, // Min frequency
                0.2, // HPCP threshold
                'krumhansl', // Profile type
                44100, // Sample rate
                0.001, // Spectral peaks threshold
                440, // Reference tuning frequency
                'cosine', // Weighting type for peak frequencies
                'hann' // Window type
            );
            if(!result.key || (keyInfo.strength >  (result.confidence ?? 0))){
                result.key = keyInfo.key.split(' ')[0];
                result.scale = keyInfo.scale.toLowerCase() as 'major' | 'minor';
                result.confidence = keyInfo.strength;
            }
        }
    } catch(err) {
        console.warn('Failed to analyze audio:', err);
    }
    return result;
}