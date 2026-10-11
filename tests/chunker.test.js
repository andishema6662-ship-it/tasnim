'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Soti = require('../assets/soti.js');

function flush() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });
}

function createFakeEngine() {
  const pending = [];
  const calls = [];
  return {
    calls: calls,
    id: 'fake',
    isAvailable: function () {
      return Promise.resolve(true);
    },
    speak: function (text, opts) {
      calls.push({ op: 'speak', text: text, opts: Object.assign({}, opts) });
      return new Promise(function (resolve) {
        pending.push(resolve);
      });
    },
    end: function (reason) {
      const resolve = pending.shift();
      if (resolve) {
        resolve({ reason: reason || 'end' });
      }
    },
    pause: function () {
      calls.push({ op: 'pause' });
    },
    resume: function () {
      calls.push({ op: 'resume' });
    },
    cancel: function () {
      calls.push({ op: 'cancel' });
      const resolve = pending.shift();
      if (resolve) {
        resolve({ reason: 'canceled' });
      }
    }
  };
}

function speaks(engine) {
  return engine.calls.filter(function (call) {
    return call.op === 'speak';
  });
}

test('chunkText keeps short text in one chunk', function () {
  const chunks = Soti.chunkText('سلام. حال شما خوب است؟', 120);
  assert.deepEqual(chunks, ['سلام. حال شما خوب است؟']);
});

test('chunkText returns nothing for blank text', function () {
  assert.deepEqual(Soti.chunkText('   \n\t  '), []);
});

test('chunkText splits long Persian text in order without passing the limit', function () {
  const sentence = 'کتابخانه شهر دیروز سالن تازه‌ای را برای مطالعه شبانه گشود و چراغ حیاط را تا دیر وقت روشن گذاشت.';
  const text = new Array(8).fill(sentence).join(' ');
  const chunks = Soti.chunkText(text, 80);
  assert.ok(chunks.length > 1);
  chunks.forEach(function (chunk) {
    assert.ok(chunk.length <= 80);
    assert.ok(chunk.trim().length > 0);
  });
  const joined = chunks.join(' ').replace(/\s+/g, ' ');
  assert.equal(joined.includes('کتابخانه'), true);
  assert.equal(joined.includes('روشن گذاشت.'), true);
  assert.ok(joined.indexOf('کتابخانه') < joined.lastIndexOf('روشن گذاشت.'));
});

test('chunkText splits a long sentence on spaces and keeps every word', function () {
  const words = [];
  let index;
  for (index = 0; index < 30; index += 1) {
    words.push('واژه' + index);
  }
  const chunks = Soti.chunkText(words.join(' '), 40);
  chunks.forEach(function (chunk) {
    assert.ok(chunk.length <= 40);
  });
  assert.equal(chunks.join(' '), words.join(' '));
});

test('rate labels include two-times speed in Persian', function () {
  assert.equal(Soti.RATES.length, 6);
  assert.deepEqual(Soti.RATES.map(function (rate) {
    return rate.value;
  }), [0.75, 1, 1.25, 1.5, 1.75, 2]);
  assert.equal(Soti.RATES[5].label, '۲ برابر');
  assert.equal(Soti.toPersianDigits(12), '۱۲');
});

test('resolveFaVoice maps Dilara to منیژه and Farid to بیژن', function () {
  const voices = [
    { name: 'Microsoft David', lang: 'en-US', voiceURI: 'david' },
    { name: 'Microsoft Dilara Online', lang: 'fa-IR', voiceURI: 'Microsoft Dilara Online - Persian (Iran)' },
    { name: 'Microsoft Farid Online', lang: 'fa-IR', voiceURI: 'Microsoft Farid Online - Persian (Iran)' }
  ];
  const female = Soti.resolveFaVoice(voices, 'manijeh');
  const male = Soti.resolveFaVoice(voices, 'bijan');
  assert.equal(female.voice.name.includes('Dilara'), true);
  assert.equal(female.pitch, 1);
  assert.equal(male.voice.name.includes('Farid'), true);
  assert.equal(male.pitch, 1);
  assert.equal(Soti.resolveFaVoice([{ name: 'Samantha', lang: 'en-US', voiceURI: 's' }], 'bijan').voice, null);
});

