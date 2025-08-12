declare module 'essentia.js' {
  export class Essentia {
    constructor(wasmInstance: WebAssembly.Module);
    Spectrum(input: Float32Array | number[]): {
        spectrum: Float32Array,
        centroid: number
    };
    shutdown(): void;
    arrayToVector(inputArray: any): any;
    RhythmExtractor2013(
        signal: any,
        maxTempo?: number,
        method?: string,
        minTempo?: number
    ): {
        bpm: number,
        ticks: number[],
        confidence: number,
        estimates: number[]
    };
    KeyExtractor(
        audio: any,
        averageDetuningCorrection?: boolean,
        frameSize?: number,
        hopSize?: number,
        hpcpSize?: number,
        maxFrequency?: number,
        maximumSpectralPeaks?: number,
        minFrequency?: number,
        pcpThreshold?: number,
        profileType?: string,
        sampleRate?: number,
        spectralPeaksThreshold?: number,
        tuningFrequency?: number,
        weightType?: string,
        windowType?: string
    ): {
        key: string,
        scale: string,
        strength: number
    };
  }

  const EssentiaWASM: Promise<WebAssembly.Module>;
  export const EssentiaWASM;
}