const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const t = (n, c, e) => { c ? pass++ : fail++; console.log(c ? ' PASS' : ' FAIL', n, !c && e !== undefined ? '→ ' + e : ''); };

console.log('=== manifest ===');
const m = JSON.parse(fs.readFileSync(ROOT + '/manifest.json', 'utf8'));
t('有 name 與 short_name', !!m.name && !!m.short_name);
t('display 為 standalone', m.display === 'standalone');
t('start_url 為相對路徑', m.start_url.startsWith('./'), m.start_url);
t('scope 為相對路徑', m.scope === './');
t('有 192 與 512 圖示', m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'));
t('有 maskable 圖示', m.icons.some(i => i.purpose === 'maskable'));
t('所有圖示檔都存在', m.icons.every(i => fs.existsSync(path.join(ROOT, i.src))),
  m.icons.filter(i => !fs.existsSync(path.join(ROOT, i.src))).map(i => i.src).join(','));

console.log('=== service worker ===');
const sw = fs.readFileSync(ROOT + '/sw.js', 'utf8');
const core = [...sw.matchAll(/'(\.\/[^']*)'/g)].map(x => x[1]).filter(u => u !== './');
t('CORE 檔案都存在', core.every(u => fs.existsSync(path.join(ROOT, u.replace('./', '')))),
  core.filter(u => !fs.existsSync(path.join(ROOT, u.replace('./', '')))).join(','));
t('有 install 事件', sw.includes("addEventListener('install'"));
t('有 activate 清舊快取', sw.includes("addEventListener('activate'") && sw.includes('caches.delete'));
t('有 fetch 攔截', sw.includes("addEventListener('fetch'"));
t('地圖圖磚不快取', sw.includes('basemaps.cartocdn.com') && sw.includes('return;'));
t('本站資源走 network-first', sw.indexOf('fetch(req)') < sw.indexOf('caches.match(req)'));

console.log('=== index.html PWA 標頭 ===');
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
t('連結 manifest', /<link[^>]*rel="manifest"[^>]*href="manifest\.json"/.test(html));
t('有 theme-color', /name="theme-color"/.test(html));
t('有 apple-touch-icon', /rel="apple-touch-icon"/.test(html));
t('有 description', /name="description"/.test(html));

console.log('=== 註冊邏輯 ===');
const app = fs.readFileSync(ROOT + '/app.js', 'utf8');
t('註冊 service worker', app.includes("serviceWorker.register('sw.js')"));
t('file:// 開啟時不註冊', app.includes("location.protocol.startsWith('http')"));
t('註冊失敗不影響使用', /register\('sw\.js'\)\.catch/.test(app));

console.log('=== 相對路徑（GitHub Pages 子目錄）===');
t('index 不含絕對根路徑 src', !/(src|href)="\/(?!\/)/.test(html), (html.match(/(src|href)="\/(?!\/)[^"]*/g) || []).join(','));
t('manifest 路徑皆相對', m.icons.every(i => !i.src.startsWith('/')));

console.log('\n通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
process.exit(fail ? 1 : 0);
