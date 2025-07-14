import { describe, it, expect } from 'vitest';
import { analyzeAudioAsync } from '../src/analyze';

describe('analyzeAudio', () => {
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
function generateTestWav(): Buffer {
    // Audio parameters
    const sampleRate = 44100;
    const duration = 2; // seconds
    const frequency = 440; // A4 note
    const numSamples = sampleRate * duration;

    // Create buffer (44 byte header + PCM data)
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // 1. RIFF Chunk Descriptor
    buffer.write('RIFF', 0); // ChunkID
    buffer.writeUInt32LE(36 + numSamples * 2, 4); // ChunkSize (file size - 8)
    buffer.write('WAVE', 8); // Format

    // 2. FMT Sub-Chunk
    buffer.write('fmt ', 12); // Subchunk1ID
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (PCM = 1)
    buffer.writeUInt16LE(1, 22); // NumChannels (mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    buffer.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // 3. Data Sub-Chunk
    buffer.write('data', 36); // Subchunk2ID
    buffer.writeUInt32LE(numSamples * 2, 40); // Subchunk2Size (data size)

    // 4. Generate PCM data (16-bit signed)
    for (let i = 0; i < numSamples; i++) {
        const sample = 0.6 * Math.sin(2 * Math.PI * frequency * i / sampleRate); // 60% volume
        const intSample = Math.floor(sample * 32767);
        buffer.writeInt16LE(intSample, 44 + i * 2);
    }

return buffer;
}

function generateBetterTestWav(bpm = 90): Buffer {
    const sampleRate = 44100;
    const duration = 10; // Longer duration helps analysis
    const numSamples = sampleRate * duration;

    const buffer = Buffer.alloc(44 + numSamples * 2);
    
    // ... (same header code as before) ...

    // Generate rich harmonic content
    const beatInterval = (60 / bpm) * sampleRate;
    let lastBeatPos = 0;

    for (let i = 0; i < numSamples; i++) {
        // Add percussion transient every beat
        let sample = 0;
        if (i - lastBeatPos >= beatInterval) {
            sample += 0.3 * Math.exp(-0.0001 * (i - lastBeatPos)); // Decaying click
            lastBeatPos = i;
        }

        // Add harmonic-rich tone (square wave works better than sine)
        const phase = (i / sampleRate) * 440 * 2 * Math.PI;
        sample += 0.4 * (Math.sign(Math.sin(phase))); // Square wave

        // Write 16-bit sample
        buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
    }

    return buffer;
}

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