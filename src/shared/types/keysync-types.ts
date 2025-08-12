/**
 * Supported audio formats
 * @enum {string}
 */
export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'flac';

/**
 * Options for audio conversion
 * @interface
 */
export interface AudioConversionOptions {
    sampleRate?: number;
    bitDepth?: number;
    channels?: number;
    quality?: number;
    outputFile?: string;
};

/**
 * Decoded audio data structure
 * @interface
 */
export interface AudioData {
    sampleRate: number;
    channelData: Float32Array[];
    numChannels: number;
    duration: number;
    bitDepth: number;
};

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