test('a single Persian voice is shared with different pitch', function () {
  const only = [{ name: 'Google فارسی', lang: 'fa-IR', voiceURI: 'google-fa' }];
  const female = Soti.resolveFaVoice(only, 'manijeh');
  const male = Soti.resolveFaVoice(only, 'bijan');
  assert.equal(female.voice, male.voice);
  assert.ok(female.pitch > 1);
  assert.ok(male.pitch < 1);
});

test('espeak adapter maps voices and speed without a bundled engine', async function () {
  assert.equal(Soti.ESPEAK_VOICES.manijeh, 'fa+f2');
  assert.equal(Soti.ESPEAK_VOICES.bijan, 'fa+m3');
  assert.equal(Soti.espeakSpeed(1), 175);
  assert.equal(Soti.espeakSpeed(0.75), 131);
  assert.equal(Soti.espeakSpeed(2), 350);
  const missing = Soti.createEspeakNgEngine(null);
  assert.equal(await missing.isAvailable(), false);
  const heard = [];
  const engine = Soti.createEspeakNgEngine({
    speak: function (text, opts) {
      heard.push({ text: text, opts: opts });
      return { reason: 'end' };
    }
  });
  assert.equal(await engine.isAvailable(), true);
  await engine.speak('سلام', { voiceId: 'manijeh', rate: 2 });
  await engine.speak('درود', { voiceId: 'bijan', rate: 1 });
  assert.equal(heard[0].opts.voice, 'fa+f2');
  assert.equal(heard[0].opts.speed, 350);
  assert.equal(heard[1].opts.voice, 'fa+m3');
  assert.equal(heard[1].opts.speed, 175);
});

test('azure adapter maps Dilara and Farid and does not fetch without an endpoint', async function () {
  assert.equal(Soti.AZURE_VOICES.manijeh, 'fa-IR-DilaraNeural');
  assert.equal(Soti.AZURE_VOICES.bijan, 'fa-IR-FaridNeural');
  let called = false;
  const idle = Soti.createAzureSpeechEngine({
    fetchImpl: function () {
      called = true;
      return Promise.reject(new Error('should not fetch'));
    }
  });
  assert.equal(await idle.isAvailable(), false);
  const blocked = await idle.speak('سلام', { voiceId: 'bijan', rate: 2 });
  assert.equal(blocked.reason, 'error');
  assert.equal(called, false);

  let body = null;
  const wired = Soti.createAzureSpeechEngine({
    endpoint: 'https://example.invalid/soti-tts',
    fetchImpl: function (_url, init) {
      body = JSON.parse(init.body);
      return Promise.resolve({ ok: false, status: 599 });
    }
  });
  assert.equal(await wired.isAvailable(), true);
  const result = await wired.speak('سلام', { voiceId: 'manijeh', rate: 1.5 });
  assert.equal(result.reason, 'error');
  assert.equal(body.voice, 'fa-IR-DilaraNeural');
  assert.equal(body.rate, 1.5);
  assert.equal(body.lang, 'fa-IR');
});

test('chunks play in order', async function () {
  const engine = createFakeEngine();
  const controller = Soti.createController({
    engine: engine,
    chunks: ['یک', 'دو', 'سه']
  });
  controller.play();
  assert.equal(speaks(engine)[0].text, 'یک');
  engine.end();
  await flush();
  assert.equal(speaks(engine)[1].text, 'دو');
  engine.end();
  await flush();
  engine.end();
  await flush();
  assert.equal(speaks(engine)[2].text, 'سه');
  assert.equal(controller.snapshot().status, 'idle');
  assert.equal(controller.snapshot().finished, true);
  assert.equal(controller.snapshot().progress, 1);
});

