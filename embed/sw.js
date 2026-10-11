/* Saves synthesized clips for the static demo. WordPress uses its own REST route. */
'use strict';

var CACHE = 'shenidar-audio';

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function fileUrl(postId, voice, key) {
  return new URL('uploads/shenidar/' + postId + '/' + voice + '/' + key + '.wav', self.registration.scope).href;
}

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (event.request.method === 'POST' && /\/shenidar\/v1\/audio$/.test(url.pathname)) {
    event.respondWith(storeClip(event.request));
    return;
  }
  if (event.request.method === 'GET' && url.pathname.indexOf('/uploads/shenidar/') !== -1) {
    event.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match(event.request).then(function (hit) {
        if (hit) {
          return hit;
        }
        return new Response('', {
          status: 404,
          headers: { 'Cache-Control': 'no-store' }
        });
      });
    }));
  }
});

function storeClip(request) {
  return request.formData().then(function (form) {
    var postId = String(form.get('post_id') || '');
    var voice = String(form.get('voice') || '');
    var key = String(form.get('key') || '');
    var audio = form.get('audio');
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(postId) || (voice !== 'manijeh' && voice !== 'bijan') || !/^[a-f0-9]+-[0-9]+$/.test(key) || !audio || typeof audio.arrayBuffer !== 'function') {
      return new Response('no', { status: 400 });
    }
    return audio.arrayBuffer().then(function (buffer) {
      var mark = new Uint8Array(buffer, 0, 4);
      if (buffer.byteLength < 44 || buffer.byteLength > 2000000 || mark[0] !== 82 || mark[1] !== 73 || mark[2] !== 70 || mark[3] !== 70) {
        return new Response('wav', { status: 400 });
      }
      var saved = fileUrl(postId, voice, key);
      var response = new Response(buffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/wav' }
      });
      return caches.open(CACHE).then(function (cache) {
        return cache.put(saved, response.clone()).then(function () {
          return new Response(JSON.stringify({ url: saved }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      });
    });
  }).catch(function () {
    return new Response('bad', { status: 400 });
  });
}
