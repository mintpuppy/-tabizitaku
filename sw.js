/* 旅の準備 — Service Worker
   アプリを更新したら、下の VERSION の数字を1つ増やしてからアップロードしてください。
   それだけで、次に開いたときに新しい内容が読み込まれます。 */
var VERSION = "v3";
var CACHE = "tabi-no-junbi-" + VERSION;

/* すべて相対パス。GitHub Pages のサブパス（/リポジトリ名/）でもそのまま動きます */
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      /* 1つでも足りないファイルがあると全部失敗する addAll は使わず、1件ずつ入れる */
      return Promise.all(ASSETS.map(function(url){
        return cache.add(url).catch(function(){ /* 無ければ飛ばす */ });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;

  /* ページ本体は「通信優先・失敗したらキャッシュ」。更新が確実に届き、圏外でも開けます */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* アイコンなどは「キャッシュ優先」。表示が速く、通信も使いません */
  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      });
    })
  );
});
