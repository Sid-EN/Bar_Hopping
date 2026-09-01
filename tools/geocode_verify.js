#!/usr/bin/env node
/**
 * 檢查已抓到的座標是否真的落在該店所屬縣市，把配錯的清掉並重寫 data.js。
 * Nominatim 有時會把「Light House」配到花蓮的燈塔這類完全不同的地方，
 * 標錯位置比沒有位置更糟，所以對不上就直接留空。
 *
 * 用法：node tools/geocode_verify.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, 'geocode_cache.json');

const CITY_ALIAS = {
  '台北市': ['臺北市', '台北市'], '新北市': ['新北市'], '基隆市': ['基隆市'], '桃園市': ['桃園市'],
  '新竹市': ['新竹市'], '新竹縣': ['新竹縣', '新竹市'], '苗栗縣': ['苗栗縣'], '台中市': ['臺中市', '台中市'],
  '彰化縣': ['彰化縣'], '南投縣': ['南投縣'], '雲林縣': ['雲林縣'], '嘉義市': ['嘉義市'], '嘉義縣': ['嘉義縣', '嘉義市'],
  '台南市': ['臺南市', '台南市'], '高雄市': ['高雄市'], '屏東縣': ['屏東縣'], '宜蘭縣': ['宜蘭縣'],
  '花蓮縣': ['花蓮縣'], '台東縣': ['臺東縣', '台東縣'], '澎湖縣': ['澎湖縣'], '金門縣': ['金門縣'], '連江縣': ['連江縣']
};
const cityMatches = (bar, r) => !!r && !!r.matched &&
  (CITY_ALIAS[bar.city] || [bar.city]).some(a => r.matched.includes(a));

const src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
const { BARS } = new Function(src + '; return { BARS };')();
const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

let removed = 0, kept = 0;
for (const bar of BARS) {
  const key = `${bar.name}|${bar.city}`;
  const r = cache[key];
  if (!r) continue;
  if (cityMatches(bar, r)) { kept++; continue; }
  console.log(`  移除 ${bar.name}（${bar.city}）→ 實際配到：${r.matched.slice(0, 60)}`);
  cache[key] = null;
  removed++;
}
fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));

// 重寫 data.js
const KEY_ORDER = ['name', 'city', 'district', 'type', 'purpose', 'style', 'price', 'budget',
                   'address', 'phone', 'hours', 'lat', 'lng', 'rating', 'ratingCount',
                   'awards', 'special', 'status', 'note'];
const header = src.slice(0, src.indexOf('const BARS = ['));
const lines = [];
let lastCity = '';
for (const bar of BARS) {
  const g = cache[`${bar.name}|${bar.city}`];
  const b = { ...bar };
  if (g) { b.lat = Math.round(g.lat * 1e6) / 1e6; b.lng = Math.round(g.lng * 1e6) / 1e6; }
  else { delete b.lat; delete b.lng; }
  if (b.city !== lastCity) { lines.push('', `  // ───── ${b.city} ─────`); lastCity = b.city; }
  lines.push('  {' + KEY_ORDER.filter(k => b[k] !== undefined).map(k => `${k}: ${JSON.stringify(b[k])}`).join(', ') + '},');
}
fs.writeFileSync(path.join(ROOT, 'data.js'), header + 'const BARS = [\n' + lines.join('\n') + '\n];\n');

console.log(`\n驗證完成：保留 ${kept} 筆、移除 ${removed} 筆配錯的座標。`);
