// TAIWAN BAR BIBLE — Service Worker
// 讓網站能離線使用。改版時把 VERSION 加一，舊快取會自動清掉。
const VERSION = 'barbible-v1';

// 本站自己的檔案：安裝時就全部抓下來
const CORE = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      // 個別加入，單一檔案失敗不會讓整個安裝失敗
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 地圖圖磚不快取：量大又會塞爆儲存空間，離線時就讓它顯示空白
  if (url.hostname.endsWith('basemaps.cartocdn.com')) return;

  // 本站檔案：優先用網路（確保拿到最新資料），失敗才回快取
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // CDN 資源（Leaflet）：優先用快取，沒有再抓
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
