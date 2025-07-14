import { describe, it, expect } from 'vitest';
import { analyzeAudioAsync } from '../src/analyze';

describe('analyzeAudio', () => {
  it('detects bpm, key, and scale for a WAV file', async () => {
    const buffer = generateTestWav();
    const result = await analyzeAudioAsync(buffer);
    expect(Number(result.bpm)).toBeGreaterThan(0);
    expect(result.key).toMatch(/^[A-G][#b]?$/);
    expect(['major', 'minor']).toContain(result.scale);
    console.log(result);
  });
});

/**
 * Generates a 2-second 440Hz sine wave as a WAV-formatted Buffer
 * @returns {Buffer} WAV audio buffer (44.1kHz, 16-bit, mono)
 */
function generateTestWav(): Buffer {
    // Audio parameters
    const duration = 2;
    const sampleRate = 44100;
    const numSamples = sampleRate * duration;
    const frequency = 440; // Hz

    // Create buffer (44 byte header + PCM data)
    const wavBuffer = Buffer.alloc(44 + numSamples * 2);

    // 1. Write WAV header
    // RIFF chunk descriptor
    wavBuffer.write('RIFF', 0);
    wavBuffer.writeUInt32LE(36 + numSamples * 2, 4); // File size - 8
    wavBuffer.write('WAVE', 8);
    
    // fmt sub-chunk
    wavBuffer.write('fmt ', 12);
    wavBuffer.writeUInt32LE(16, 16); // Subchunk size
    wavBuffer.writeUInt16LE(1, 20);  // PCM format
    wavBuffer.writeUInt16LE(1, 22);  // Mono
    wavBuffer.writeUInt32LE(sampleRate, 24);
    wavBuffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
    wavBuffer.writeUInt16LE(2, 32);  // Block align
    wavBuffer.writeUInt16LE(16, 34); // Bits per sample
    
    // data sub-chunk
    wavBuffer.write('data', 36);
    wavBuffer.writeUInt32LE(numSamples * 2, 40); // Data size

    // 2. Generate 440Hz sine wave PCM data
    for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate);
        const intSample = Math.floor(sample * 32767); // Convert to 16-bit signed
        wavBuffer.writeInt16LE(intSample, 44 + i * 2);
    }

    return wavBuffer;
}