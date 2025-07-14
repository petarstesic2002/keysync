import { Essentia, EssentiaWASM } from 'essentia.js';
import { AudioFormat, decodeAudio } from './convert';

/**
 * Audio analysis result structure
 * @typedef {Object} AnalysisResult
 * @property {number|null} bpm - Precise BPM (float)
 * @property {number|null} roundedBpm - Rounded BPM (int)
 * @property {string|null} key - Detected musical key
 * @property {'major'|'minor'|null} scale - Detected musical scale
 * @property {number} [confidence] - Detection confidence (0 - 1)
 */
export interface AnalysisResult {
    bpm: number | null;
    roundedBpm: number | null
    key: string | null;
    scale: 'major' | 'minor' | null;
    confidence?: number;
};

let essentiaInstance: Essentia | null = null;

/**
 * Initializes and returns a singleton Essentia.js instance with WebAssembly backend
 * @returns {Promise<Essentia>} Initialized Essentia instance
 * @example
 * const essentia = await initEssentia();
 * const spectrum = essentia.Spectrum(audioData)
 */
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
 * Cleans up Essentia resources and releases WebAssembly memory. 
 * Must be called after analysis to avoid memory leaks
 * 
 * @example
 * await analyzeAudioAsync(buffer);
 * cleanupEssentia();
 */
export function cleanupEssentia(): void{
    essentiaInstance?.shutdown();
    (essentiaInstance as any).delete();
    essentiaInstance = null;
}

//TODO: make a function that converts audio to buffer
//TODO: make a function that converts other audio formats to wav

/**
 * Analyze a WAV audio buffer and extracts BPM, key and scale
 * @param {Buffer} buffer - Audio file buffer (WAV format recommended)
 * @param {number} chunkSize - Optional chunk size samples (default 1323000 / 30s at 44.1kHz)
 * @param {AudioFormat} format - Audio format that will be decoded (WAV, MP3, FLAC, OGG)
 * @returns {Promise<AnalysisResult>} Object containing:
 *  - bpm: Float precision BPM
 *  - roundedBpm: Integer rounded BPM
 *  - key: Detected musical key
 *  - scale: 'major' or 'minor'
 *  - confidence: Detection confidence score (0 - 1)
 * 
 * @example
 * const audioBuffer = await fs.readFile('track.wav');
 * const { roundedBpm, bpm, key, scale, confidence } = await analyzeAudioAsync(audioBuffer);
 */
export async function analyzeAudioAsync(buffer: Buffer, format: AudioFormat, chunkSize: number = 44100 * 30): Promise<AnalysisResult> {
    const decoded = await decodeAudio(buffer, format);
    const audio = decoded.channelData[0];

    const result: AnalysisResult = {
        roundedBpm: null,
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
                result.roundedBpm = Math.round(result.bpm);
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
        console.warn('Failed to analyze audio: ', err);
    } finally{
        cleanupEssentia();
    }
    return result;
}