import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeAudioAsync } from '../src/analyze';
import fs from 'fs/promises';
import path from 'path';

// beforeAll(async () => {
//   await initEssentia();
// });

describe('analyzeAudio', () => {
  it('detects bpm, key, and scale for a WAV file', async () => {
    const filePath = path.resolve(__dirname, 'assets', 'test.wav');
    const buffer = await fs.readFile(filePath);

    const result = await analyzeAudioAsync(buffer);
    expect(Number(result.bpm)).toBeGreaterThan(0);
    expect(result.key).toMatch(/^[A-G][#b]?$/);
    expect(['major', 'minor']).toContain(result.scale);
    console.log(result);
  });
});