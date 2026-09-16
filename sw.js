/* 离线缓存 Service Worker
   —— 导航请求网络优先（内容始终最新），静态资源缓存优先 + 后台更新。
   改动站点后无需再维护缓存清单，仅调整 CACHE 版本号可强制刷新旧缓存。 */
const CACHE = 'portfolio-v2';
const SHELL = ['./', './index.html', './styles.css', './script.js', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 页面导航：网络优先，断网时回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  // 同源静态资源：缓存优先，命中后后台静默更新
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (!/\.(?:css|js|jpg|jpeg|png|webp|avif|svg|mp4|woff2?|ttf|webmanifest)$/i.test(url.pathname)) return;

  e.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
