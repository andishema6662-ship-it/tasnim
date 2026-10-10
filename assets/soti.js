/**
 * Soti (صوتی) reads a Persian news article aloud.
 *
 * Default engine: the browser Web Speech API (speechSynthesis), fa-IR, no key.
 * منیژه picks the best female fa-IR voice. بیژن picks the best male fa-IR voice.
 * Neshan's proprietary Manijeh and Bijan recordings are not used.
 *
 * Optional adapters, inactive unless the site supplies them:
 * - eSpeak NG: female fa+f2, male fa+m3, speed = 175 × rate (clamped 80–450)
 * - Azure AI Speech proxy: fa-IR-DilaraNeural / fa-IR-FaridNeural, rate in JSON
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
    { value: 0.75, label: '۰٫۷۵' },
    { value: 1, label: '۱' },
    { value: 1.25, label: '۱٫۲۵' },
    { value: 1.5, label: '۱٫۵' },
    { value: 1.75, label: '۱٫۷۵' },
    { value: 2, label: '۲ برابر' }
  ];

  var AZURE_VOICES = {
    manijeh: 'fa-IR-DilaraNeural',
    bijan: 'fa-IR-FaridNeural'
  };

  var ESPEAK_VOICES = {
    manijeh: 'fa+f2',
    bijan: 'fa+m3'
  };

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

  function espeakSpeed(rate) {
    var speed = Math.round(175 * (Number(rate) || 1));
    if (speed < 80) {
      return 80;
    }
    if (speed > 450) {
      return 450;
    }
    return speed;
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
          rate: Number(opts && opts.rate) || 1
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
        var rate = Number(opts && opts.rate) || 1;
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
            utterance.rate = Number(opts && opts.rate) || 1;
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
      rate: Number(settings.rate) || 1,
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
      var value = Number(rate);
      if (!Number.isFinite(value) || value <= 0 || value === controller.rate) {
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
            rate: controller.rate
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

  function pickEngine(config) {
    var settings = config || {};
    var espeakBackend = settings.espeakBackend || (typeof window !== 'undefined' ? window.SOTI_ESPEAK_BACKEND : null);
    var chain = Promise.resolve(null);

    if (espeakBackend) {
      chain = createEspeakNgEngine(espeakBackend).isAvailable().then(function (ready) {
        return ready ? createEspeakNgEngine(espeakBackend) : null;
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
      espeakBackend: boot.espeakBackend || null
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

  function buildPlayer() {
    var titleId = 'soti-title-' + (++playerSeq);
    var play = el('button', { type: 'button', 'data-action': 'play', 'aria-pressed': 'false' }, ['پخش']);
    var pause = el('button', { type: 'button', 'data-action': 'pause', disabled: 'disabled' }, ['مکث']);
    var stop = el('button', { type: 'button', 'data-action': 'stop', disabled: 'disabled' }, ['توقف']);
    var rates = el('div', { className: 'soti-rates', role: 'group', 'aria-label': 'سرعت', dir: 'ltr' });
    RATES.forEach(function (rate) {
      rates.appendChild(el('button', {
        type: 'button',
        'data-rate': String(rate.value),
        'aria-pressed': rate.value === 1 ? 'true' : 'false',
        'aria-label': 'سرعت ' + rate.label
      }, [rate.label]));
    });
    var voices = el('div', { className: 'soti-voices', role: 'radiogroup', 'aria-label': 'انتخاب صدا' });
    voices.appendChild(el('button', {
      type: 'button',
      role: 'radio',
      'data-voice': 'manijeh',
      'aria-checked': 'true',
      'aria-label': 'منیژه، صدای زن',
      title: 'صدای زن فارسی'
    }, ['منیژه']));
    voices.appendChild(el('button', {
      type: 'button',
      role: 'radio',
      'data-voice': 'bijan',
      'aria-checked': 'false',
      'aria-label': 'بیژن، صدای مرد',
      tabindex: '-1',
      title: 'صدای مرد فارسی'
    }, ['بیژن']));

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
      el('div', { className: 'soti-top' }, [
        el('p', { className: 'soti-title', id: titleId }, ['شنیدن خبر']),
        el('p', { className: 'soti-status', 'aria-live': 'polite' }, ['آماده'])
      ]),
      el('div', { className: 'soti-controls' }, [
        el('div', { className: 'soti-transport', role: 'group', 'aria-label': 'کنترل پخش' }, [play, pause, stop]),
        el('div', { className: 'soti-speed' }, [
          el('span', { className: 'soti-label' }, ['سرعت']),
          rates
        ]),
        el('div', { className: 'soti-voice' }, [
          el('span', { className: 'soti-label' }, ['صدا']),
          voices
        ])
      ]),
      progress,
      el('p', { className: 'soti-progress-text' }, ['بخش ۱ از ۱']),
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
      showMessage(missingSpeechMessage());
      paint();
    };

    playBtn.addEventListener('click', function () {
      if (engineReady) {
        controller.play();
        return;
      }
      // Some browsers only expose fa-IR voices after a user gesture.
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
    DEFAULT_SELECTORS: DEFAULT_SELECTORS,
    DEFAULT_CHUNK_LENGTH: DEFAULT_CHUNK_LENGTH,
    chunkText: chunkText,
    extractArticleText: extractArticleText,
    resolveFaVoice: resolveFaVoice,
    isFaVoice: isFaVoice,
    espeakSpeed: espeakSpeed,
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
