/**
 * Shenidar (شنیدار) reads a Persian news article aloud.
 *
 * Default engine: Piper neural audio for the article on the page.
 * منیژه is fa_IR-mana-medium (female). بیژن is fa_IR-amir-medium (male).
 * Models load from a public URL. Finished clips are stored on the site.
 * Speed buttons set Web Audio playbackRate. eSpeak is not the voice.
 * Neshan's proprietary Manijeh and Bijan recordings are not used.
 *
 * Fallbacks, used only if the built-in engine cannot start:
 * - Optional site eSpeak backend (speed = 175 × rate, clamped 80–450)
 * - Azure AI Speech proxy: fa-IR-DilaraNeural / fa-IR-FaridNeural, rate in JSON
 * - Web Speech API fa-IR, when the browser actually has a Persian voice
 */
(function (root, factory) {
  'use strict';

  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.Soti = api;
  }

  if (typeof document !== 'undefined') {
    api.start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_CHUNK_LENGTH = 120;

  var RATES = [
    { value: 0.75, label: '۰٫۷۵×' },
    { value: 1, label: '۱×' },
    { value: 1.25, label: '۱٫۲۵×' }
  ];

  var AZURE_VOICES = {
    manijeh: 'fa-IR-DilaraNeural',
    bijan: 'fa-IR-FaridNeural'
  };

  var ESPEAK_VOICES = {
    manijeh: 'fa+f2',
    bijan: 'fa+m3'
  };

  // eSpeak pitch is 0–99. Variants already differ; pitch separates them further.
  var ESPEAK_PITCH = {
    manijeh: 68,
    bijan: 32
  };

  var ENGINE_FAILURE_MESSAGE = 'صدای فارسی در این مرورگر پیدا نشد.';
  var PREPARING_MESSAGE = 'در حال آماده‌کردن صدا…';
  var ESPEAK_JS_URL = 'https://cdn.jsdelivr.net/npm/espeak-ng@1.0.2/dist/espeak-ng.js';
  var ESPEAK_WASM_URL = 'https://cdn.jsdelivr.net/npm/espeak-ng@1.0.2/dist/espeak-ng.wasm';
  var ORT_JS_URL = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js';
  var ORT_WASM_URL = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
  var PIPER_PUBLIC = {
    manijeh: {
      model: 'https://huggingface.co/MahtaFetrat/Mana-Persian-Piper/resolve/main/fa_IR-mana-medium.onnx',
      config: 'https://huggingface.co/MahtaFetrat/Mana-Persian-Piper/resolve/main/fa_IR-mana-medium.onnx.json'
    },
    bijan: {
      model: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx',
      config: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fa/fa_IR/amir/medium/fa_IR-amir-medium.onnx.json'
    }
  };

  var capturedScriptSrc = '';
  if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
    capturedScriptSrc = document.currentScript.src;
  }

  var sharedAudioContext = null;
  var espeakAssetsPromise = null;
  var espeakAssetsReady = false;

  var DEFAULT_SELECTORS = [
    '[data-soti-article]',
    '.soti-article',
    'article .entry-content',
    '.entry-content',
    '.post-content',
    '.article-body',
    '.article__body',
    '.article__content',
    '[itemprop="articleBody"]',
    'article',
    'main'
  ];

  var SKIP_SELECTOR = [
    'script',
    'style',
    'noscript',
    'template',
    'iframe',
    'svg',
    'canvas',
    'nav',
    'aside',
    'footer',
    'form',
    'button',
    'input',
    'textarea',
    'select',
    'figure',
    '.soti-player',
    '[data-soti-player]',
    '#comments',
    '.comments',
    '.comment',
    '.comment-list',
    '.comment-respond',
    '.comment-form',
    '.related',
    '.related-posts',
    '.related-articles',
    '.yarpp-related',
    '.jp-relatedposts',
    '.advert',
    '.advertisement',
    '.ads',
    '.ad',
    '.adsbygoogle',
    '.ad-slot',
    '.share',
    '.sharedaddy',
    '.social',
    '.social-share',
    '.post-share',
    '.newsletter',
    '.post-navigation',
    '.post-tags',
    '.entry-footer',
    '.wp-block-comments',
    '.wp-block-comment-template',
    '.wp-block-post-comments-form',
    '.wp-block-latest-posts',
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
    '[aria-hidden="true"]'
  ].join(',');

  var FEMALE_RE = /dilara|female|woman|neda|sara|mina|maryam|leila|azadeh|زن/i;
  var MALE_RE = /farid|male|\bman\b|azamat|amir|reza|bijan|ganji|مرد/i;
  var playerSeq = 0;

  function toPersianDigits(value) {
    return String(value).replace(/\d/g, function (digit) {
      return '۰۱۲۳۴۵۶۷۸۹'[digit];
    });
  }

  function normalizeLimit(maxLen) {
    var value = Number(maxLen);
    if (!Number.isFinite(value) || value < 20) {
      return DEFAULT_CHUNK_LENGTH;
    }
    return Math.floor(value);
  }

  function normalizeText(text) {
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t\r\f\v]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  function packParts(parts, limit) {
    var chunks = [];
    var buf = '';

    parts.forEach(function (part) {
      var next = buf ? buf + ' ' + part : part;
      if (next.length <= limit) {
        buf = next;
        return;
      }
      if (buf) {
        chunks.push(buf);
      }
      buf = part;
    });

    if (buf) {
      chunks.push(buf);
    }
    return chunks;
  }

  function splitLong(sentence, limit) {
    var clauses = sentence.split(/(?<=[،,])/u).map(function (part) {
      return part.trim();
    }).filter(Boolean);
    var pieces = [];

    clauses.forEach(function (clause) {
      if (clause.length <= limit) {
        pieces.push(clause);
        return;
      }
      clause.split(/\s+/).forEach(function (word) {
        if (!word) {
          return;
        }
        if (word.length <= limit) {
          pieces.push(word);
          return;
        }
        var index;
        for (index = 0; index < word.length; index += limit) {
          pieces.push(word.slice(index, index + limit));
        }
      });
    });

    return packParts(pieces, limit);
  }

  function chunkText(text, maxLen) {
    var limit = normalizeLimit(maxLen);
    var clean = normalizeText(text);
    if (!clean) {
      return [];
    }

    var sentences = clean.split(/(?<=[.!?؟؛\n…])/u).map(function (part) {
      return part.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
    var chunks = [];
    var buf = '';

    function flush() {
      if (buf) {
        chunks.push(buf);
        buf = '';
      }
    }

    sentences.forEach(function (sentence) {
      if (sentence.length > limit) {
        flush();
        splitLong(sentence, limit).forEach(function (piece) {
          chunks.push(piece);
        });
        return;
      }
      var next = buf ? buf + ' ' + sentence : sentence;
      if (next.length <= limit) {
        buf = next;
        return;
      }
      flush();
      buf = sentence;
    });

    flush();
    return chunks;
  }

  function extractArticleText(root) {
    if (!root || typeof root.cloneNode !== 'function') {
      return '';
    }

    var clone = root.cloneNode(true);
    clone.querySelectorAll(SKIP_SELECTOR).forEach(function (node) {
      node.remove();
    });
    clone.querySelectorAll('p, li, h1, h2, h3, h4, h5, blockquote, br, div').forEach(function (node) {
      node.appendChild(node.ownerDocument.createTextNode('\n'));
    });
    return normalizeText(clone.textContent || '');
  }

  function voiceBlob(voice) {
    return String((voice && voice.name) || '') + ' ' + String((voice && voice.voiceURI) || '');
  }

  function isFaVoice(voice) {
    if (!voice) {
      return false;
    }
    var lang = String(voice.lang || '').toLowerCase().replace(/_/g, '-');
    if (lang === 'fa' || lang.indexOf('fa-') === 0) {
      return true;
    }
    var blob = voiceBlob(voice);
    return /persian|farsi|فارسی/i.test(blob);
  }

  function resolveFaVoice(voices, voiceId) {
    var fa = (voices || []).filter(isFaVoice);
    var wantMale = voiceId === 'bijan';
    var female = fa.filter(function (voice) {
      return FEMALE_RE.test(voiceBlob(voice));
    });
    var male = fa.filter(function (voice) {
      return MALE_RE.test(voiceBlob(voice)) && !FEMALE_RE.test(voiceBlob(voice));
    });

    if (!fa.length) {
      return { voice: null, pitch: 1, distinct: false };
    }

    if (wantMale) {
      if (male.length) {
        return { voice: male[0], pitch: 1, distinct: true };
      }
      if (female.length) {
        var otherMale = fa.find(function (voice) {
          return female.indexOf(voice) === -1;
        });
        if (otherMale) {
          return { voice: otherMale, pitch: 1, distinct: true };
        }
        return { voice: fa[0], pitch: 0.7, distinct: false };
      }
      if (fa.length === 1) {
        return { voice: fa[0], pitch: 0.7, distinct: false };
      }
      return { voice: fa[fa.length - 1], pitch: 1, distinct: true };
    }

    if (female.length) {
      return { voice: female[0], pitch: 1, distinct: true };
    }
    if (male.length) {
      var otherFemale = fa.find(function (voice) {
        return male.indexOf(voice) === -1;
      });
      if (otherFemale) {
        return { voice: otherFemale, pitch: 1, distinct: true };
      }
      return { voice: fa[0], pitch: 1.35, distinct: false };
    }
    if (fa.length === 1) {
      return { voice: fa[0], pitch: 1.35, distinct: false };
    }
    return { voice: fa[0], pitch: 1, distinct: true };
  }

  function clampRate(rate) {
    var value = Number(rate);
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }
    if (value > 1.25) {
      return 1.25;
    }
    if (value < 0.75) {
      return 0.75;
    }
    return value;
  }

  function espeakSpeed(rate) {
    var speed = Math.round(175 * clampRate(rate));
    if (speed < 80) {
      return 80;
    }
    if (speed > 450) {
      return 450;
    }
    return speed;
  }

  function playbackRateFor(rate) {
    return clampRate(rate);
  }

  function isHttpUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (error) {
      return false;
    }
  }

  function createEspeakNgEngine(backend) {
    var token = 0;
    return {
      id: 'espeak-ng',
      voices: ESPEAK_VOICES,
      isAvailable: function () {
        return Promise.resolve(Boolean(backend && typeof backend.speak === 'function'));
      },
      speak: function (text, opts) {
        var my = ++token;
        if (!backend || typeof backend.speak !== 'function') {
          return Promise.resolve({ reason: 'error', error: 'not-configured' });
        }
        var voiceId = opts && opts.voiceId === 'bijan' ? 'bijan' : 'manijeh';
        return Promise.resolve(backend.speak(text, {
          voice: ESPEAK_VOICES[voiceId],
          speed: espeakSpeed(opts && opts.rate),
          rate: clampRate(opts && opts.rate)
        })).then(function (result) {
          if (my !== token) {
            return { reason: 'canceled' };
          }
          if (result && result.reason) {
            return result;
          }
          return { reason: 'end' };
        });
      },
      pause: function () {
        if (backend && typeof backend.pause === 'function') {
          backend.pause();
        }
      },
      resume: function () {
        if (backend && typeof backend.resume === 'function') {
          backend.resume();
        }
      },
      cancel: function () {
        token += 1;
        if (backend && typeof backend.cancel === 'function') {
          backend.cancel();
        }
      }
    };
  }

  function createAzureSpeechEngine(config) {
    var options = config || {};
    var endpoint = typeof options.endpoint === 'string' ? options.endpoint.trim() : '';
    var fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : null);
    var seq = 0;
    var active = null;

    function stopActive() {
      var current = active;
      active = null;
      if (!current) {
        return;
      }
      current.token = -1;
      if (current.audio) {
        current.audio.pause();
        if (current.url && typeof URL !== 'undefined') {
          URL.revokeObjectURL(current.url);
        }
      }
      if (current.resolve) {
        current.resolve({ reason: 'canceled' });
      }
    }

    return {
      id: 'azure-speech',
      voices: AZURE_VOICES,
      isAvailable: function () {
        return Promise.resolve(isHttpUrl(endpoint) && typeof fetchImpl === 'function');
      },
      speak: function (text, opts) {
        stopActive();
        var my = ++seq;
        var voiceId = opts && opts.voiceId === 'bijan' ? 'bijan' : 'manijeh';
        var rate = clampRate(opts && opts.rate);
        if (!isHttpUrl(endpoint) || typeof fetchImpl !== 'function') {
          return Promise.resolve({ reason: 'error', error: 'not-configured' });
        }

        return new Promise(function (resolve) {
          var record = { token: my, audio: null, url: '', resolve: resolve };
          active = record;
          fetchImpl(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg, audio/wav, audio/*'
            },
            body: JSON.stringify({
              text: text,
              voice: AZURE_VOICES[voiceId],
              rate: rate,
              lang: 'fa-IR'
            })
          }).then(function (response) {
            if (record.token !== my) {
              return null;
            }
            if (!response || !response.ok || typeof response.blob !== 'function') {
              active = null;
              resolve({ reason: 'error', error: 'http' });
              return null;
            }
            return response.blob();
          }).then(function (blob) {
            if (!blob || record.token !== my) {
              return;
            }
            var audio = new Audio();
            var url = URL.createObjectURL(blob);
            record.audio = audio;
            record.url = url;
            audio.onended = function () {
              URL.revokeObjectURL(url);
              if (record.token !== my) {
                return;
              }
              active = null;
              resolve({ reason: 'end' });
            };
            audio.onerror = function () {
              URL.revokeObjectURL(url);
              if (record.token !== my) {
                return;
              }
              active = null;
              resolve({ reason: 'error', error: 'audio' });
            };
            audio.src = url;
            var played = audio.play();
            if (played && typeof played.catch === 'function') {
              played.catch(function () {
                if (record.token !== my) {
                  return;
                }
                active = null;
                resolve({ reason: 'error', error: 'play' });
              });
            }
          }).catch(function () {
            if (record.token !== my) {
              return;
            }
            active = null;
            resolve({ reason: 'error', error: 'network' });
          });
        });
      },
      pause: function () {
        if (active && active.audio) {
          active.audio.pause();
        }
      },
      resume: function () {
        if (active && active.audio && typeof active.audio.play === 'function') {
          active.audio.play();
        }
      },
      cancel: function () {
        seq += 1;
        stopActive();
      }
    };
  }

  function waitForVoices(speech) {
    return new Promise(function (resolve) {
      var existing = speech.getVoices ? speech.getVoices() : [];
      if (existing && existing.length) {
        resolve(existing);
        return;
      }
      var settled = false;
      function finish() {
        if (settled) {
          return;
        }
        settled = true;
        speech.removeEventListener('voiceschanged', finish);
        resolve(speech.getVoices ? speech.getVoices() : []);
      }
      speech.addEventListener('voiceschanged', finish);
      setTimeout(finish, 1200);
    });
  }

  function createWebSpeechEngine() {
    var token = 0;

    function speechOf() {
      return window.speechSynthesis;
    }

    return {
      id: 'webspeech',
      isAvailable: function () {
        if (typeof window === 'undefined' || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
          return Promise.resolve(false);
        }
        return waitForVoices(window.speechSynthesis).then(function (voices) {
          return voices.some(isFaVoice);
        });
      },
      speak: function (text, opts) {
        var my = ++token;
        var speech = speechOf();
        var needsDelay = Boolean(speech.speaking || speech.pending || speech.paused);
        if (needsDelay) {
          speech.cancel();
        }
        return new Promise(function (resolve) {
          var settled = false;
          function done(result) {
            if (settled) {
              return;
            }
            settled = true;
            resolve(result);
          }
          function start() {
            if (my !== token) {
              done({ reason: 'canceled' });
              return;
            }
            var resolved = resolveFaVoice(speech.getVoices(), opts && opts.voiceId);
            if (!resolved.voice) {
              done({ reason: 'error', error: 'voice-unavailable' });
              return;
            }
            var utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fa-IR';
            utterance.rate = clampRate(opts && opts.rate);
            utterance.pitch = resolved.pitch;
            utterance.voice = resolved.voice;
            utterance.onend = function () {
              done(my === token ? { reason: 'end' } : { reason: 'canceled' });
            };
            utterance.onerror = function (event) {
              var error = event && event.error ? event.error : 'error';
              if (error === 'canceled' || error === 'interrupted') {
                done({ reason: 'canceled' });
                return;
              }
              done({ reason: 'error', error: error });
            };
            speech.speak(utterance);
          }
          if (needsDelay) {
            setTimeout(start, 60);
          } else {
            start();
          }
        });
      },
      pause: function () {
        var speech = speechOf();
        if (speech && typeof speech.pause === 'function') {
          speech.pause();
        }
      },
      resume: function () {
        var speech = speechOf();
        if (speech && typeof speech.resume === 'function') {
          speech.resume();
        }
      },
      cancel: function () {
        token += 1;
        var speech = speechOf();
        if (speech && typeof speech.cancel === 'function') {
          speech.cancel();
        }
      }
    };
  }

  function createController(options) {
    var settings = options || {};
    var controller = {
      engine: settings.engine || null,
      loadChunks: settings.loadChunks || function () {
        return (settings.chunks || []).slice();
      },
      onChange: settings.onChange || null,
      onError: settings.onError || null,
      onEmpty: settings.onEmpty || null,
      chunks: [],
      index: 0,
      status: 'idle',
      rate: clampRate(settings.rate),
      voiceId: settings.voiceId === 'bijan' ? 'bijan' : 'manijeh',
      finished: false,
      replay: false,
      runId: 0
    };

    controller.chunks = controller.loadChunks();

    controller.snapshot = function () {
      var total = controller.chunks.length;
      var progress = 0;
      if (controller.finished) {
        progress = 1;
      } else if (total) {
        progress = controller.index / total;
      }
      return {
        status: controller.status,
        rate: controller.rate,
        voiceId: controller.voiceId,
        index: controller.index,
        total: total,
        progress: progress,
        finished: controller.finished
      };
    };

    controller.emit = function () {
      if (typeof controller.onChange === 'function') {
        controller.onChange(controller.snapshot());
      }
    };

    controller.setEngine = function (engine) {
      controller.engine = engine || null;
    };

    function interruptIfPlaying() {
      if (controller.status === 'playing' && controller.engine && typeof controller.engine.cancel === 'function') {
        controller.replay = true;
        controller.engine.cancel();
      }
    }

    controller.setRate = function (rate) {
      var value = clampRate(rate);
      if (value === controller.rate) {
        return;
      }
      controller.rate = value;
      controller.emit();
      interruptIfPlaying();
    };

    controller.setVoice = function (voiceId) {
      if (voiceId !== 'manijeh' && voiceId !== 'bijan') {
        return;
      }
      if (voiceId === controller.voiceId) {
        return;
      }
      controller.voiceId = voiceId;
      controller.emit();
      interruptIfPlaying();
    };

    controller.runLoop = async function () {
      var runId = controller.runId;
      while (controller.runId === runId) {
        if (controller.status !== 'playing') {
          return;
        }
        if (controller.index >= controller.chunks.length) {
          controller.status = 'idle';
          controller.finished = true;
          controller.index = 0;
          controller.emit();
          return;
        }
        var result;
        try {
          result = await controller.engine.speak(controller.chunks[controller.index], {
            voiceId: controller.voiceId,
            rate: controller.rate,
            onPrepare: controller.onPrepare,
            onSpeaking: controller.onSpeaking
          });
        } catch (error) {
          if (controller.runId !== runId) {
            return;
          }
          controller.status = 'idle';
          controller.emit();
          if (typeof controller.onError === 'function') {
            controller.onError(error);
          }
          return;
        }
        if (controller.runId !== runId) {
          return;
        }
        var reason = result && result.reason ? result.reason : 'end';
        if (reason === 'canceled') {
          if (controller.status === 'playing' && controller.replay) {
            controller.replay = false;
            continue;
          }
          return;
        }
        if (reason === 'error') {
          controller.status = 'idle';
          controller.emit();
          if (typeof controller.onError === 'function') {
            controller.onError(result);
          }
          return;
        }
        if (controller.status !== 'playing') {
          return;
        }
        controller.index += 1;
        controller.emit();
      }
    };

    controller.play = function () {
      if (controller.status === 'playing') {
        return;
      }
      if (controller.status === 'paused') {
        controller.status = 'playing';
        controller.emit();
        if (controller.engine && typeof controller.engine.resume === 'function') {
          controller.engine.resume();
        }
        return;
      }
      controller.chunks = controller.loadChunks();
      controller.index = 0;
      controller.finished = false;
      controller.replay = false;
      if (!controller.chunks.length) {
        controller.emit();
        if (typeof controller.onEmpty === 'function') {
          controller.onEmpty();
        }
        return;
      }
      if (!controller.engine || typeof controller.engine.speak !== 'function') {
        controller.emit();
        if (typeof controller.onError === 'function') {
          controller.onError({ reason: 'error', error: 'unavailable' });
        }
        return;
      }
      controller.status = 'playing';
      controller.runId += 1;
      controller.emit();
      controller.runLoop();
    };

    controller.pause = function () {
      if (controller.status !== 'playing') {
        return;
      }
      controller.status = 'paused';
      controller.emit();
      if (controller.engine && typeof controller.engine.pause === 'function') {
        controller.engine.pause();
      }
    };

    controller.stop = function () {
      if (controller.status === 'idle' && controller.index === 0 && !controller.finished) {
        return;
      }
      controller.status = 'idle';
      controller.index = 0;
      controller.finished = false;
      controller.replay = false;
      controller.runId += 1;
      controller.emit();
      if (controller.engine && typeof controller.engine.cancel === 'function') {
        controller.engine.cancel();
      }
    };

    return controller;
  }

  function playerScriptSrc() {
    if (capturedScriptSrc) {
      return capturedScriptSrc;
    }
    if (typeof document === 'undefined') {
      return '';
    }
    var script = findBootScript();
    if (script && script.src) {
      capturedScriptSrc = script.src;
    }
    return capturedScriptSrc;
  }

  function vendorUrl(file) {
    var src = playerScriptSrc();
    if (!src) {
      return '';
    }
    try {
      return new URL('vendor/' + file, src).href;
    } catch (error) {
      return '';
    }
  }

  function canUseBuiltinEspeak() {
    if (typeof window === 'undefined') {
      return false;
    }
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioCtx !== 'function' || typeof fetch !== 'function') {
      return false;
    }
    return Boolean(vendorUrl('espeak-ng.js') && vendorUrl('espeak-ng.wasm'));
  }

  function primeBuiltinAudio() {
    if (typeof window === 'undefined') {
      return null;
    }
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioCtx !== 'function') {
      return null;
    }
    if (!sharedAudioContext) {
      try {
        sharedAudioContext = new AudioCtx();
      } catch (error) {
        return null;
      }
    }
    if (sharedAudioContext.state === 'suspended' && typeof sharedAudioContext.resume === 'function') {
      var resumed = sharedAudioContext.resume();
      if (resumed && typeof resumed.catch === 'function') {
        resumed.catch(function () {});
      }
    }
    return sharedAudioContext;
  }

  function loadEspeakAssets() {
    if (!espeakAssetsPromise) {
      var jsUrl = ESPEAK_JS_URL;
      var wasmUrl = ESPEAK_WASM_URL;
      espeakAssetsPromise = Promise.all([
        import(jsUrl),
        fetch(wasmUrl).then(function (response) {
          if (!response || !response.ok) {
            throw new Error('wasm');
          }
          return response.arrayBuffer();
        })
      ]).then(function (parts) {
        var factory = parts[0].default || parts[0];
        if (typeof factory !== 'function' || !parts[1]) {
          throw new Error('factory');
        }
        espeakAssetsReady = true;
        return {
          factory: factory,
          wasmBinary: parts[1]
        };
      }).catch(function (error) {
        espeakAssetsPromise = null;
        espeakAssetsReady = false;
        throw error;
      });
    }
    return espeakAssetsPromise;
  }

  function synthesizeEspeakWav(assets, text, voiceId) {
    var id = voiceId === 'bijan' ? 'bijan' : 'manijeh';
    return assets.factory({
      wasmBinary: assets.wasmBinary,
      arguments: [
        '-v', ESPEAK_VOICES[id],
        '-p', String(ESPEAK_PITCH[id]),
        '-s', '175',
        '-w', '/tmp/soti.wav',
        String(text || '')
      ]
    }).then(function (mod) {
      var data = mod.FS.readFile('/tmp/soti.wav');
      if (!data || data.byteLength < 44) {
        throw new Error('wav');
      }
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    });
  }

  function decodeAudioBuffer(ctx, arrayBuffer) {
    var copy = arrayBuffer.slice(0);
    var result = null;
    try {
      result = ctx.decodeAudioData(copy);
    } catch (error) {
      result = null;
    }
    if (result && typeof result.then === 'function') {
      return result;
    }
    return new Promise(function (resolve, reject) {
      ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
    });
  }

  function createBuiltinEspeakEngine() {
    var token = 0;
    var active = null;

    function finish(record, result) {
      if (!record || !record.resolve) {
        return;
      }
      var resolve = record.resolve;
      record.resolve = null;
      if (active === record) {
        active = null;
      }
      resolve(result);
    }

    function settleActive(reason) {
      var record = active;
      active = null;
      if (!record) {
        return;
      }
      record.token = -1;
      record.generation = null;
      record.stopKind = 'cancel';
      if (record.source) {
        try {
          record.source.stop();
        } catch (error) {
          /* already stopped */
        }
        record.source = null;
      }
      finish(record, { reason: reason });
    }

    function playSlice(record) {
      var ctx = primeBuiltinAudio();
      if (!ctx || !record.buffer) {
        finish(record, { reason: 'error', error: 'audio' });
        return;
      }
      var remain = record.buffer.duration - record.offset;
      if (!(remain > 0.02)) {
        finish(record, { reason: 'end' });
        return;
      }
      var source = ctx.createBufferSource();
      var generation = {};
      record.generation = generation;
      record.source = source;
      record.stopKind = '';
      source.buffer = record.buffer;
      source.playbackRate.value = record.rate;
      source.connect(ctx.destination);
      record.startedAt = ctx.currentTime;
      source.onended = function () {
        if (record.generation !== generation) {
          return;
        }
        if (record.stopKind === 'pause') {
          record.source = null;
          return;
        }
        if (record.stopKind === 'cancel' || record.token !== token) {
          return;
        }
        finish(record, { reason: 'end' });
      };
      if (!record.paused && typeof record.onSpeaking === 'function') {
        record.onSpeaking();
      }
      try {
        source.start(0, record.offset);
      } catch (error) {
        record.generation = null;
        finish(record, { reason: 'error', error: 'audio' });
      }
    }

    return {
      id: 'espeak-ng',
      voices: ESPEAK_VOICES,
      prime: primeBuiltinAudio,
      isAvailable: function () {
        return Promise.resolve(canUseBuiltinEspeak());
      },
      speak: function (text, opts) {
        var my = ++token;
        settleActive('canceled');
        var voiceId = opts && opts.voiceId === 'bijan' ? 'bijan' : 'manijeh';
        var rate = playbackRateFor(opts && opts.rate);
        var record = {
          token: my,
          resolve: null,
          source: null,
          buffer: null,
          offset: 0,
          rate: rate,
          startedAt: 0,
          paused: false,
          stopKind: '',
          generation: null,
          onSpeaking: opts && opts.onSpeaking
        };
        active = record;

        return new Promise(function (resolve) {
          record.resolve = resolve;
          if (my !== token) {
            finish(record, { reason: 'canceled' });
            return;
          }
          var ctx = primeBuiltinAudio();
          if (!ctx) {
            finish(record, { reason: 'error', error: 'audio' });
            return;
          }
          if (!espeakAssetsReady && opts && typeof opts.onPrepare === 'function') {
            opts.onPrepare();
          }
          loadEspeakAssets().then(function (assets) {
            if (record.token !== my || !record.resolve) {
              return;
            }
            return synthesizeEspeakWav(assets, text, voiceId);
          }).then(function (wav) {
            if (!wav || record.token !== my || !record.resolve) {
              return;
            }
            return decodeAudioBuffer(ctx, wav);
          }).then(function (buffer) {
            if (!buffer || record.token !== my || !record.resolve) {
              return;
            }
            record.buffer = buffer;
            if (record.paused) {
              return;
            }
            playSlice(record);
          }).catch(function () {
            if (record.token !== my || !record.resolve) {
              return;
            }
            finish(record, { reason: 'error', error: 'synth' });
          });
        });
      },
      pause: function () {
        if (!active || active.paused) {
          return;
        }
        active.paused = true;
        if (!active.source || !active.buffer || !sharedAudioContext) {
          return;
        }
        var elapsed = (sharedAudioContext.currentTime - active.startedAt) * active.rate;
        active.offset = Math.min(active.buffer.duration, active.offset + Math.max(0, elapsed));
        active.stopKind = 'pause';
        active.generation = null;
        try {
          active.source.stop();
        } catch (error) {
          /* already stopped */
        }
        active.source = null;
      },
      resume: function () {
        if (!active || !active.paused) {
          return;
        }
        active.paused = false;
        active.stopKind = '';
        if (active.buffer) {
          playSlice(active);
        }
      },
      cancel: function () {
        token += 1;
        settleActive('canceled');
      }
    };
  }

  var PIPER_MODELS = {
    manijeh: 'fa_IR-mana-medium',
    bijan: 'fa_IR-amir-medium'
  };

  var ortPromise = null;
  var piperSessions = {};
  var piperConfigs = {};

  function resolvePageUrl(value) {
    if (!value || typeof window === 'undefined') {
      return '';
    }
    try {
      return new URL(value, window.location.href).href;
    } catch (error) {
      return '';
    }
  }

  function safePathPart(value) {
    return String(value || '').replace(/[^0-9A-Za-z_-]/g, '');
  }

  function savedFileUrl(config, voiceId, key) {
    var settings = config || {};
    var base = resolvePageUrl(settings.audioBase);
    var postId = safePathPart(settings.postId);
    if (!base || !postId || (voiceId !== 'manijeh' && voiceId !== 'bijan')) {
      return '';
    }
    return base.replace(/\/$/, '') + '/' + postId + '/' + voiceId + '/' + key + '.wav';
  }

  function loadOrt() {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('ort'));
    }
    if (window.ort) {
      window.ort.env.wasm.numThreads = 1;
      window.ort.env.wasm.wasmPaths = ORT_WASM_URL;
      return Promise.resolve(window.ort);
    }
    if (!ortPromise) {
      ortPromise = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = ORT_JS_URL;
        script.onload = function () {
          if (!window.ort) {
            reject(new Error('ort'));
            return;
          }
          window.ort.env.wasm.numThreads = 1;
          window.ort.env.wasm.wasmPaths = ORT_WASM_URL;
          resolve(window.ort);
        };
        script.onerror = function () {
          ortPromise = null;
          reject(new Error('ort'));
        };
        document.head.appendChild(script);
      });
    }
    return ortPromise;
  }

  function ipaFor(text) {
    return loadEspeakAssets().then(function (assets) {
      var lines = [];
      return assets.factory({
        wasmBinary: assets.wasmBinary,
        print: function (line) {
          lines.push(String(line));
        },
        arguments: ['--ipa', '-q', '-v', 'fa', String(text || '')]
      }).then(function () {
        var ipa = lines.join(' ').replace(/\s+/g, ' ').trim();
        if (!ipa) {
          throw new Error('ipa');
        }
        if (/[.!?؟]$/.test(text) && !/[.!?؟]$/.test(ipa)) {
          ipa += '.';
        }
        return ipa;
      });
    });
  }

  function phonemeIds(ipa, idMap) {
    var chars = Array.from(String(ipa || '').normalize('NFD'));
    var ids = [idMap['^'][0], idMap['_'][0]];
    chars.forEach(function (ch) {
      var row = idMap[ch];
      if (!row) {
        return;
      }
      ids.push(row[0], idMap['_'][0]);
    });
    ids.push(idMap['$'][0]);
    return ids;
  }

  function loadPiperVoice(voiceId) {
    var id = voiceId === 'bijan' ? 'bijan' : 'manijeh';
    var spec = PIPER_PUBLIC[id];
    if (!piperSessions[id]) {
      piperConfigs[id] = fetch(spec.config).then(function (response) {
        if (!response || !response.ok) {
          throw new Error('config');
        }
        return response.json();
      });
      piperSessions[id] = loadOrt().then(function (ort) {
        return ort.InferenceSession.create(spec.model, {
          executionProviders: ['wasm']
        });
      });
    }
    return Promise.all([piperSessions[id], piperConfigs[id]]);
  }

  function floatToWav(samples, sampleRate) {
    var rate = sampleRate || 22050;
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);
    function writeString(offset, value) {
      var index;
      for (index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
      }
    }
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    var offset = 44;
    var index;
    for (index = 0; index < samples.length; index += 1) {
      var sample = Math.max(-1, Math.min(1, samples[index]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
    return buffer;
  }

  function synthesizePiperWav(voiceId, text) {
    return Promise.all([ipaFor(text), loadPiperVoice(voiceId)]).then(function (parts) {
      var ipa = parts[0];
      var session = parts[1][0];
      var config = parts[1][1] || {};
      var inference = config.inference || {};
      var ids = phonemeIds(ipa, config.phoneme_id_map);
      var ort = window.ort;
      var scales = [
        Number(inference.noise_scale) || 0.667,
        Number(inference.length_scale) || 1,
        Number(inference.noise_w) || 0.8
      ];
      var feeds = {
        input: new ort.Tensor('int64', BigInt64Array.from(ids.map(function (n) {
          return BigInt(n);
        })), [1, ids.length]),
        input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
        scales: new ort.Tensor('float32', Float32Array.from(scales), [3])
      };
      return session.run(feeds).then(function (result) {
        var output = result[session.outputNames[0]].data;
        var rate = config.audio && config.audio.sample_rate ? config.audio.sample_rate : 22050;
        return floatToWav(output, rate);
      });
    });
  }

  function storePiperWav(config, voiceId, key, wav) {
    var settings = config || {};
    var endpoint = resolvePageUrl(settings.saveEndpoint);
    if (!endpoint || typeof FormData === 'undefined') {
      return;
    }
    var body = new FormData();
    body.append('post_id', String(settings.postId || ''));
    body.append('voice', voiceId);
    body.append('key', key);
    body.append('audio', new Blob([wav], { type: 'audio/wav' }), key + '.wav');
    var headers = {};
    if (settings.nonce) {
      headers['X-WP-Nonce'] = settings.nonce;
    }
    fetch(endpoint, {
      method: 'POST',
      body: body,
      headers: headers,
      credentials: 'same-origin'
    }).catch(function () {});
  }

  function fetchSavedWav(url) {
    if (!url) {
      return Promise.resolve(null);
    }
    return fetch(url, { cache: 'no-store' }).then(function (response) {
      if (!response || !response.ok) {
        return null;
      }
      return response.arrayBuffer();
    }).then(function (wav) {
      if (!wav || wav.byteLength < 44) {
        return null;
      }
      var mark = new Uint8Array(wav, 0, 4);
      if (mark[0] !== 82 || mark[1] !== 73 || mark[2] !== 70 || mark[3] !== 70) {
        return null;
      }
      return wav;
    }).catch(function () {
      return null;
    });
  }

  var speechManifestPromise = null;

  function speechKey(text) {
    var h = 2166136261;
    var value = String(text || '');
    var i;
    for (i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16) + '-' + value.length;
  }

  function canPlayPrerendered() {
    if (typeof window === 'undefined') {
      return false;
    }
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (typeof AudioCtx !== 'function' || typeof fetch !== 'function') {
      return false;
    }
    return Boolean(vendorUrl('speech/manifest.json'));
  }

  function loadSpeechManifest() {
    if (!speechManifestPromise) {
      var url = vendorUrl('speech/manifest.json');
      speechManifestPromise = fetch(url).then(function (response) {
        if (!response || !response.ok) {
          throw new Error('manifest');
        }
        return response.json();
      }).catch(function (error) {
        speechManifestPromise = null;
        throw error;
      });
    }
    return speechManifestPromise;
  }

  function createPrerenderedEngine(config) {
    var token = 0;
    var active = null;

    function finish(record, result) {
      if (!record || !record.resolve) {
        return;
      }
      var resolve = record.resolve;
      record.resolve = null;
      if (active === record) {
        active = null;
      }
      resolve(result);
    }

    function settleActive(reason) {
      var record = active;
      active = null;
      if (!record) {
        return;
      }
      record.token = -1;
      record.generation = null;
      record.stopKind = 'cancel';
      if (record.source) {
        try {
          record.source.stop();
        } catch (error) {
          /* already stopped */
        }
        record.source = null;
      }
      finish(record, { reason: reason });
    }

    function playSlice(record) {
      var ctx = primeBuiltinAudio();
      if (!ctx || !record.buffer) {
        finish(record, { reason: 'error', error: 'audio' });
        return;
      }
      var remain = record.buffer.duration - record.offset;
      if (!(remain > 0.02)) {
        finish(record, { reason: 'end' });
        return;
      }
      var source = ctx.createBufferSource();
      var generation = {};
      record.generation = generation;
      record.source = source;
      record.stopKind = '';
      source.buffer = record.buffer;
      source.playbackRate.value = record.rate;
      source.connect(ctx.destination);
      record.startedAt = ctx.currentTime;
      source.onended = function () {
        if (record.generation !== generation) {
          return;
        }
        if (record.stopKind === 'pause') {
          record.source = null;
          return;
        }
        if (record.stopKind === 'cancel' || record.token !== token) {
          return;
        }
        finish(record, { reason: 'end' });
      };
      if (!record.paused && typeof record.onSpeaking === 'function') {
        record.onSpeaking();
      }
      try {
        source.start(0, record.offset);
      } catch (error) {
        record.generation = null;
        finish(record, { reason: 'error', error: 'audio' });
      }
    }

    return {
      id: 'piper',
      models: PIPER_MODELS,
      prime: primeBuiltinAudio,
      isAvailable: function () {
        return Promise.resolve(canPlayPrerendered());
      },
      speak: function (text, opts) {
        var my = ++token;
        settleActive('canceled');
        var voiceId = opts && opts.voiceId === 'bijan' ? 'bijan' : 'manijeh';
        var rate = playbackRateFor(opts && opts.rate);
        var record = {
          token: my,
          resolve: null,
          source: null,
          buffer: null,
          offset: 0,
          rate: rate,
          startedAt: 0,
          paused: false,
          stopKind: '',
          generation: null,
          onSpeaking: opts && opts.onSpeaking
        };
        active = record;

        return new Promise(function (resolve) {
          record.resolve = resolve;
          if (my !== token) {
            finish(record, { reason: 'canceled' });
            return;
          }
          var ctx = primeBuiltinAudio();
          if (!ctx) {
            finish(record, { reason: 'error', error: 'audio' });
            return;
          }
          var key = speechKey(text);
          fetchSavedWav(savedFileUrl(config, voiceId, key)).then(function (saved) {
            if (record.token !== my || !record.resolve) {
              return null;
            }
            if (saved) {
              return saved;
            }
            if (opts && typeof opts.onPrepare === 'function') {
              opts.onPrepare();
            }
            return synthesizePiperWav(voiceId, text).then(function (wav) {
              if (wav && record.token === my) {
                storePiperWav(config, voiceId, key, wav);
              }
              return wav;
            });
          }).then(function (wav) {
            if (!wav || record.token !== my || !record.resolve) {
              return null;
            }
            return decodeAudioBuffer(ctx, wav);
          }).then(function (buffer) {
            if (!buffer || record.token !== my || !record.resolve) {
              return;
            }
            record.buffer = buffer;
            if (record.paused) {
              return;
            }
            playSlice(record);
          }).catch(function () {
            if (record.token !== my || !record.resolve) {
              return;
            }
            finish(record, { reason: 'error', error: 'synth' });
          });
        });
      },
      pause: function () {
        if (!active || active.paused) {
          return;
        }
        active.paused = true;
        if (!active.source || !active.buffer || !sharedAudioContext) {
          return;
        }
        var elapsed = (sharedAudioContext.currentTime - active.startedAt) * active.rate;
        active.offset = Math.min(active.buffer.duration, active.offset + Math.max(0, elapsed));
        active.stopKind = 'pause';
        active.generation = null;
        try {
          active.source.stop();
        } catch (error) {
          /* already stopped */
        }
        active.source = null;
      },
      resume: function () {
        if (!active || !active.paused) {
          return;
        }
        active.paused = false;
        active.stopKind = '';
        if (active.buffer) {
          playSlice(active);
        }
      },
      cancel: function () {
        token += 1;
        settleActive('canceled');
      }
    };
  }

  function pickEngine(config) {
    var settings = config || {};
    var chain = Promise.resolve(null);

    if (canPlayPrerendered()) {
      var prerendered = createPrerenderedEngine(settings);
      chain = prerendered.isAvailable().then(function (ready) {
        return ready ? prerendered : null;
      });
    }

    return chain.then(function (engine) {
      if (engine) {
        return engine;
      }
      if (!settings.azureEndpoint) {
        return null;
      }
      var azure = createAzureSpeechEngine({ endpoint: settings.azureEndpoint });
      return azure.isAvailable().then(function (ready) {
        return ready ? azure : null;
      });
    }).then(function (engine) {
      if (engine) {
        return engine;
      }
      if (typeof window === 'undefined') {
        return null;
      }
      var web = createWebSpeechEngine();
      return web.isAvailable().then(function (ready) {
        return ready ? web : null;
      });
    });
  }

  function missingSpeechMessage() {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      return 'این مرورگر خواندن صوتی متن را پشتیبانی نمی‌کند.';
    }
    return 'صدای فارسی در این مرورگر پیدا نشد.';
  }

  function progressLabel(snapshot) {
    if (!snapshot.total) {
      return 'متنی برای خواندن نیست';
    }
    if (snapshot.finished) {
      return 'پایان';
    }
    var current = Math.min(snapshot.total, snapshot.index + 1);
    return 'بخش ' + toPersianDigits(current) + ' از ' + toPersianDigits(snapshot.total);
  }

  function statusLabel(snapshot) {
    if (snapshot.finished) {
      return 'پایان';
    }
    if (snapshot.status === 'playing') {
      return 'در حال پخش';
    }
    if (snapshot.status === 'paused') {
      return 'مکث';
    }
    return 'آماده';
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    var key;
    for (key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key) && attrs[key] != null) {
        if (key === 'className') {
          node.className = attrs[key];
        } else {
          node.setAttribute(key, attrs[key]);
        }
      }
    }
    (children || []).forEach(function (child) {
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function findBootScript() {
    if (document.currentScript && /soti/i.test(document.currentScript.getAttribute('src') || '')) {
      return document.currentScript;
    }
    var scripts = document.getElementsByTagName('script');
    var index;
    for (index = scripts.length - 1; index >= 0; index -= 1) {
      var src = scripts[index].getAttribute('src') || '';
      if (/soti(?:\.min)?\.js(?:$|\?)/i.test(src) || scripts[index].hasAttribute('data-soti')) {
        return scripts[index];
      }
    }
    return null;
  }

  function readConfig(script) {
    var boot = (typeof window !== 'undefined' && window.SOTI_BOOT && typeof window.SOTI_BOOT === 'object')
      ? window.SOTI_BOOT
      : {};
    var selector = boot.selector || '';
    if (!selector && script) {
      selector = script.getAttribute('data-selector') || script.getAttribute('data-article') || '';
    }
    return {
      selector: selector,
      azureEndpoint: typeof boot.azureEndpoint === 'string' ? boot.azureEndpoint : '',
      espeakBackend: boot.espeakBackend || null,
      postId: boot.postId != null ? boot.postId : '',
      audioBase: typeof boot.audioBase === 'string' ? boot.audioBase : '',
      saveEndpoint: typeof boot.saveEndpoint === 'string' ? boot.saveEndpoint : '',
      nonce: typeof boot.nonce === 'string' ? boot.nonce : ''
    };
  }

  function findArticle(selector) {
    if (selector) {
      try {
        return document.querySelector(selector);
      } catch (error) {
        return null;
      }
    }
    var index;
    for (index = 0; index < DEFAULT_SELECTORS.length; index += 1) {
      var node = document.querySelector(DEFAULT_SELECTORS[index]);
      if (node) {
        return node;
      }
    }
    return null;
  }

  function ensureCss(script) {
    if (document.getElementById('soti-css') || document.querySelector('link[data-soti-css]')) {
      return;
    }
    if (!script || !script.src) {
      return;
    }
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = 'soti-css';
    link.setAttribute('data-soti-css', '1');
    link.href = new URL('soti.css', script.src).href;
    document.head.appendChild(link);
  }

  function iconSvg(markup) {
    var holder = document.createElement('span');
    holder.className = 'soti-icon';
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = '<svg viewBox="0 0 24 24" focusable="false">' + markup + '</svg>';
    return holder;
  }

  function buildPlayer() {
    var titleId = 'soti-title-' + (++playerSeq);
    var play = el('button', {
      type: 'button',
      'data-action': 'play',
      'aria-pressed': 'false',
      'aria-label': 'پخش',
      title: 'پخش'
    }, [iconSvg('<path fill="currentColor" d="M9 6.5v11l9.5-5.5z"/>')]);
    var pause = el('button', {
      type: 'button',
      'data-action': 'pause',
      disabled: 'disabled',
      'aria-label': 'مکث',
      title: 'مکث'
    }, [iconSvg('<path fill="currentColor" d="M7 6h3.4v12H7zm6.6 0H17v12h-3.4z"/>')]);
    var stop = el('button', {
      type: 'button',
      'data-action': 'stop',
      disabled: 'disabled',
      'aria-label': 'توقف',
      title: 'توقف'
    }, [iconSvg('<path fill="currentColor" d="M7 7h10v10H7z"/>')]);
    var rates = el('div', { className: 'soti-rates', role: 'group', 'aria-label': 'سرعت', dir: 'ltr' });
    RATES.forEach(function (rate) {
      rates.appendChild(el('button', {
        type: 'button',
        'data-rate': String(rate.value),
        'aria-pressed': rate.value === 1 ? 'true' : 'false',
        'aria-label': 'سرعت ' + rate.label,
        title: 'سرعت ' + rate.label
      }, [rate.label]));
    });
    var voices = el('div', { className: 'soti-voices', role: 'radiogroup', 'aria-label': 'انتخاب صدا' });
    voices.appendChild(el('button', {
      type: 'button',
      role: 'radio',
      'data-voice': 'manijeh',
      'aria-checked': 'true',
      'aria-label': 'منیژه، صدای زن',
      title: 'منیژه، صدای زن'
    }, [iconSvg('<circle cx="12" cy="8.2" r="2.5" fill="currentColor"/><path fill="currentColor" d="M7.6 7.4c.6-2.5 2.3-3.8 4.4-3.8s3.8 1.3 4.4 3.8c.15.6-.55.95-1 .55-1-.85-2.1-1.2-3.4-1.2s-2.4.35-3.4 1.2c-.45.4-1.15.05-1-.55zM8.2 13.4c-1.7 1.6-2.3 3.5-2.3 5.3 0 .7.55 1.2 1.25 1.2h9.7c.7 0 1.25-.5 1.25-1.2 0-1.8-.6-3.7-2.3-5.3-.65-.6-1.55-.15-1.55.6 0 .2.08.4.2.55.95 1 1.45 2.2 1.45 3.45H8.1c0-1.25.5-2.45 1.45-3.45.12-.15.2-.35.2-.55 0-.75-.9-1.2-1.55-.6z"/>')]));
    voices.appendChild(el('button', {
      type: 'button',
      role: 'radio',
      'data-voice': 'bijan',
      'aria-checked': 'false',
      'aria-label': 'بیژن، صدای مرد',
      title: 'بیژن، صدای مرد',
      tabindex: '-1'
    }, [iconSvg('<circle cx="12" cy="8" r="2.6" fill="currentColor"/><path fill="currentColor" d="M5.8 19.2c.7-3.2 3-5.1 6.2-5.1s5.5 1.9 6.2 5.1c.2.75-.4 1.5-1.15 1.5H6.95c-.75 0-1.35-.75-1.15-1.5z"/>')]));

    var fill = el('span', { className: 'soti-progress-fill' });
    var progress = el('div', {
      className: 'soti-progress',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '0',
      'aria-label': 'پیشرفت خواندن'
    }, [fill]);

    var player = el('section', {
      className: 'soti-player',
      dir: 'rtl',
      lang: 'fa',
      'data-soti-player': '1',
      'aria-labelledby': titleId
    }, [
      el('p', { className: 'soti-title soti-sr', id: titleId }, ['شنیدن خبر']),
      el('p', { className: 'soti-status soti-sr', 'aria-live': 'polite' }, ['آماده']),
      el('div', { className: 'soti-bar' }, [
        el('div', { className: 'soti-controls' }, [
          el('div', { className: 'soti-transport', role: 'group', 'aria-label': 'کنترل پخش' }, [play, pause, stop]),
          el('div', { className: 'soti-speed' }, [rates]),
          el('div', { className: 'soti-voice' }, [voices])
        ]),
        progress
      ]),
      el('p', { className: 'soti-progress-text soti-sr' }, ['بخش ۱ از ۱']),
      el('p', { className: 'soti-message', hidden: 'hidden' })
    ]);

    return player;
  }

  function mountPlayer(player, article) {
    var mount = document.querySelector('[data-soti-mount]');
    if (mount) {
      mount.replaceWith(player);
      return;
    }
    if (article.parentNode) {
      article.parentNode.insertBefore(player, article);
    }
  }

  function wirePlayer(player, article, config) {
    var engineReady = false;
    var controller = createController({
      loadChunks: function () {
        return chunkText(extractArticleText(article));
      }
    });
    var playBtn = player.querySelector('[data-action="play"]');
    var pauseBtn = player.querySelector('[data-action="pause"]');
    var stopBtn = player.querySelector('[data-action="stop"]');
    var message = player.querySelector('.soti-message');
    var statusEl = player.querySelector('.soti-status');
    var progressText = player.querySelector('.soti-progress-text');
    var progress = player.querySelector('.soti-progress');
    var fill = player.querySelector('.soti-progress-fill');
    var rateButtons = player.querySelectorAll('[data-rate]');
    var voiceButtons = player.querySelectorAll('[data-voice]');
    var rateGroup = player.querySelector('.soti-rates');
    var voiceGroup = player.querySelector('.soti-voices');

    function showMessage(text) {
      message.hidden = false;
      message.textContent = text;
    }

    function paint(snapshot) {
      var state = snapshot || controller.snapshot();
      statusEl.textContent = statusLabel(state);
      playBtn.setAttribute('aria-pressed', state.status === 'playing' ? 'true' : 'false');
      playBtn.disabled = state.total === 0;
      pauseBtn.disabled = state.status !== 'playing';
      stopBtn.disabled = state.status !== 'playing' && state.status !== 'paused';
      rateButtons.forEach(function (button) {
        button.setAttribute('aria-pressed', Number(button.getAttribute('data-rate')) === state.rate ? 'true' : 'false');
      });
      voiceButtons.forEach(function (button) {
        var selected = button.getAttribute('data-voice') === state.voiceId;
        button.setAttribute('aria-checked', selected ? 'true' : 'false');
        button.tabIndex = selected ? 0 : -1;
      });
      var percent = Math.max(0, Math.min(100, Math.round(state.progress * 100)));
      progress.setAttribute('aria-valuenow', String(percent));
      progress.setAttribute('aria-valuetext', progressLabel(state));
      fill.style.width = percent + '%';
      progressText.textContent = progressLabel(state);
    }

    controller.onChange = paint;
    controller.onEmpty = function () {
      showMessage('متنی برای خواندن پیدا نشد.');
      paint();
    };
    controller.onError = function () {
      engineReady = false;
      showMessage(ENGINE_FAILURE_MESSAGE);
      paint();
    };
    controller.onPrepare = function () {
      if (controller.snapshot().status === 'playing') {
        statusEl.textContent = PREPARING_MESSAGE;
        showMessage(PREPARING_MESSAGE);
      }
    };
    controller.onSpeaking = function () {
      if (message.textContent === PREPARING_MESSAGE) {
        message.hidden = true;
        message.textContent = '';
      }
      if (controller.snapshot().status === 'playing') {
        statusEl.textContent = 'در حال پخش';
      }
    };

    playBtn.addEventListener('click', function () {
      // Resume inside the click, before any wasm await, or autoplay stays blocked.
      primeBuiltinAudio();
      if (controller.engine && typeof controller.engine.prime === 'function') {
        controller.engine.prime();
      }
      if (engineReady) {
        controller.play();
        return;
      }
      pickEngine(config).then(function (engine) {
        applyEngine(engine);
        if (engine) {
          controller.play();
        }
      });
    });
    pauseBtn.addEventListener('click', function () {
      controller.pause();
    });
    stopBtn.addEventListener('click', function () {
      controller.stop();
    });
    rateButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        controller.setRate(Number(button.getAttribute('data-rate')));
      });
    });
    voiceButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        controller.setVoice(button.getAttribute('data-voice'));
      });
    });

    rateGroup.addEventListener('keydown', function (event) {
      var direction = 0;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        direction = 1;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        direction = -1;
      } else {
        return;
      }
      event.preventDefault();
      var values = RATES.map(function (rate) {
        return rate.value;
      });
      var index = values.indexOf(controller.snapshot().rate);
      if (index < 0) {
        index = 1;
      }
      index = Math.max(0, Math.min(values.length - 1, index + direction));
      controller.setRate(values[index]);
      var next = rateGroup.querySelector('[data-rate="' + values[index] + '"]');
      if (next) {
        next.focus();
      }
    });

    voiceGroup.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return;
      }
      event.preventDefault();
      var nextVoice = controller.snapshot().voiceId === 'manijeh' ? 'bijan' : 'manijeh';
      controller.setVoice(nextVoice);
      var next = voiceGroup.querySelector('[data-voice="' + nextVoice + '"]');
      if (next) {
        next.focus();
      }
    });

    function applyEngine(engine) {
      if (controller.snapshot().status !== 'idle') {
        return;
      }
      engineReady = Boolean(engine);
      controller.setEngine(engine);
      if (!engineReady) {
        showMessage(missingSpeechMessage());
      } else if (!controller.snapshot().total) {
        showMessage('متنی برای خواندن پیدا نشد.');
      } else {
        message.hidden = true;
      }
      paint();
    }

    paint();
    pickEngine(config).then(applyEngine);
    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', function () {
        pickEngine(config).then(applyEngine);
      });
    }

    return controller;
  }

  var booted = false;

  function boot() {
    if (booted || document.querySelector('[data-soti-player]')) {
      booted = true;
      return;
    }
    var script = findBootScript();
    var config = readConfig(script);
    var article = findArticle(config.selector);
    if (!article) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
      }
      return;
    }
    booted = true;
    ensureCss(script);
    var player = buildPlayer();
    mountPlayer(player, article);
    wirePlayer(player, article, config);
  }

  function start() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
      return;
    }
    boot();
  }

  return {
    RATES: RATES,
    AZURE_VOICES: AZURE_VOICES,
    ESPEAK_VOICES: ESPEAK_VOICES,
    ESPEAK_PITCH: ESPEAK_PITCH,
    ENGINE_FAILURE_MESSAGE: ENGINE_FAILURE_MESSAGE,
    DEFAULT_SELECTORS: DEFAULT_SELECTORS,
    DEFAULT_CHUNK_LENGTH: DEFAULT_CHUNK_LENGTH,
    chunkText: chunkText,
    extractArticleText: extractArticleText,
    resolveFaVoice: resolveFaVoice,
    isFaVoice: isFaVoice,
    espeakSpeed: espeakSpeed,
    PIPER_MODELS: PIPER_MODELS,
    speechKey: speechKey,
    playbackRateFor: playbackRateFor,
    canUseBuiltinEspeak: canUseBuiltinEspeak,
    createBuiltinEspeakEngine: createBuiltinEspeakEngine,
    primeBuiltinAudio: primeBuiltinAudio,
    toPersianDigits: toPersianDigits,
    createController: createController,
    createWebSpeechEngine: createWebSpeechEngine,
    createAzureSpeechEngine: createAzureSpeechEngine,
    createEspeakNgEngine: createEspeakNgEngine,
    pickEngine: pickEngine,
    missingSpeechMessage: missingSpeechMessage,
    start: start
  };
});
