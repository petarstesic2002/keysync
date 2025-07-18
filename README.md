# Keysync 🎵
** Audio Analysis Toolkit** | *BPM, Key & Scale Detection for WAV/MP3/OGG/FLAC *

![DEMO] (https://icon-link.example)

## 🔧 Installation (Pre-Release Testing)

### Option 1: Install from GitHub
```bash
npm install https://github.com/petarstesic2002/keysync
```

### Option 2: Local development
```bash
git clone https://github.com/petarstesic2002/keysync
cd keysync
npm install
npm link # Creates global symlink

# In your test project
npm link keysync
```

## 🚀 Quick Start
```javascript
const { analyzeAudioAsync } = require('keysync');
const fs = require('fs');

async function analyzeTrack(filePath) {
  try {
    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Get file extension
    const format = filePath.split('.').pop().toLowerCase();

    // Analyze
    const { roundedBpm, bpm, key, scale, confidence } = await analyzeAudioAsync(fileBuffer, format);
    
    console.log('🎶 Analysis Results:');
    console.log(`BPM (rounded): ${roundedBpm}`);
    console.log(`BPM (float): ${bpm}`);
    console.log(`Key: ${key} ${scale}`);
    console.log(`Confidence: ${(confidence * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    cleanupEssentia();
  }
}

// Usage
analyzeTrack('./sample.wav').catch(console.error);
```

## 📖 API Reference
>`analyzeAudioAsync(buffer: NonSharedBuffer, format: AudioFormat)`
`- buffer: Buffer<ArrayBufferLike> - Audio file buffer`
`- format: AudioFormat - 'wav'|'mp3'|'ogg'|'flac'`
`- returns Promise<AudioData>`
`- AudioData object containing:`
> * roundedBpm (Integer)
> * bpm (Float)
> * key (String)
> * scale (String)
> * confidence (Float)

>`cleanupEssentia(): void`
`- Frees WebAssembly memory. Call after analysis`

## 🎚️ Supported Formats
| Format    | Decoding method |
| -------- | ------- |
| WAV  | Optimized worker thread |
| MP3 | Web Audio API Decoder |
| OGG | Web Audio API Decoder |
| FLAC | Web Audio API Decoder |