test('changing speed while playing restarts the current chunk', async function () {
  const engine = createFakeEngine();
  const controller = Soti.createController({
    engine: engine,
    chunks: ['الف', 'ب'],
    rate: 1
  });
  controller.play();
  controller.setRate(2);
  await flush();
  const spoken = speaks(engine);
  assert.equal(spoken.length, 2);
  assert.equal(spoken[0].text, 'الف');
  assert.equal(spoken[0].opts.rate, 1);
  assert.equal(spoken[1].text, 'الف');
  assert.equal(spoken[1].opts.rate, 2);
  assert.equal(controller.snapshot().index, 0);
  assert.equal(engine.calls.some(function (call) {
    return call.op === 'cancel';
  }), true);
});

test('changing speed while paused waits for the next chunk', async function () {
  const engine = createFakeEngine();
  const controller = Soti.createController({
    engine: engine,
    chunks: ['اول', 'دوم']
  });
  controller.play();
  controller.pause();
  controller.setRate(1.75);
  await flush();
  assert.equal(speaks(engine).length, 1);
  assert.equal(controller.snapshot().status, 'paused');
  assert.equal(engine.calls.some(function (call) {
    return call.op === 'pause';
  }), true);
  controller.play();
  assert.equal(engine.calls.some(function (call) {
    return call.op === 'resume';
  }), true);
  assert.equal(speaks(engine).length, 1);
  engine.end();
  await flush();
  assert.equal(speaks(engine)[1].text, 'دوم');
  assert.equal(speaks(engine)[1].opts.rate, 1.75);
});

test('stop cancels playback and resets progress', async function () {
  const engine = createFakeEngine();
  const controller = Soti.createController({
    engine: engine,
    chunks: ['یک', 'دو']
  });
  controller.play();
  controller.stop();
  await flush();
  engine.end();
  await flush();
  assert.equal(controller.snapshot().status, 'idle');
  assert.equal(controller.snapshot().index, 0);
  assert.equal(controller.snapshot().progress, 0);
  assert.equal(speaks(engine).length, 1);
});

test('voice change while playing replays the chunk with the new voice id', async function () {
  const engine = createFakeEngine();
  const controller = Soti.createController({
    engine: engine,
    chunks: ['متن']
  });
  controller.play();
  assert.equal(speaks(engine)[0].opts.voiceId, 'manijeh');
  controller.setVoice('bijan');
  await flush();
  assert.equal(speaks(engine)[1].opts.voiceId, 'bijan');
  assert.equal(speaks(engine)[1].text, 'متن');
});

test('bundled espeak maps pitch and playback rate without a cloud voice', function () {
  assert.equal(Soti.ESPEAK_PITCH.manijeh > Soti.ESPEAK_PITCH.bijan, true);
  assert.equal(Soti.playbackRateFor(2), 2);
  assert.equal(Soti.playbackRateFor(0.75), 0.75);
  assert.equal(Soti.playbackRateFor(1.75), 1.75);
  assert.equal(Soti.ENGINE_FAILURE_MESSAGE, 'صدای فارسی در این مرورگر پیدا نشد.');
  assert.equal(Soti.canUseBuiltinEspeak(), false);
});

test('source does not call Azure or bundle a Neshan model', function () {
  const src = fs.readFileSync(path.join(__dirname, '../assets/soti.js'), 'utf8');
  assert.equal(src.includes('speech.microsoft.com'), false);
  assert.equal(src.includes('translate.google'), false);
  assert.equal(src.includes('neshan'), false);
  assert.equal(/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]/.test(src), false);
  assert.equal(src.includes('espeak-ng.js'), true);
  assert.equal(src.includes('espeak-ng.wasm'), true);
  assert.equal(src.includes('playbackRate'), true);
  assert.equal(src.includes("'-s', '175'"), true);
});
