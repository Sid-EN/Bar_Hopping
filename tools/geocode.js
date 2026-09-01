#!/usr/bin/env node
/**
 * 用 OpenStreetMap Nominatim 補上酒吧經緯度（免費、免金鑰），供地圖模式與跑吧路線使用。
 *
 * 用法：
 *   node tools/geocode.js            # 抓取並寫回 data.js（會沿用快取）
 *   node tools/geocode.js --dry-run  # 只抓取，不改 data.js
 *
 * 注意：Nominatim 規定每秒最多 1 次查詢，所以 222 間大約要跑 5~10 分鐘。
 *      結果會邊抓邊存到 tools/geocode_cache.json，中斷後重跑不會白費。
 *      OSM 在台灣的門牌覆蓋不完整，查不到的店不會亂填，就是留空。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_JS = path.join(ROOT, 'data.js');
const CACHE = path.join(__dirname, 'geocode_cache.json');
const UA = 'BarHopping-TaiwanBarBible/1.0 (https://github.com/Sid-EN/Bar_Hopping)';
const DRY_RUN = process.argv.includes('--dry-run');

// 台灣本島與離島的合理經緯度範圍，用來擋掉明顯抓錯的結果
const BOUNDS = { latMin: 21.5, latMax: 26.5, lngMin: 118.0, lngMax: 122.2 };
const inTaiwan = (lat, lng) => lat > BOUNDS.latMin && lat < BOUNDS.latMax && lng > BOUNDS.lngMin && lng < BOUNDS.lngMax;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 縣市別名（台/臺 兩種寫法都要認）
const CITY_ALIAS = {
  '台北市': ['臺北市', '台北市'], '新北市': ['新北市'], '基隆市': ['基隆市'], '桃園市': ['桃園市'],
  '新竹市': ['新竹市'], '新竹縣': ['新竹縣', '新竹市'], '苗栗縣': ['苗栗縣'], '台中市': ['臺中市', '台中市'],
  '彰化縣': ['彰化縣'], '南投縣': ['南投縣'], '雲林縣': ['雲林縣'], '嘉義市': ['嘉義市'], '嘉義縣': ['嘉義縣', '嘉義市'],
  '台南市': ['臺南市', '台南市'], '高雄市': ['高雄市'], '屏東縣': ['屏東縣'], '宜蘭縣': ['宜蘭縣'],
  '花蓮縣': ['花蓮縣'], '台東縣': ['臺東縣', '台東縣'], '澎湖縣': ['澎湖縣'], '金門縣': ['金門縣'], '連江縣': ['連江縣']
};

// Nominatim 常把「Light House」配到花蓮的燈塔這類完全不同的地方，
// 所以比對回傳地址裡的縣市，對不上就視為查無，寧可留空也不要標錯位置。
function cityMatches(bar, result) {
  if (!result || !result.matched) return false;
  return (CITY_ALIAS[bar.city] || [bar.city]).some(a => result.matched.includes(a));
}


async function query(params) {
  const url = 'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ format: 'json', limit: '1', countrycodes: 'tw', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-TW' } });
  if (res.status === 429) { console.log('  (被限速，暫停 10 秒)'); await sleep(10000); return null; }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  if (!j.length) return null;
  const lat = parseFloat(j[0].lat), lng = parseFloat(j[0].lon);
  if (!inTaiwan(lat, lng)) return null;
  return { lat, lng, matched: j[0].display_name, osm: j[0].osm_type + '/' + j[0].osm_id };
}

// 由精確到寬鬆，逐一嘗試；一命中就停
function strategies(bar) {
  const list = [];
  const cityShort = bar.city.replace(/[市縣]$/, '');
  if (bar.address) {
    list.push({ q: bar.address });
    // 去掉樓層與括號補述
    const clean = bar.address.replace(/\s*[（(].*?[)）]\s*/g, '').replace(/\d+樓.*$/, '').trim();
    if (clean !== bar.address) list.push({ q: clean });
    // 只留到路名，去掉門牌號
    const street = clean.replace(/\d+(-\d+)?號.*$/, '').trim();
    if (street && street !== clean) list.push({ q: street });
  }
  list.push({ q: `${bar.name} ${cityShort}` });
  list.push({ q: bar.name });
  return list;
}

(async () => {
  const src = fs.readFileSync(DATA_JS, 'utf8');
  const { BARS } = new Function(src + '; return { BARS };')();
  let cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

  let hit = 0, miss = 0, cached = 0, i = 0;
  for (const bar of BARS) {
    const key = `${bar.name}|${bar.city}`;
    i++;
    if (cache[key] !== undefined) { cached++; if (cache[key]) hit++; else miss++; continue; }

    let found = null;
    for (const s of strategies(bar)) {
      try { found = await query(s); } catch (e) { console.log(`\n  ${bar.name}: ${e.message}`); }
      await sleep(1100);                      // 遵守 Nominatim 每秒 1 次的規範
      if (found && !cityMatches(bar, found)) found = null;   // 縣市對不上就不採用
      if (found) break;
    }
    cache[key] = found;
    found ? hit++ : miss++;
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
    console.log(`[${i}/${BARS.length}] ${found ? '✓' : '✗'} ${bar.name}${found ? '  ' + found.lat.toFixed(4) + ',' + found.lng.toFixed(4) : ''}`);
  }

  console.log(`\n完成：命中 ${hit}、查無 ${miss}（其中 ${cached} 筆取自快取）`);
  if (DRY_RUN) { console.log('--dry-run：未修改 data.js'); return; }

  // 寫回 data.js
  const KEY_ORDER = ['name', 'city', 'district', 'type', 'purpose', 'style', 'price', 'budget',
                     'address', 'phone', 'hours', 'lat', 'lng', 'rating', 'ratingCount',
                     'awards', 'special', 'status', 'note'];
  const header = src.slice(0, src.indexOf('const BARS = ['));
  const lines = [];
  let lastCity = '';
  for (const bar of BARS) {
    const g = cache[`${bar.name}|${bar.city}`];
    const b = g ? { ...bar, lat: Math.round(g.lat * 1e6) / 1e6, lng: Math.round(g.lng * 1e6) / 1e6 } : bar;
    if (b.city !== lastCity) { lines.push('', `  // ───── ${b.city} ─────`); lastCity = b.city; }
    lines.push('  {' + KEY_ORDER.filter(k => b[k] !== undefined).map(k => `${k}: ${JSON.stringify(b[k])}`).join(', ') + '},');
  }
  fs.writeFileSync(DATA_JS, header + 'const BARS = [\n' + lines.join('\n') + '\n];\n');
  console.log(`data.js 已更新，${hit} 間有座標`);
})();
