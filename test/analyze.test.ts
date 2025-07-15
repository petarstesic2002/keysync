import { describe, it, expect } from 'vitest';
import { analyzeAudioAsync } from '../src/analyze';
import { exportAudioToFileAsync } from '../src/export';
import fs from 'fs';
import { decodeAudio } from '../src/convert';
import path from 'path';

describe('analyzeAudioAsync', () => {
  it('detects bpm, key, and scale for a WAV file', async () => {
    const buffer = generateMusicalTestWav();
    expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(buffer.toString('ascii', 8, 12)).toBe('WAVE');
    const result = await analyzeAudioAsync(buffer, 'wav');
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
function generateStereoTestWav(): Buffer {
    // Audio parameters - now stereo
    const sampleRate = 44100;
    const duration = 0.5; // 500ms
    const numChannels = 2; // Stereo
    const numSamples = sampleRate * duration;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = numSamples * blockAlign;

    // Create buffer (44 byte header + PCM data)
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // Format chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22); // Stereo
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * blockAlign, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bytesPerSample * 8, 34);

    // Data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Generate stereo sine wave (different frequencies per channel)
    const leftFreq = 440;  // A4
    const rightFreq = 523.25; // C5
    for (let i = 0; i < numSamples; i++) {
        const leftSample = Math.sin(2 * Math.PI * leftFreq * i / sampleRate) * 0.5;
        const rightSample = Math.sin(2 * Math.PI * rightFreq * i / sampleRate) * 0.5;
        
        const offset = 44 + i * blockAlign;
        buffer.writeInt16LE(Math.floor(leftSample * 32767), offset); // Left
        buffer.writeInt16LE(Math.floor(rightSample * 32767), offset + 2); // Right
    }

    return buffer;
}

describe('Stereo WAV Roundtrip Test', () => {
    it('should handle stereo WAV files correctly', async () => {
        // 1. Generate stereo test WAV
        const originalAudio = generateStereoTestWav();
        
        // Verify source is stereo
        expect(originalAudio.readUInt16LE(22)).toBe(2);

        // 2. Decode the generated WAV
        const decodedData = await decodeAudio(originalAudio, 'wav');
        expect(decodedData.numChannels).toBe(2);

        // 3. Encode back to WAV (maintain stereo)
        const outputPath = './test/assets/stereo-roundtrip.wav';
        await exportAudioToFileAsync(decodedData, outputPath, {
            format: 'wav',
            bitDepth: 16,
            channels: 2 // Explicit stereo
        });
        expect(fs.existsSync(outputPath)).toBe(true);
        console.log(fs.existsSync(outputPath));
        console.log(path.resolve(outputPath));
        // 4. Verify the exported file
        const exportedBuffer = fs.readFileSync(outputPath);
        expect(exportedBuffer.readUInt16LE(22)).toBe(2); // Stereo check

        // 5. Decode and compare
        const roundtripData = await decodeAudio(exportedBuffer, 'wav');
        
        // Verify channel count and basic properties
        expect(roundtripData.numChannels).toBe(2);
        expect(roundtripData.sampleRate).toBe(44100);
        expect(roundtripData.duration).toBeCloseTo(0.5, 2);

        // Compare both channels
        for (let channel = 0; channel < 2; channel++) {
            let diffSum = 0;
            const sampleCount = Math.min(100, decodedData.channelData[channel].length);
            
            for (let i = 0; i < sampleCount; i++) {
                const diff = Math.abs(
                    roundtripData.channelData[channel][i] - 
                    decodedData.channelData[channel][i]
                );
                diffSum += diff;
                expect(diff).toBeLessThan(1); // Per-sample tolerance
            }
            
            expect(diffSum / sampleCount).toBeLessThan(0.5); // Avg tolerance
        }

        //fs.unlinkSync(outputPath);
    });
});

function generateMusicalTestWav(): Buffer {
    // Audio parameters
    const sampleRate = 44100;
    const duration = 10; // Longer duration for better analysis
    const bpm = 90;
    const rootFreq = 466.16; // A#4 frequency
    const numSamples = sampleRate * duration;
    
    // Create buffer (44 byte header + PCM data)
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // 1. RIFF Chunk Descriptor
    buffer.write('RIFF', 0); // ChunkID
    buffer.writeUInt32LE(36 + numSamples * 2, 4); // ChunkSize
    buffer.write('WAVE', 8); // Format

    // 2. FMT Sub-Chunk
    buffer.write('fmt ', 12); // Subchunk1ID
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // 3. Data Sub-Chunk
    buffer.write('data', 36); // Subchunk2ID
    buffer.writeUInt32LE(numSamples * 2, 40); // Subchunk2Size

    // 4. Generate musical content
    const beatInterval = (60 / bpm) * sampleRate; // Samples per beat
    const majorScale = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
    
    for (let i = 0; i < numSamples; i++) {
        // Beat detection (percussive element)
        const isBeat = i % beatInterval < 100; // 100 sample "click"
        const beat = isBeat ? 0.3 * Math.exp(-i % beatInterval / 50) : 0;
        
        // A# major chord (root + major third + perfect fifth)
        const chordPhase = 2 * Math.PI * i / sampleRate;
        const tone = 
            0.2 * Math.sin(rootFreq * chordPhase) +
            0.15 * Math.sin(rootFreq * 1.25 * chordPhase) + // Major third
            0.15 * Math.sin(rootFreq * 1.5 * chordPhase); // Perfect fifth
        
        // Scale melody (changes every beat)
        const currentNote = majorScale[Math.floor(i / beatInterval) % 7];
        const melodyFreq = rootFreq * Math.pow(2, currentNote/12);
        const melody = 0.1 * Math.sin(2 * Math.PI * melodyFreq * i / sampleRate);
        
        // Combine elements
        const sample = beat + tone + melody;
        buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.floor(sample * 32767))), 
                        44 + i * 2);
    }

    return buffer;
}