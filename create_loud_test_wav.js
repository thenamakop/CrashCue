const fs = require("fs");

const sampleRate = 44100;
const duration = 1; // 1 second
const freq = 880;

const samples = sampleRate * duration;
const buffer = Buffer.alloc(44 + samples * 2);

// RIFF header
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + samples * 2, 4);
buffer.write("WAVE", 8);

// fmt chunk
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);

// data chunk
buffer.write("data", 36);
buffer.writeUInt32LE(samples * 2, 40);

for (let i = 0; i < samples; i++) {
  const t = i / sampleRate;
  const sample = Math.sin(2 * Math.PI * freq * t);
  buffer.writeInt16LE(sample * 32767, 44 + i * 2);
}

fs.writeFileSync("assets/faahhhhhh.wav", buffer);

console.log("LOUD test WAV created.");
