const fs = require("fs");
const path = require("path");

const wavPath = path.resolve(__dirname, "assets", "faahhhhhh.wav");

// Minimal PCM WAV header (44 bytes) for 16-bit mono 44.1kHz
const buffer = Buffer.alloc(44);

// RIFF chunk descriptor
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36, 4); // ChunkSize (36 + SubChunk2Size) - minimal
buffer.write("WAVE", 8);

// fmt sub-chunk
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
buffer.writeUInt32LE(44100, 24); // SampleRate
buffer.writeUInt32LE(44100 * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
buffer.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
buffer.writeUInt16LE(16, 34); // BitsPerSample

// data sub-chunk
buffer.write("data", 36);
buffer.writeUInt32LE(0, 40); // Subchunk2Size (0 data)

fs.writeFileSync(wavPath, buffer);
console.log("Created valid dummy WAV at " + wavPath);
