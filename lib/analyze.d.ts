import { AudioFormat } from './convert';
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
    roundedBpm: number | null;
    key: string | null;
    scale: 'major' | 'minor' | null;
    confidence?: number;
}
/**
 * Cleans up Essentia resources and releases WebAssembly memory.
 * Must be called after analysis to avoid memory leaks
 *
 * @example
 * await analyzeAudioAsync(buffer);
 * cleanupEssentia();
 */
export declare function cleanupEssentia(): void;
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
export declare function analyzeAudioAsync(buffer: NonSharedBuffer, format: AudioFormat, chunkSize?: number): Promise<AnalysisResult>;
