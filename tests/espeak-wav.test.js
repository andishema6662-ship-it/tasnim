'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function pcmStats(wav) {
  assert.equal(wav.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(wav.subarray(8, 12).toString('ascii'), 'WAVE');
  const sampleRate = wav.readUInt32LE(24);
  const channels = wav.readUInt16LE(22);
  const bits = wav.readUInt16LE(34);
  let peak = 0;
  let nonzero = 0;
  for (let offset = 44; offset + 1 < wav.length; offset += 2) {
    const sample = Math.abs(wav.readInt16LE(offset));
    if (sample > peak) {
      peak = sample;
    }
    if (sample > 0) {
      nonzero += 1;
    }
  }
  return { sampleRate: sampleRate, channels: channels, bits: bits, peak: peak, nonzero: nonzero };
}

async function synthesize(factory, voice, pitch) {
  const mod = await factory({
    arguments: ['-v', voice, '-p', String(pitch), '-s', '175', '-w', '/tmp/soti-test.wav', 'سلام، این یک خبر آزمایشی است.']
  });
  return Buffer.from(mod.FS.readFile('/tmp/soti-test.wav'));
}

test('espeak-ng wasm writes a non-silent Persian wav for both voices', async function () {
  const imported = await import('../assets/vendor/espeak-ng.js');
  const factory = imported.default;
  const female = await synthesize(factory, 'fa+f2', 68);
  const male = await synthesize(factory, 'fa+m3', 32);
  const femaleStats = pcmStats(female);
  const maleStats = pcmStats(male);
  assert.equal(femaleStats.sampleRate, 22050);
  assert.equal(maleStats.sampleRate, 22050);
  assert.equal(femaleStats.channels, 1);
  assert.equal(femaleStats.bits, 16);
  assert.ok(femaleStats.peak > 100);
  assert.ok(maleStats.peak > 100);
  assert.ok(femaleStats.nonzero > 100);
  assert.ok(maleStats.nonzero > 100);
  assert.notEqual(female.equals(male), true);
});
