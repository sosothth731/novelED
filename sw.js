/* novelED 서비스 워커 — 같은 사이트의 파일만 '인터넷 먼저, 안 되면 저장본' 방식으로 보관.
   Firebase/구글 요청(로그인·데이터 동기화)은 절대 건드리지 않음. 앱을 수정해서 올리면 바로 새 버전이 뜸. */
const CACHE = 'noveled-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./')))
  );
});
